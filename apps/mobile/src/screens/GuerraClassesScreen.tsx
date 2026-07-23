import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { trpc } from "../lib/trpc";
import { cores, raio, espaco } from "../theme";
import { AppText, Screen, Card, Badge } from "../components/ui";

/**
 * Guerra de Classes — ranking coletivo Classe vs Classe pelo XP somado dos
 * membros na semana. Destaca a Classe do usuário. Elegibilidade = estar na
 * Classe desde antes do início da semana (anti-troca oportunista).
 */
export function GuerraClassesScreen() {
  const utils = trpc.useUtils();
  const guerra = trpc.classWar.week.useQuery();

  if (guerra.isLoading) {
    return (
      <Screen>
        <View style={s.centro}>
          <ActivityIndicator color={cores.brand} size="large" />
        </View>
      </Screen>
    );
  }

  const maxXp = Math.max(1, ...(guerra.data?.ranking ?? []).map((c) => c.xp));

  return (
    <Screen semPadding>
      <FlatList
        data={guerra.data?.ranking ?? []}
        keyExtractor={(c) => c.classId}
        contentContainerStyle={{ paddingHorizontal: espaco.xl, paddingBottom: espaco.xxxl, gap: espaco.md }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={guerra.isFetching && !guerra.isLoading}
            onRefresh={() => void utils.classWar.week.invalidate()}
            tintColor={cores.brand}
          />
        }
        ListHeaderComponent={
          <View style={{ paddingTop: espaco.sm, paddingBottom: espaco.md }}>
            <AppText variante="peq" cor="muted">
              O XP de cada membro soma para a Classe. Vença junto.
            </AppText>
          </View>
        }
        renderItem={({ item }) => {
          const cor = item.colorToken || cores.brand;
          return (
            <Card elevado={item.souMinhaClasse} style={item.souMinhaClasse ? { borderColor: cor } : undefined}>
              <View style={s.topo}>
                <AppText variante="h3" cor="muted" tabular style={{ width: 32 }}>{item.rank}</AppText>
                <AppText variante="corpoForte" cor="snow" style={{ flex: 1 }}>{item.nome}</AppText>
                {item.souMinhaClasse && <Badge texto="SUA CLASSE" />}
              </View>
              <View style={s.barra}>
                <View style={[s.barraCheia, { width: `${Math.round((item.xp / maxXp) * 100)}%`, backgroundColor: cor }]} />
              </View>
              <View style={s.rodape}>
                <AppText variante="peq" cor="faint">{item.membros} {item.membros === 1 ? "membro" : "membros"}</AppText>
                <AppText variante="corpoForte" cor="snow" tabular>{item.xp} XP</AppText>
              </View>
            </Card>
          );
        }}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  topo: { flexDirection: "row", alignItems: "center", gap: espaco.sm },
  barra: { height: 8, borderRadius: 4, backgroundColor: cores.graphite, overflow: "hidden", marginTop: espaco.md },
  barraCheia: { height: "100%", borderRadius: 4 },
  rodape: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: espaco.md },
});
