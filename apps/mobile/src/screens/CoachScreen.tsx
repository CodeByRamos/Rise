import { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { trpc } from "../lib/trpc";
import { cores, raio, espaco } from "../theme";
import { AppText, Screen } from "../components/ui";
import { useHaptics } from "../hooks/useHaptics";

interface Msg {
  id: string;
  role: string;
  content: string;
}

/**
 * Coach — conversa com o coach do Rise (mesma camada de custo do site: L0
 * heurístico absorve o volume, Sonnet no Free com cota). Chat nativo com envio
 * otimista da mensagem do usuário e cota visível.
 */
export function CoachScreen() {
  const { toque } = useHaptics();
  const utils = trpc.useUtils();
  const historico = trpc.coach.historico.useQuery(undefined);
  const quota = trpc.coach.quota.useQuery();
  const [texto, setTexto] = useState("");
  const [otimista, setOtimista] = useState<Msg[]>([]);

  const conversar = trpc.coach.conversar.useMutation({
    onSuccess: () => {
      setOtimista([]);
      void utils.coach.historico.invalidate();
      void utils.coach.quota.invalidate();
    },
    onError: () => setOtimista([]),
  });

  function enviar() {
    const t = texto.trim();
    if (!t || conversar.isPending) return;
    toque();
    setOtimista([{ id: `tmp-${Date.now()}`, role: "user", content: t }]);
    setTexto("");
    conversar.mutate({ texto: t });
  }

  const mensagens: Msg[] = [
    ...(historico.data ?? []).map((m) => ({ id: String(m.id), role: m.role, content: m.content })),
    ...otimista,
  ];

  const restante = quota.data?.ilimitado ? null : (quota.data?.restante ?? null);

  return (
    <Screen semPadding>
      <View style={s.topo}>
        <AppText variante="h1" cor="snow">Coach</AppText>
        {restante !== null && (
          <AppText variante="peq" cor="faint">
            {restante} {restante === 1 ? "mensagem" : "mensagens"} hoje
          </AppText>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {historico.isLoading ? (
          <View style={s.centro}>
            <ActivityIndicator color={cores.brand} />
          </View>
        ) : (
          <FlatList
            data={mensagens}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ paddingHorizontal: espaco.xl, paddingVertical: espaco.md, gap: espaco.sm }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const meu = item.role === "user";
              return (
                <View style={[s.bolha, meu ? s.bolhaMinha : s.bolhaCoach]}>
                  <AppText variante="corpo" cor={meu ? "void" : "snow"}>{item.content}</AppText>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={s.vazio}>
                <Feather name="message-circle" size={28} color={cores.faint} />
                <AppText variante="corpo" cor="muted" centro style={{ marginTop: espaco.md }}>
                  Converse com o Coach sobre sua evolução, metas e o que travar no caminho.
                </AppText>
              </View>
            }
          />
        )}

        {conversar.isPending && (
          <View style={s.digitando}>
            <ActivityIndicator color={cores.brand} size="small" />
            <AppText variante="peq" cor="faint">Coach pensando…</AppText>
          </View>
        )}

        <View style={s.barra}>
          <TextInput
            style={s.input}
            placeholder="Escreva ao Coach…"
            placeholderTextColor={cores.faint}
            value={texto}
            onChangeText={setTexto}
            multiline
            onSubmitEditing={enviar}
          />
          <Pressable
            onPress={enviar}
            disabled={!texto.trim() || conversar.isPending}
            style={[s.enviar, (!texto.trim() || conversar.isPending) && { opacity: 0.4 }]}
          >
            <Feather name="arrow-up" size={20} color={cores.void} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  topo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: espaco.xl,
    paddingTop: espaco.md,
    paddingBottom: espaco.sm,
  },
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  vazio: { paddingTop: espaco.xxxl * 2, alignItems: "center", paddingHorizontal: espaco.xl },
  bolha: { maxWidth: "82%", borderRadius: raio.card, paddingHorizontal: espaco.lg, paddingVertical: espaco.md },
  bolhaMinha: { alignSelf: "flex-end", backgroundColor: cores.brand, borderBottomRightRadius: 6 },
  bolhaCoach: { alignSelf: "flex-start", backgroundColor: cores.surface2, borderBottomLeftRadius: 6 },
  digitando: { flexDirection: "row", alignItems: "center", gap: espaco.sm, paddingHorizontal: espaco.xl, paddingBottom: espaco.sm },
  barra: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: espaco.sm,
    paddingHorizontal: espaco.xl,
    paddingTop: espaco.sm,
    paddingBottom: espaco.lg,
    borderTopColor: cores.line,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    backgroundColor: cores.surface,
    borderColor: cores.line,
    borderWidth: 1,
    borderRadius: raio.lg,
    paddingHorizontal: espaco.lg,
    paddingVertical: espaco.md,
    color: cores.snow,
    fontSize: 15,
    maxHeight: 120,
  },
  enviar: {
    width: 44,
    height: 44,
    borderRadius: raio.pill,
    backgroundColor: cores.brand,
    justifyContent: "center",
    alignItems: "center",
  },
});
