import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../lib/supabase";
import { cores, raio } from "../theme";

/** Entrar/criar conta com email+senha — mesmo fluxo do site. */
export function Login() {
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar() {
    setOcupado(true);
    setErro(null);
    const { error } =
      modo === "entrar"
        ? await supabase.auth.signInWithPassword({ email, password: senha })
        : await supabase.auth.signUp({ email, password: senha });
    if (error) setErro(error.message);
    setOcupado(false);
    // Sucesso: o gate no App.tsx troca de tela via onAuthStateChange.
  }

  return (
    <KeyboardAvoidingView
      style={s.tela}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.card}>
        <Text style={s.marca}>Rise</Text>
        <Text style={s.sub}>O videogame da vida real.</Text>

        <TextInput
          style={s.input}
          placeholder="email"
          placeholderTextColor={cores.faint}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={s.input}
          placeholder="senha"
          placeholderTextColor={cores.faint}
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        {erro && <Text style={s.erro}>{erro}</Text>}

        <Pressable
          style={({ pressed }) => [s.botao, pressed && s.botaoAtivo]}
          disabled={ocupado || !email || senha.length < 6}
          onPress={() => void enviar()}
        >
          <Text style={s.botaoTexto}>
            {ocupado ? "…" : modo === "entrar" ? "Entrar" : "Criar conta"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setModo(modo === "entrar" ? "criar" : "entrar")}
        >
          <Text style={s.trocar}>
            {modo === "entrar"
              ? "Não tem conta? Criar agora"
              : "Já tem conta? Entrar"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.void,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: cores.surface2,
    borderColor: cores.line,
    borderWidth: 1,
    borderRadius: raio.card,
    padding: 24,
    gap: 12,
  },
  marca: { color: cores.snow, fontSize: 32, fontWeight: "700" },
  sub: { color: cores.muted, fontSize: 14, marginBottom: 8 },
  input: {
    backgroundColor: cores.surface,
    borderColor: cores.line,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: cores.snow,
    fontSize: 15,
  },
  erro: { color: cores.erro, fontSize: 13 },
  botao: {
    backgroundColor: cores.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  botaoAtivo: { backgroundColor: cores.brandStrong },
  botaoTexto: { color: cores.void, fontWeight: "700", fontSize: 15 },
  trocar: { color: cores.muted, fontSize: 13, textAlign: "center", marginTop: 8 },
});
