import { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { trpc } from "../lib/trpc";
import { cores, raio, espaco } from "../theme";
import { AppText, Screen, Card, Button } from "../components/ui";
import { useHaptics } from "../hooks/useHaptics";
import { uuidDeterministico, dataLocalHoje } from "../lib/uuid";

/**
 * Hábitos — checklist diário. Marcar registra uma Ação (kind habit_check) com
 * clientActionId determinístico (habit:<id>:<dia>) → idempotente: múltiplos
 * toques no mesmo dia não duplicam XP. Criar/remover hábitos por Área.
 */
export function HabitosScreen() {
  const { sucesso, toque, erro: hapticErro } = useHaptics();
  const utils = trpc.useUtils();
  const hoje = trpc.habit.hoje.useQuery();
  const me = trpc.progress.me.useQuery();
  const [marcando, setMarcando] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [areaId, setAreaId] = useState<string | null>(null);

  const check = trpc.action.log.useMutation({
    onSuccess: (res) => {
      setMarcando(null);
      if (!res.deduped) sucesso();
      void utils.habit.hoje.invalidate();
      void utils.progress.me.invalidate();
    },
    onError: () => {
      setMarcando(null);
      hapticErro();
    },
  });
  const criar = trpc.habit.criar.useMutation({
    onSuccess: () => {
      setCriando(false);
      setTitulo("");
      setAreaId(null);
      sucesso();
      void utils.habit.hoje.invalidate();
    },
  });
  const remover = trpc.habit.remover.useMutation({
    onSuccess: () => void utils.habit.hoje.invalidate(),
  });

  async function marcar(h: { id: string; lifeAreaId: string; title: string; feitoHoje: boolean }) {
    if (h.feitoHoje || marcando) return;
    toque();
    setMarcando(h.id);
    const clientActionId = await uuidDeterministico(`habit:${h.id}:${dataLocalHoje()}`);
    check.mutate({
      lifeAreaId: h.lifeAreaId,
      clientActionId,
      kind: "habit_check",
      note: `Hábito: ${h.title}.`,
      payload: { habitId: h.id },
    });
  }

  return (
    <Screen semPadding>
      <FlatList
        data={hoje.data?.habitos ?? []}
        keyExtractor={(h) => h.id}
        contentContainerStyle={{ paddingHorizontal: espaco.xl, paddingBottom: espaco.xxxl, gap: espaco.sm }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={hoje.isFetching && !hoje.isLoading}
            onRefresh={() => void utils.habit.hoje.invalidate()}
            tintColor={cores.brand}
          />
        }
        ListHeaderComponent={
          <View style={s.topo}>
            <AppText variante="peq" cor="muted">Toque para marcar. Cada check vira XP.</AppText>
            <Pressable style={s.novo} onPress={() => { toque(); setCriando(true); }}>
              <Feather name="plus" size={16} color={cores.void} />
              <AppText variante="peq" cor="void">Novo hábito</AppText>
            </Pressable>
          </View>
        }
        renderItem={({ item: h }) => (
          <Card elevado>
            <View style={s.linha}>
              <Pressable
                onPress={() => void marcar(h)}
                style={[s.check, h.feitoHoje && s.checkFeito]}
                disabled={marcando === h.id}
              >
                {marcando === h.id ? (
                  <ActivityIndicator size="small" color={cores.brand} />
                ) : h.feitoHoje ? (
                  <Feather name="check" size={18} color={cores.void} />
                ) : null}
              </Pressable>
              <View style={{ flex: 1 }}>
                <AppText variante="corpoForte" cor={h.feitoHoje ? "muted" : "snow"}>{h.title}</AppText>
                <AppText variante="micro" cor="faint" style={{ letterSpacing: 0.3 }}>{h.areaNome}</AppText>
              </View>
              <Pressable onPress={() => { toque(); remover.mutate({ habitId: h.id }); }} hitSlop={8}>
                <Feather name="trash-2" size={16} color={cores.faint} />
              </Pressable>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          hoje.isLoading ? (
            <View style={s.centro}><ActivityIndicator color={cores.brand} /></View>
          ) : (
            <Card>
              <AppText variante="corpo" cor="muted" centro>
                Nenhum hábito para hoje. Crie um e transforme rotina em progresso.
              </AppText>
            </Card>
          )
        }
      />

      <Modal visible={criando} transparent animationType="slide" onRequestClose={() => setCriando(false)}>
        <Pressable style={s.modalFundo} onPress={() => setCriando(false)}>
          <Pressable style={s.modalCard} onPress={() => {}}>
            <View style={s.puxador} />
            <AppText variante="h3" cor="snow">Novo hábito</AppText>
            <TextInput
              style={s.input}
              placeholder="Ex.: Ler 10 páginas"
              placeholderTextColor={cores.faint}
              value={titulo}
              onChangeText={setTitulo}
            />
            <AppText variante="micro" cor="faint">ÁREA</AppText>
            <View style={s.chips}>
              {(me.data?.areas ?? []).map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => { toque(); setAreaId(a.id); }}
                  style={[s.chip, areaId === a.id && s.chipAtivo]}
                >
                  <AppText variante="peq" cor={areaId === a.id ? "void" : "muted"}>{a.nome}</AppText>
                </Pressable>
              ))}
            </View>
            <Button
              titulo={criar.isPending ? "Criando…" : "Criar hábito"}
              onPress={() => {
                if (!areaId || titulo.trim().length < 2) return;
                criar.mutate({ lifeAreaId: areaId, title: titulo.trim() });
              }}
              ocupado={criar.isPending}
              desabilitado={!areaId || titulo.trim().length < 2}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  topo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: espaco.sm, paddingBottom: espaco.md },
  novo: { flexDirection: "row", alignItems: "center", gap: espaco.xs, backgroundColor: cores.brand, borderRadius: raio.pill, paddingHorizontal: espaco.md, paddingVertical: espaco.sm },
  centro: { paddingVertical: espaco.xxxl, alignItems: "center" },
  linha: { flexDirection: "row", alignItems: "center", gap: espaco.md },
  check: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderColor: cores.lineStrong,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkFeito: { backgroundColor: cores.brand, borderColor: cores.brand },
  modalFundo: { flex: 1, backgroundColor: cores.overlay, justifyContent: "flex-end" },
  modalCard: { backgroundColor: cores.surface2, borderTopLeftRadius: raio.lg, borderTopRightRadius: raio.lg, padding: espaco.xxl, paddingBottom: espaco.xxxl, gap: espaco.md },
  puxador: { width: 40, height: 4, borderRadius: 2, backgroundColor: cores.lineStrong, alignSelf: "center", marginBottom: espaco.sm },
  input: { backgroundColor: cores.surface, borderColor: cores.line, borderWidth: 1, borderRadius: raio.md, paddingHorizontal: espaco.lg, paddingVertical: 14, color: cores.snow, fontSize: 15 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: espaco.sm },
  chip: { borderColor: cores.line, borderWidth: 1, borderRadius: raio.pill, paddingHorizontal: espaco.md, paddingVertical: 6, backgroundColor: cores.surface },
  chipAtivo: { backgroundColor: cores.brand, borderColor: cores.brand },
});
