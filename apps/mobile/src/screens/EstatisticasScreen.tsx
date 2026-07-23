import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { trpc } from "../lib/trpc";
import { cores, raio, espaco } from "../theme";
import { AppText, Screen, Card, Badge } from "../components/ui";

/**
 * Estatísticas — o painel profundo (Rise+): consistência, dias ativos, XP por
 * Área nos últimos 30 dias. Para Free, mostra o valor bloqueado como upsell
 * honesto (gating estrutural no servidor; aqui só reflete o estado).
 */
export function EstatisticasScreen() {
  const utils = trpc.useUtils();
  const stats = trpc.stats.avancado.useQuery(undefined, { retry: false });

  if (stats.isLoading) {
    return (
      <Screen>
        <View style={s.centro}>
          <ActivityIndicator color={cores.brand} size="large" />
        </View>
      </Screen>
    );
  }

  // Sem acesso (Free) → o procedure premium recusa: upsell em vez de erro cru.
  if (stats.error) {
    return (
      <Screen>
        <View style={s.centro}>
          <Card elevado style={{ gap: espaco.md, alignItems: "center" }}>
            <Badge texto="RISE+" />
            <AppText variante="h3" cor="snow" centro>Estatísticas profundas</AppText>
            <AppText variante="corpo" cor="muted" centro>
              Consistência, correlações e histórico completo fazem parte do Rise+.
              Sua progressão continua 100% gratuita — o que o plano abre é clareza.
            </AppText>
          </Card>
        </View>
      </Screen>
    );
  }

  const d = stats.data;
  const maxArea = Math.max(1, ...((d?.xpPorArea ?? []).map((a) => a.xp)));

  return (
    <Screen semPadding>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: espaco.xl, paddingBottom: espaco.xxxl, gap: espaco.md }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={stats.isFetching && !stats.isLoading}
            onRefresh={() => void utils.stats.avancado.invalidate()}
            tintColor={cores.brand}
          />
        }
      >
        <View style={s.grade}>
          <Metrica valor={`${d?.consistenciaPct ?? 0}%`} rotulo="CONSISTÊNCIA 30D" />
          <Metrica valor={String(d?.diasAtivos30d ?? 0)} rotulo="DIAS ATIVOS" />
        </View>
        <Card elevado>
          <AppText variante="micro" cor="faint">XP NOS ÚLTIMOS 30 DIAS</AppText>
          <AppText variante="display" cor="brand" tabular>{d?.xpTotal30d ?? 0}</AppText>
        </Card>

        <AppText variante="h3" cor="snow" style={{ marginTop: espaco.sm }}>XP por Área</AppText>
        {(d?.xpPorArea ?? []).map((a) => (
          <Card key={a.nome} elevado>
            <View style={s.areaTopo}>
              <View style={[s.ponto, { backgroundColor: a.cor || cores.brand }]} />
              <AppText variante="corpo" cor="snow" style={{ flex: 1 }}>{a.nome}</AppText>
              <AppText variante="peq" cor="muted" tabular>{a.xp} XP</AppText>
            </View>
            <View style={s.barra}>
              <View style={[s.barraCheia, { width: `${Math.round((a.xp / maxArea) * 100)}%`, backgroundColor: a.cor || cores.brand }]} />
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

function Metrica({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <Card elevado style={{ flex: 1 }}>
      <AppText variante="h1" cor="snow" tabular>{valor}</AppText>
      <AppText variante="micro" cor="faint">{rotulo}</AppText>
    </Card>
  );
}

const s = StyleSheet.create({
  centro: { flex: 1, justifyContent: "center", alignItems: "center", padding: espaco.xl },
  grade: { flexDirection: "row", gap: espaco.md },
  areaTopo: { flexDirection: "row", alignItems: "center", gap: espaco.md },
  ponto: { width: 10, height: 10, borderRadius: 5 },
  barra: { height: 6, borderRadius: 3, backgroundColor: cores.graphite, overflow: "hidden", marginTop: espaco.md },
  barraCheia: { height: "100%", borderRadius: 3 },
});
