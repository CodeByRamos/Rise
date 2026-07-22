import type { ReactNode } from "react";
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type TextProps,
  type ViewStyle,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cores, raio, espaco, tipo } from "../theme";
import { useHaptics } from "../hooks/useHaptics";

/* ─────────────────────────────  Texto  ───────────────────────────── */

type Variante = keyof typeof tipo;
interface AppTextProps extends TextProps {
  variante?: Variante;
  cor?: keyof typeof cores;
  tabular?: boolean;
  centro?: boolean;
}

/** Texto tipado ao design system — evita fontSize/cor soltos nas telas. */
export function AppText({
  variante = "corpo",
  cor = "snow",
  tabular,
  centro,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        tipo[variante] as TextStyle,
        { color: cores[cor] },
        centro && { textAlign: "center" },
        tabular && { fontVariant: ["tabular-nums"] },
        style,
      ]}
      {...rest}
    />
  );
}

/* ─────────────────────────────  Screen  ──────────────────────────── */

interface ScreenProps {
  children: ReactNode;
  /** Remove o padding horizontal padrão (listas full-bleed). */
  semPadding?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Casca de tela: SafeArea + fundo Void. Base de toda tela. */
export function Screen({ children, semPadding, style }: ScreenProps) {
  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <View
        style={[
          { flex: 1 },
          !semPadding && { paddingHorizontal: espaco.xl },
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

/* ─────────────────────────────  Card  ────────────────────────────── */

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevado?: boolean;
  onPress?: () => void;
}

export function Card({ children, style, elevado, onPress }: CardProps) {
  const conteudo = (
    <View
      style={[
        s.card,
        { backgroundColor: elevado ? cores.surface2 : cores.surface },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress) return conteudo;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }}
    >
      {conteudo}
    </Pressable>
  );
}

/* ─────────────────────────────  Button  ──────────────────────────── */

interface ButtonProps {
  titulo: string;
  onPress: () => void;
  variante?: "primario" | "fantasma" | "perigo";
  ocupado?: boolean;
  desabilitado?: boolean;
  semHaptic?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  titulo,
  onPress,
  variante = "primario",
  ocupado,
  desabilitado,
  semHaptic,
  style,
}: ButtonProps) {
  const { toque } = useHaptics();
  const bloqueado = ocupado || desabilitado;
  const fundo =
    variante === "primario"
      ? cores.brand
      : variante === "perigo"
        ? "transparent"
        : "transparent";
  const corTexto =
    variante === "primario" ? cores.void : variante === "perigo" ? cores.erro : cores.snow;
  const borda = variante === "fantasma" ? cores.lineStrong : "transparent";

  return (
    <Pressable
      onPress={() => {
        if (bloqueado) return;
        if (!semHaptic) toque();
        onPress();
      }}
      disabled={bloqueado}
      style={({ pressed }) => [
        s.botao,
        { backgroundColor: fundo, borderColor: borda, borderWidth: borda === "transparent" ? 0 : 1 },
        pressed && !bloqueado && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        bloqueado && { opacity: 0.5 },
        style,
      ]}
    >
      {ocupado ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <Text style={[tipo.corpoForte as TextStyle, { color: corTexto }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

/* ─────────────────────────────  Badge / Divider  ─────────────────── */

export function Badge({ texto, cor = "brand" }: { texto: string; cor?: keyof typeof cores }) {
  return (
    <View style={[s.badge, { backgroundColor: cores.brandSoft }]}>
      <Text style={[tipo.micro as TextStyle, { color: cores[cor], letterSpacing: 0.5 }]}>
        {texto}
      </Text>
    </View>
  );
}

export function Divider() {
  return <View style={s.divider} />;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: cores.void },
  card: {
    borderColor: cores.line,
    borderWidth: 1,
    borderRadius: raio.card,
    padding: espaco.lg,
  },
  botao: {
    borderRadius: raio.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: raio.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  divider: { height: 1, backgroundColor: cores.line, marginVertical: espaco.lg },
});
