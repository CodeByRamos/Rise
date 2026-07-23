import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { trpc } from "../lib/trpc";
import { cores, raio, espaco } from "../theme";
import { AppText, Screen, Card } from "../components/ui";

/**
 * Ligas — ranking semanal por XP ganho (competição por esforço real, nunca por
 * dinheiro; a semana ISO reseta implicitamente). Destaca a posição do usuário.
 */
export function LigasScreen() {
  const utils = trpc.useUtils();
  const liga = trpc.league.week.useQuery();

  if (liga.isLoading) {
    return (
      <Screen>
        <View style={s.centro}>
          <ActivityIndicator color={cores.brand} size="large" />
        </View>
      </Screen>
    );
  }

  const eu = liga.data?.eu;

  return (
    <Screen semPadding>
      <FlatList
        data={liga.data?.ranking ?? []}
        keyExtractor={(r) => String(r.userId)}
        contentContainerStyle={{ paddingHorizontal: espaco.xl, paddingBottom: espaco.xxxl, gap: espaco.sm }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={liga.isFetching && !liga.isLoading}
            onRefresh={() => void utils.league.week.invalidate()}
            tintColor={cores.brand}
          />
        }
        ListHeaderComponent={
          <View style={{ paddingTop: espaco.sm, paddingBottom: espaco.lg }}>
            <AppText variante="peq" cor="muted">
              {liga.data?.totalParticipantes ?? 0} pessoas competindo esta semana
            </AppText>
            {eu && eu.rank !== null && (
              <Card elevado style={{ marginTop: espaco.md, borderColor: cores.brand }}>
                <View style={s.linha}>
                  <AppText variante="h2" cor="brand" tabular style={s.pos}>#{eu.rank}</AppText>
                  <AppText variante="corpoForte" cor="snow" style={{ flex: 1 }}>Você</AppText>
                  <AppText variante="corpoForte" cor="brand" tabular>{eu.xp} XP</AppText>
                </View>
              </Card>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Card elevado={item.souEu} style={item.souEu ? { borderColor: cores.brand } : undefined}>
            <View style={s.linha}>
              <AppText variante="h3" cor={item.rank <= 3 ? "brand" : "muted"} tabular style={s.pos}>
                {item.rank}
              </AppText>
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={s.avatar} contentFit="cover" />
              ) : (
                <View style={[s.avatar, s.avatarVazio]}>
                  <AppText variante="peq" cor="snow">
                    {(item.displayName ?? "?").charAt(0).toUpperCase()}
                  </AppText>
                </View>
              )}
              <AppText variante="corpo" cor="snow" style={{ flex: 1 }} numberOfLines={1}>
                {item.souEu ? "Você" : (item.displayName ?? "Alguém")}
              </AppText>
              <AppText variante="corpoForte" cor="snow" tabular>{item.xp} XP</AppText>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Card>
            <AppText variante="corpo" cor="muted" centro>
              Ninguém pontuou ainda esta semana. Seja o primeiro.
            </AppText>
          </Card>
        }
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  linha: { flexDirection: "row", alignItems: "center", gap: espaco.md },
  pos: { width: 40 },
  avatar: { width: 34, height: 34, borderRadius: raio.pill, backgroundColor: cores.graphite },
  avatarVazio: { justifyContent: "center", alignItems: "center" },
});
