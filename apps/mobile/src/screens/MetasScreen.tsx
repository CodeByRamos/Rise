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

/**
 * Metas — alvos por Área da Vida (direção sem XP fácil). Ajuste incremental
 * (+/−) do progresso; criar com alvo e unidade; remover. Metas dão rumo; o XP
 * continua vindo só de ações provadas.
 */
export function MetasScreen() {
  const { toque, sucesso } = useHaptics();
  const utils = trpc.useUtils();
  const metas = trpc.goal.list.useQuery();
  const me = trpc.progress.me.useQuery();

  const [criando, setCriando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [alvo, setAlvo] = useState("");
  const [unidade, setUnidade] = useState("");
  const [areaId, setAreaId] = useState<string | null>(null);

  const ajustar = trpc.goal.ajustar.useMutation({
    onSuccess: () => { sucesso(); void utils.goal.list.invalidate(); },
  });
  const remover = trpc.goal.remover.useMutation({
    onSuccess: () => void utils.goal.list.invalidate(),
  });
  const criar = trpc.goal.criar.useMutation({
    onSuccess: () => {
      setCriando(false); setTitulo(""); setAlvo(""); setUnidade(""); setAreaId(null);
      sucesso();
      void utils.goal.list.invalidate();
    },
  });

  return (
    <Screen semPadding>
      <FlatList
        data={metas.data ?? []}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ paddingHorizontal: espaco.xl, paddingBottom: espaco.xxxl, gap: espaco.md }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={metas.isFetching && !metas.isLoading}
            onRefresh={() => void utils.goal.list.invalidate()}
            tintColor={cores.brand}
          />
        }
        ListHeaderComponent={
          <View style={s.topo}>
            <AppText variante="peq" cor="muted">Alvos dão direção. O XP vem das ações.</AppText>
            <Pressable style={s.novo} onPress={() => { toque(); setCriando(true); }}>
              <Feather name="plus" size={16} color={cores.void} />
              <AppText variante="peq" cor="void">Nova meta</AppText>
            </Pressable>
          </View>
        }
        renderItem={({ item: g }) => {
          const frac = g.targetValue > 0 ? Math.min(1, g.currentValue / g.targetValue) : 0;
          const completa = g.currentValue >= g.targetValue;
          return (
            <Card elevado>
              <View style={s.linhaTopo}>
                <View style={{ flex: 1 }}>
                  <AppText variante="corpoForte" cor="snow">{g.title}</AppText>
                  <AppText variante="micro" cor="faint" style={{ letterSpacing: 0.3 }}>{g.areaNome}</AppText>
                </View>
                <Pressable onPress={() => { toque(); remover.mutate({ goalId: g.id }); }} hitSlop={8}>
                  <Feather name="trash-2" size={16} color={cores.faint} />
                </Pressable>
              </View>

              <View style={s.barra}>
                <View style={[s.barraCheia, { width: `${Math.round(frac * 100)}%`, backgroundColor: completa ? cores.brand : (g.areaCor || cores.brand) }]} />
              </View>

              <View style={s.linhaBaixo}>
                <AppText variante="peq" cor="muted" tabular>
                  {g.currentValue} / {g.targetValue} {g.unit ?? ""}
                </AppText>
                <View style={s.stepper}>
                  <Pressable style={s.step} onPress={() => { toque(); ajustar.mutate({ goalId: g.id, delta: -1 }); }}>
                    <Feather name="minus" size={16} color={cores.snow} />
                  </Pressable>
                  <Pressable style={s.step} onPress={() => { toque(); ajustar.mutate({ goalId: g.id, delta: 1 }); }}>
                    <Feather name="plus" size={16} color={cores.snow} />
                  </Pressable>
                </View>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          metas.isLoading ? (
            <View style={s.centro}><ActivityIndicator color={cores.brand} /></View>
          ) : (
            <Card>
              <AppText variante="corpo" cor="muted" centro>
                Nenhuma meta ainda. Defina um alvo e acompanhe o avanço.
              </AppText>
            </Card>
          )
        }
      />

      <Modal visible={criando} transparent animationType="slide" onRequestClose={() => setCriando(false)}>
        <Pressable style={s.modalFundo} onPress={() => setCriando(false)}>
          <Pressable style={s.modalCard} onPress={() => {}}>
            <View style={s.puxador} />
            <AppText variante="h3" cor="snow">Nova meta</AppText>
            <TextInput style={s.input} placeholder="Ex.: Ler 12 livros" placeholderTextColor={cores.faint} value={titulo} onChangeText={setTitulo} />
            <View style={{ flexDirection: "row", gap: espaco.sm }}>
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Alvo" placeholderTextColor={cores.faint} keyboardType="numeric" value={alvo} onChangeText={setAlvo} />
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Unidade" placeholderTextColor={cores.faint} value={unidade} onChangeText={setUnidade} />
            </View>
            <AppText variante="micro" cor="faint">ÁREA</AppText>
            <View style={s.chips}>
              {(me.data?.areas ?? []).map((a) => (
                <Pressable key={a.id} onPress={() => { toque(); setAreaId(a.id); }} style={[s.chip, areaId === a.id && s.chipAtivo]}>
                  <AppText variante="peq" cor={areaId === a.id ? "void" : "muted"}>{a.nome}</AppText>
                </Pressable>
              ))}
            </View>
            <Button
              titulo={criar.isPending ? "Criando…" : "Criar meta"}
              onPress={() => {
                const t = Number(alvo);
                if (!areaId || titulo.trim().length < 3 || !Number.isFinite(t) || t <= 0) return;
                criar.mutate({ lifeAreaId: areaId, title: titulo.trim(), targetValue: t, unit: unidade.trim() || undefined });
              }}
              ocupado={criar.isPending}
              desabilitado={!areaId || titulo.trim().length < 3 || Number(alvo) <= 0}
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
  linhaTopo: { flexDirection: "row", alignItems: "flex-start", gap: espaco.md },
  barra: { height: 8, borderRadius: 4, backgroundColor: cores.graphite, overflow: "hidden", marginTop: espaco.md },
  barraCheia: { height: "100%", borderRadius: 4 },
  linhaBaixo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: espaco.md },
  stepper: { flexDirection: "row", gap: espaco.sm },
  step: { width: 34, height: 34, borderRadius: raio.sm, borderColor: cores.line, borderWidth: 1, backgroundColor: cores.surface, justifyContent: "center", alignItems: "center" },
  modalFundo: { flex: 1, backgroundColor: cores.overlay, justifyContent: "flex-end" },
  modalCard: { backgroundColor: cores.surface2, borderTopLeftRadius: raio.lg, borderTopRightRadius: raio.lg, padding: espaco.xxl, paddingBottom: espaco.xxxl, gap: espaco.md },
  puxador: { width: 40, height: 4, borderRadius: 2, backgroundColor: cores.lineStrong, alignSelf: "center", marginBottom: espaco.sm },
  input: { backgroundColor: cores.surface, borderColor: cores.line, borderWidth: 1, borderRadius: raio.md, paddingHorizontal: espaco.lg, paddingVertical: 14, color: cores.snow, fontSize: 15 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: espaco.sm },
  chip: { borderColor: cores.line, borderWidth: 1, borderRadius: raio.pill, paddingHorizontal: espaco.md, paddingVertical: 6, backgroundColor: cores.surface },
  chipAtivo: { backgroundColor: cores.brand, borderColor: cores.brand },
});
