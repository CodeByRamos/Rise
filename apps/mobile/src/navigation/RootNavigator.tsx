import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { cores } from "../theme";
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
      {session ? <AppTabs /> : <LoginScreen />}
    </NavigationContainer>
  );
}

const s = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: cores.void,
    justifyContent: "center",
    alignItems: "center",
  },
});
