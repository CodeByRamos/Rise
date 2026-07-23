import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { cores, espaco } from "../theme";
import { AppText } from "../components/ui";
import { useBiometricLock } from "../hooks/useBiometricLock";
import { AppTabs } from "./AppTabs";
import { LoginScreen } from "../screens/LoginScreen";

// Tema de navegação: fundo Void (sem flash branco entre telas).
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: cores.void,
    card: cores.surface,
    text: cores.snow,
    border: cores.line,
    primary: cores.brand,
  },
};

// Deep linking: rise://... e https (universal links entram na config de EAS).
const linking = {
  prefixes: ["rise://", "https://rise.app"],
  config: {
    screens: {
      Hoje: "hoje",
      Evolucao: "evolucao",
      Comunidade: "comunidade",
      Coach: "coach",
      Perfil: "perfil",
    },
  },
};

/**
 * Raiz de navegação com gate de auth. Sessão vem do Supabase (Keychain seguro);
 * onAuthStateChange troca Login ⇄ App sem recriar providers. Splash até saber
 * o estado da sessão (evita piscar Login para quem já está logado).
 */
export function RootNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setPronto(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!pronto) {
    return (
      <View style={s.splash}>
        <ActivityIndicator color={cores.brand} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      {session ? <SessaoProtegida /> : <LoginScreen />}
    </NavigationContainer>
  );
}

/** Envolve o app logado com o bloqueio biométrico local (cold start). */
function SessaoProtegida() {
  const { estado, desbloquear } = useBiometricLock();

  if (estado === "desbloqueado") return <AppTabs />;

  return (
    <View style={s.lock}>
      <Feather name="lock" size={32} color={cores.brand} />
      <AppText variante="h3" cor="snow" centro style={{ marginTop: espaco.lg }}>
        Rise bloqueado
      </AppText>
      <AppText variante="peq" cor="muted" centro style={{ marginTop: espaco.sm }}>
        Use sua biometria para continuar.
      </AppText>
      {estado === "bloqueado" && (
        <Pressable style={s.desbloquear} onPress={() => void desbloquear()}>
          <AppText variante="corpoForte" cor="void">Desbloquear</AppText>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: cores.void,
    justifyContent: "center",
    alignItems: "center",
  },
  lock: {
    flex: 1,
    backgroundColor: cores.void,
    justifyContent: "center",
    alignItems: "center",
    padding: espaco.xxl,
  },
  desbloquear: {
    marginTop: espaco.xl,
    backgroundColor: cores.brand,
    borderRadius: 14,
    paddingHorizontal: espaco.xxl,
    paddingVertical: 14,
  },
});
