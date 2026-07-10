import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import * as Crypto from "expo-crypto";
import { templatesDaArea } from "@rise/core";
import { supabase } from "../lib/supabase";
import { trpc } from "../lib/trpc";
import { cores, raio } from "../theme";

/**
 * Home mobile — o loop core no bolso: Nível Rise, streak, Áreas 1-tap com
 * PROVA (nota ≥ 3 chars) e templates por área. Paridade de regra com o site:
 * o servidor é a verdade, aqui só UI.
 */
export function Home() {
  const utils = trpc.useUtils();
  const me = trpc.progress.me.useQuery();
  const bootStarted = useRef(false);
  const boot = trpc.progress.bootstrap.useMutation({
    onSettled: () => void utils.progress.me.invalidate(),
  });
  useEffect(() => {
    if (!bootStarted.current) {
      bootStarted.current = true;
      boot.mutate({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [areaSel, setAreaSel] = useState<string | null>(null);
  const [nota, setNota] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const logAction = trpc.action.log.useMutation({
    onSuccess: (res) => {
      setAreaSel(null);
      setNota("");
      if (!res.deduped) {
        const partes = [`+${res.xpGained} XP`];
        if (res.leveledUp) partes.push(`nível ${res.areaLevel}!`);
        for (const c of res.conquistas ?? []) partes.push(`Conquista: ${c.nome}`);
        setToast(partes.join(" · "));
        setTimeout(() => setToast(null), 2600);
      }
      void utils.progress.me.invalidate();
    },
    onError: (e) => setErro(e.message),
  });

  if (!me.data) {
    return (
      <View style={[s.tela, s.centro]}>
        <ActivityIndicator color={cores.brand} />
      </View>
    );
  }
  const d = me.data;
  const area = d.areas.find((a) => a.id === areaSel) ?? null;
  const templates = area ? templatesDaArea(area.catalogId) : [];

  function registrar() {
    if (!area) return;
    const limpa = nota.trim();
    if (limpa.length < 3) {
      setErro("Conte o que você fez (mínimo 3 caracteres) — a prova faz o progresso valer.");
      return;
    }
    setErro(null);
    logAction.mutate({
      lifeAreaId: area.id,
      clientActionId: Crypto.randomUUID(),
      kind: "quick_log",
      note: limpa,
    });
  }

  return (
    <View style={s.tela}>
      {/* Cabeçalho: Nível Rise + streak + sair */}
      <View style={s.topo}>
        <View>
          <Text style={s.nivelRotulo}>NÍVEL RISE</Text>
          <Text style={s.nivel}>{d.riseLevel}</Text>
        </View>
        <View style={s.topoDireita}>
          <Text style={s.streak}>
            {d.streakDias} {d.streakDias === 1 ? "dia" : "dias"} de sequência
          </Text>
          <Text style={s.sparks}>{d.sparks} Faíscas</Text>
          <Pressable onPress={() => void supabase.auth.signOut()}>
            <Text style={s.sair}>sair</Text>
          </Pressable>
        </View>
      </View>

      {/* Áreas — 1 toque abre o registro com prova */}
      <FlatList
        data={d.areas}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 32 }}
        renderItem={({ item: a }) => (
          <Pressable
            style={({ pressed }) => [s.areaCard, pressed && s.areaCardAtiva]}
            onPress={() => {
              setAreaSel(a.id);
              setNota("");
              setErro(null);
            }}
          >
            <View style={s.areaTopo}>
              <Text style={s.areaNome}>{a.nome}</Text>
              <Text style={s.areaXpBase}>+{a.baseXp} XP</Text>
            </View>
            <View style={s.areaLinha}>
              <Text style={s.areaNivel}>{a.nivel}</Text>
              <View style={s.barra}>
                <View style={[s.barraCheia, { width: `${Math.round(a.fracao * 100)}%` }]} />
              </View>
            </View>
          </Pressable>
        )}
      />

      {/* Toast simples de recompensa */}
      {toast && (
        <View style={s.toast}>
          <Text style={s.toastTexto}>{toast}</Text>
        </View>
      )}

      {/* Modal de registro com PROVA */}
      <Modal visible={!!area} transparent animationType="slide">
        <View style={s.modalFundo}>
          <View style={s.modalCard}>
            <Text style={s.modalTitulo}>
              Registrar em {area?.nome ?? ""}
            </Text>

            {templates.length > 0 && (
              <View style={s.chips}>
                {templates.map((t) => (
                  <Pressable
                    key={t.id}
                    style={[s.chip, nota === t.label && s.chipAtivo]}
                    onPress={() => setNota(t.label)}
                  >
                    <Text
                      style={[s.chipTexto, nota === t.label && s.chipTextoAtivo]}
                      numberOfLines={1}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <TextInput
              style={s.notaInput}
              placeholder="O que você fez? (sua prova)"
              placeholderTextColor={cores.faint}
              multiline
              value={nota}
              onChangeText={setNota}
            />
            {erro && <Text style={s.erro}>{erro}</Text>}

            <Pressable
              style={({ pressed }) => [s.botao, pressed && s.botaoAtivo]}
              disabled={logAction.isPending}
              onPress={registrar}
            >
              <Text style={s.botaoTexto}>
                {logAction.isPending ? "Enviando…" : "Registrar com prova"}
              </Text>
            </Pressable>
            <Pressable onPress={() => setAreaSel(null)}>
              <Text style={s.cancelar}>cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.void, padding: 20, paddingTop: 64 },
  centro: { justifyContent: "center", alignItems: "center" },
  topo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  nivelRotulo: { color: cores.faint, fontSize: 11, letterSpacing: 2 },
  nivel: { color: cores.snow, fontSize: 44, fontWeight: "700", lineHeight: 50 },
  topoDireita: { alignItems: "flex-end", gap: 2 },
  streak: { color: cores.brand, fontSize: 13, fontWeight: "600" },
  sparks: { color: cores.muted, fontSize: 12 },
  sair: { color: cores.faint, fontSize: 12, marginTop: 6 },
  areaCard: {
    backgroundColor: cores.surface,
    borderColor: cores.line,
    borderWidth: 1,
    borderRadius: raio.card,
    padding: 16,
  },
  areaCardAtiva: { backgroundColor: cores.surface2 },
  areaTopo: { flexDirection: "row", justifyContent: "space-between" },
  areaNome: { color: cores.snow, fontSize: 15, fontWeight: "600" },
  areaXpBase: { color: cores.brand, fontSize: 12, fontWeight: "600" },
  areaLinha: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
  areaNivel: { color: cores.snow, fontSize: 24, fontWeight: "700", width: 36 },
  barra: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: cores.graphite,
    overflow: "hidden",
  },
  barraCheia: { height: "100%", borderRadius: 3, backgroundColor: cores.brand },
  toast: {
    position: "absolute",
    bottom: 32,
    alignSelf: "center",
    backgroundColor: cores.surface2,
    borderColor: cores.brand,
    borderWidth: 1,
    borderRadius: raio.pill,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toastTexto: { color: cores.brand, fontWeight: "700", fontSize: 14 },
  modalFundo: {
    flex: 1,
    backgroundColor: "rgba(10,11,13,0.85)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: cores.surface2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  modalTitulo: { color: cores.snow, fontSize: 18, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderColor: cores.line,
    borderWidth: 1,
    borderRadius: raio.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: cores.surface,
    maxWidth: "100%",
  },
  chipAtivo: { borderColor: cores.brand, backgroundColor: "rgba(16,185,129,0.1)" },
  chipTexto: { color: cores.faint, fontSize: 11, fontWeight: "500" },
  chipTextoAtivo: { color: cores.snow },
  notaInput: {
    backgroundColor: cores.surface,
    borderColor: cores.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 72,
    color: cores.snow,
    fontSize: 14,
    textAlignVertical: "top",
  },
  erro: { color: cores.erro, fontSize: 13 },
  botao: {
    backgroundColor: cores.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  botaoAtivo: { backgroundColor: cores.brandStrong },
  botaoTexto: { color: cores.void, fontWeight: "700", fontSize: 15 },
  cancelar: { color: cores.muted, textAlign: "center", fontSize: 13, paddingVertical: 4 },
});
