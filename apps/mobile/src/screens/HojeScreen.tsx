import { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import * as Crypto from "expo-crypto";
import { templatesDaArea } from "@rise/core";
import { trpc } from "../lib/trpc";
import { cores, raio, espaco, tipo } from "../theme";
import { AppText, Screen, Card, Button, Badge } from "../components/ui";
import { useHaptics } from "../hooks/useHaptics";

/**
 * Hoje — o loop core no bolso: Nível Rise, sequência, Faíscas e as Áreas em
 * 1 toque com PROVA. Paridade de regra com a web (o servidor é a verdade).
 * Pull-to-refresh, haptics de recompensa e bottom sheet de registro nativos.
 */
export function HojeScreen() {
  const { sucesso, impacto, erro: hapticErro } = useHaptics();
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
        sucesso();
        const partes = [`+${res.xpGained} XP`];
        if (res.leveledUp) partes.push(`nível ${res.areaLevel}!`);
        for (const c of res.conquistas ?? []) partes.push(`Conquista: ${c.nome}`);
        setToast(partes.join(" · "));
        setTimeout(() => setToast(null), 2800);
      }
      void utils.progress.me.invalidate();
    },
    onError: (e) => {
      hapticErro();
      setErro(e.message);
    },
  });

  if (!me.data) {
    return (
      <Screen>
        <View style={s.centro}>
          <ActivityIndicator color={cores.brand} size="large" />
        </View>
      </Screen>
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
    impacto();
    logAction.mutate({
      lifeAreaId: area.id,
      clientActionId: Crypto.randomUUID(),
      kind: "quick_log",
      note: limpa,
    });
  }

  return (
    <Screen semPadding>
      <FlatList
        data={d.areas}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingHorizontal: espaco.xl, paddingBottom: espaco.xxxl, gap: espaco.md }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={me.isFetching && !me.isLoading}
            onRefresh={() => void utils.progress.me.invalidate()}
            tintColor={cores.brand}
          />
        }
        ListHeaderComponent={
          <View style={s.cabecalho}>
            <View>
              <AppText variante="micro" cor="faint">NÍVEL RISE</AppText>
              <AppText variante="display" cor="snow" tabular>{d.riseLevel}</AppText>
            </View>
            <View style={{ alignItems: "flex-end", gap: espaco.xs }}>
              <Badge texto={`${d.streakDias} ${d.streakDias === 1 ? "DIA" : "DIAS"} DE SEQUÊNCIA`} />
              <AppText variante="peq" cor="muted" tabular>{d.sparks} Faíscas</AppText>
            </View>
          </View>
        }
        renderItem={({ item: a }) => (
          <Card
            elevado
            onPress={() => {
              impacto();
              setAreaSel(a.id);
              setNota("");
              setErro(null);
            }}
          >
            <View style={s.areaTopo}>
              <AppText variante="corpoForte" cor="snow">{a.nome}</AppText>
              <AppText variante="peq" cor="brand">+{a.baseXp} XP</AppText>
            </View>
            <View style={s.areaLinha}>
              <AppText variante="h2" cor="snow" tabular style={{ width: 40 }}>{a.nivel}</AppText>
              <View style={s.barra}>
                <View style={[s.barraCheia, { width: `${Math.round(a.fracao * 100)}%` }]} />
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Card>
            <AppText variante="corpo" cor="muted" centro>
              Preparando suas Áreas da Vida…
            </AppText>
          </Card>
        }
      />

      {toast && (
        <View style={s.toast}>
          <AppText variante="corpoForte" cor="brand">{toast}</AppText>
        </View>
      )}

      <Modal visible={!!area} transparent animationType="slide" onRequestClose={() => setAreaSel(null)}>
        <Pressable style={s.modalFundo} onPress={() => setAreaSel(null)}>
          <Pressable style={s.modalCard} onPress={() => {}}>
            <View style={s.puxador} />
            <AppText variante="h3" cor="snow">Registrar em {area?.nome ?? ""}</AppText>

            {templates.length > 0 && (
              <View style={s.chips}>
                {templates.map((t) => {
                  const ativo = nota === t.label;
                  return (
                    <Pressable
                      key={t.id}
                      style={[s.chip, ativo && s.chipAtivo]}
                      onPress={() => setNota(t.label)}
                    >
                      <AppText variante="micro" cor={ativo ? "snow" : "faint"} numberOfLines={1} style={{ letterSpacing: 0.2 }}>
                        {t.label}
                      </AppText>
                    </Pressable>
                  );
                })}
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
            {erro && <AppText variante="peq" cor="erro">{erro}</AppText>}

            <Button
              titulo={logAction.isPending ? "Enviando…" : "Registrar com prova"}
              onPress={registrar}
              ocupado={logAction.isPending}
              semHaptic
            />
            <Pressable onPress={() => setAreaSel(null)} style={{ paddingVertical: espaco.xs }}>
              <AppText variante="peq" cor="muted" centro>cancelar</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  cabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: espaco.md,
    paddingBottom: espaco.xl,
  },
  areaTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  areaLinha: { flexDirection: "row", alignItems: "center", gap: espaco.md, marginTop: espaco.md },
  barra: { flex: 1, height: 6, borderRadius: 3, backgroundColor: cores.graphite, overflow: "hidden" },
  barraCheia: { height: "100%", borderRadius: 3, backgroundColor: cores.brand },
  toast: {
    position: "absolute",
    bottom: espaco.xxxl,
    alignSelf: "center",
    backgroundColor: cores.surface2,
    borderColor: cores.brand,
    borderWidth: 1,
    borderRadius: raio.pill,
    paddingHorizontal: espaco.xl,
    paddingVertical: espaco.md,
  },
  modalFundo: { flex: 1, backgroundColor: cores.overlay, justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: cores.surface2,
    borderTopLeftRadius: raio.lg,
    borderTopRightRadius: raio.lg,
    padding: espaco.xxl,
    paddingBottom: espaco.xxxl,
    gap: espaco.md,
  },
  puxador: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: cores.lineStrong,
    alignSelf: "center",
    marginBottom: espaco.sm,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: espaco.sm },
  chip: {
    borderColor: cores.line,
    borderWidth: 1,
    borderRadius: raio.pill,
    paddingHorizontal: espaco.md,
    paddingVertical: 6,
    backgroundColor: cores.surface,
    maxWidth: "100%",
  },
  chipAtivo: { borderColor: cores.brand, backgroundColor: cores.brandSoft },
  notaInput: {
    backgroundColor: cores.surface,
    borderColor: cores.line,
    borderWidth: 1,
    borderRadius: raio.md,
    padding: 14,
    minHeight: 76,
    color: cores.snow,
    fontSize: 14,
    textAlignVertical: "top",
    ...(tipo.corpo as object),
  },
});
