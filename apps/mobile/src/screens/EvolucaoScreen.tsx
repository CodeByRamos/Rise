import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { trpc } from "../lib/trpc";
import { cores, raio, espaco } from "../theme";
import { AppText, Screen, Card } from "../components/ui";
import type { Nav, EvolucaoStackParams } from "../navigation/types";

/**
 * Evolução — a visão de progresso do "personagem": Nível Rise, totais e cada
 * Área da Vida com seu nível e barra de XP no nível atual. Base para o skill
 * tree e o heatmap de consistência (fases seguintes).
 */
export function EvolucaoScreen() {
  const nav = useNavigation<Nav<EvolucaoStackParams>>();
  const utils = trpc.useUtils();
  const me = trpc.progress.me.useQuery();

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
          <View style={{ paddingTop: espaco.md, paddingBottom: espaco.lg }}>
            <AppText variante="h1" cor="snow">Evolução</AppText>
            <View style={s.resumo}>
              <Metrica valor={d.riseLevel} rotulo="NÍVEL RISE" />
              <Metrica valor={d.totalXp} rotulo="XP TOTAL" />
              <Metrica valor={d.streakRecorde} rotulo="RECORDE" />
            </View>
            <Pressable style={s.linkCard} onPress={() => nav.navigate("Estatisticas")}>
              <Feather name="bar-chart-2" size={18} color={cores.brand} />
              <AppText variante="corpo" cor="snow" style={{ flex: 1 }}>Estatísticas profundas</AppText>
              <Feather name="chevron-right" size={18} color={cores.faint} />
            </Pressable>
          </View>
        }
        renderItem={({ item: a }) => {
          const frac = a.xpDoNivel > 0 ? a.xpNoNivel / a.xpDoNivel : 0;
          return (
            <Card elevado>
              <View style={s.linha}>
                <View style={[s.pontoArea, { backgroundColor: a.cor || cores.brand }]} />
                <AppText variante="corpoForte" cor="snow" style={{ flex: 1 }}>{a.nome}</AppText>
                <AppText variante="peq" cor="muted">Nível {a.nivel}</AppText>
              </View>
              <View style={s.barra}>
                <View
                  style={[s.barraCheia, { width: `${Math.round(frac * 100)}%`, backgroundColor: a.cor || cores.brand }]}
                />
              </View>
              <AppText variante="micro" cor="faint" style={{ marginTop: espaco.sm, letterSpacing: 0.3 }}>
                {a.xpNoNivel}/{a.xpDoNivel} XP NO NÍVEL
              </AppText>
            </Card>
          );
        }}
        ListEmptyComponent={
          <Card>
            <AppText variante="corpo" cor="muted" centro>
              Adicione Áreas da Vida e registre ações para ver sua evolução.
            </AppText>
          </Card>
        }
      />
    </Screen>
  );
}

function Metrica({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <View style={{ flex: 1 }}>
      <AppText variante="h1" cor="snow" tabular>{valor}</AppText>
      <AppText variante="micro" cor="faint">{rotulo}</AppText>
    </View>
  );
}

const s = StyleSheet.create({
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  resumo: {
    flexDirection: "row",
    gap: espaco.md,
    marginTop: espaco.lg,
    backgroundColor: cores.surface,
    borderColor: cores.line,
    borderWidth: 1,
    borderRadius: raio.card,
    padding: espaco.lg,
  },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.md,
    marginTop: espaco.md,
    backgroundColor: cores.surface,
    borderColor: cores.line,
    borderWidth: 1,
    borderRadius: raio.card,
    padding: espaco.lg,
  },
  linha: { flexDirection: "row", alignItems: "center", gap: espaco.md },
  pontoArea: { width: 10, height: 10, borderRadius: 5 },
  barra: { height: 6, borderRadius: 3, backgroundColor: cores.graphite, overflow: "hidden", marginTop: espaco.md },
  barraCheia: { height: "100%", borderRadius: 3 },
});
