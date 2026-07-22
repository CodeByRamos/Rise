import { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { supabase } from "../lib/supabase";
import { cores, raio, espaco } from "../theme";
import { AppText, Button } from "../components/ui";
import { useHaptics } from "../hooks/useHaptics";

type Modo = "entrar" | "criar" | "recuperar";

/** Erros do Supabase Auth traduzidos para ações claras (paridade com a web). */
function traduzirErro(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "E-mail ou senha incorretos. Se acabou de criar a conta, confirme o e-mail antes de entrar.";
  if (m.includes("email not confirmed"))
    return "Este e-mail ainda não foi confirmado. Confira sua caixa de entrada (e o spam).";
  if (m.includes("user already registered"))
    return "Este e-mail já tem conta. Entre com sua senha ou recupere-a.";
  if (m.includes("password should be at least"))
    return "A senha precisa de pelo menos 6 caracteres.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas. Aguarde um minuto e tente de novo.";
  return message;
}

export function LoginScreen() {
  const { sucesso, erro: hapticErro } = useHaptics();
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  function trocar(m: Modo) {
    setModo(m);
    setErro(null);
    setMsg(null);
  }

  async function enviar() {
    setOcupado(true);
    setErro(null);
    setMsg(null);
    try {
      if (modo === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMsg("Se este e-mail tiver conta, você receberá um link para redefinir a senha.");
        return;
      }
      if (modo === "criar") {
        const { data, error } = await supabase.auth.signUp({ email, password: senha });
        if (error) throw error;
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          setErro("Este e-mail já tem conta. Entre com sua senha ou recupere-a.");
          setModo("entrar");
          return;
        }
        if (!data.session) {
          setMsg("Confirme seu e-mail pelo link que enviamos — só depois dá para entrar.");
          setModo("entrar");
          return;
        }
        sucesso();
        return; // gate troca via onAuthStateChange
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
      sucesso();
    } catch (e) {
      hapticErro();
      setErro(traduzirErro(e instanceof Error ? e.message : "Erro inesperado."));
    } finally {
      setOcupado(false);
    }
  }

  const podeEnviar =
    modo === "recuperar" ? email.length > 3 : email.length > 3 && senha.length >= 6;

  return (
    <KeyboardAvoidingView
      style={s.tela}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.card}>
        <AppText variante="display" cor="snow" style={{ letterSpacing: -1.5 }}>
          Rise
        </AppText>
        <AppText variante="peq" cor="muted" style={{ marginBottom: espaco.md }}>
          O videogame da vida real.
        </AppText>

        <TextInput
          style={s.input}
          placeholder="E-mail"
          placeholderTextColor={cores.faint}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        {modo !== "recuperar" && (
          <TextInput
            style={s.input}
            placeholder="Senha"
            placeholderTextColor={cores.faint}
            secureTextEntry
            autoComplete={modo === "entrar" ? "current-password" : "new-password"}
            value={senha}
            onChangeText={setSenha}
          />
        )}

        {erro && <AppText variante="peq" cor="erro">{erro}</AppText>}
        {msg && <AppText variante="peq" cor="brand">{msg}</AppText>}

        <Button
          titulo={
            modo === "entrar"
              ? "Entrar"
              : modo === "criar"
                ? "Criar minha conta"
                : "Enviar link de recuperação"
          }
          onPress={() => void enviar()}
          ocupado={ocupado}
          desabilitado={!podeEnviar}
          style={{ marginTop: espaco.xs }}
        />

        <View style={{ gap: espaco.xs, marginTop: espaco.sm }}>
          {modo !== "criar" && (
            <Pressable onPress={() => trocar("criar")}>
              <AppText variante="peq" cor="muted" centro>
                Não tem conta? Criar uma
              </AppText>
            </Pressable>
          )}
          {modo !== "entrar" && (
            <Pressable onPress={() => trocar("entrar")}>
              <AppText variante="peq" cor="muted" centro>
                Já tem conta? Entrar
              </AppText>
            </Pressable>
          )}
          {modo === "entrar" && (
            <Pressable onPress={() => trocar("recuperar")}>
              <AppText variante="peq" cor="faint" centro>
                Esqueci minha senha
              </AppText>
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.void,
    justifyContent: "center",
    padding: espaco.xxl,
  },
  card: {
    backgroundColor: cores.surface2,
    borderColor: cores.line,
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.xxl,
    gap: espaco.md,
  },
  input: {
    backgroundColor: cores.surface,
    borderColor: cores.line,
    borderWidth: 1,
    borderRadius: raio.md,
    paddingHorizontal: espaco.lg,
    paddingVertical: 14,
    color: cores.snow,
    fontSize: 15,
  },
});
