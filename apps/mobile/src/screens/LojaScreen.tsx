import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { trpc } from "../lib/trpc";
import { cores, raio, espaco } from "../theme";
import { AppText, Screen, Card, Button, Badge } from "../components/ui";
import { useHaptics } from "../hooks/useHaptics";

/**
 * Loja — catálogo cosmético comprável com Faíscas (moeda isolada do XP; jamais
 * pay-to-win, ADR 0007). Preço recomputado no servidor; a compra debita atômico.
 */
export function LojaScreen() {
  const { sucesso, erro: hapticErro, toque } = useHaptics();
  const utils = trpc.useUtils();
  const loja = trpc.shop.catalog.useQuery();

  const comprar = trpc.shop.buy.useMutation({
    onSuccess: () => {
      sucesso();
      void utils.shop.catalog.invalidate();
    },
    onError: () => hapticErro(),
  });

  if (loja.isLoading) {
    return (
      <Screen>
        <View style={s.centro}>
          <ActivityIndicator color={cores.brand} size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen semPadding>
      <FlatList
        data={loja.data?.itens ?? []}
        keyExtractor={(i) => i.id}
        numColumns={2}
        columnWrapperStyle={{ gap: espaco.md }}
        contentContainerStyle={{ paddingHorizontal: espaco.xl, paddingBottom: espaco.xxxl, gap: espaco.md }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loja.isFetching && !loja.isLoading}
            onRefresh={() => void utils.shop.catalog.invalidate()}
            tintColor={cores.brand}
          />
        }
        ListHeaderComponent={
          <View style={s.saldo}>
            <AppText variante="micro" cor="faint">SUAS FAÍSCAS</AppText>
            <AppText variante="display" cor="brand" tabular>{loja.data?.saldo ?? 0}</AppText>
          </View>
        }
        renderItem={({ item }) => (
          <Card elevado style={s.item}>
            <View style={s.preview}>
              <AppText variante="h1" cor="snow">{item.name.charAt(0)}</AppText>
            </View>
            <View style={s.itemTopo}>
              <AppText variante="peq" cor="snow" numberOfLines={1} style={{ flex: 1 }}>{item.name}</AppText>
            </View>
            <Badge texto={String(item.rarity).toUpperCase()} />
            {item.owned ? (
              <View style={s.possui}>
                <AppText variante="micro" cor="brand">NO INVENTÁRIO</AppText>
              </View>
            ) : (
              <Button
                titulo={`Comprar · ${item.preco}`}
                onPress={() => {
                  toque();
                  comprar.mutate({ itemId: item.id });
                }}
                desabilitado={!item.compravel || comprar.isPending}
                style={{ marginTop: espaco.sm, paddingVertical: 10 }}
              />
            )}
          </Card>
        )}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  saldo: { alignItems: "center", paddingTop: espaco.sm, paddingBottom: espaco.lg },
  item: { flex: 1, gap: espaco.sm },
  preview: {
    height: 88,
    borderRadius: raio.md,
    backgroundColor: cores.graphite,
    justifyContent: "center",
    alignItems: "center",
  },
  itemTopo: { flexDirection: "row", alignItems: "center" },
  possui: {
    marginTop: espaco.sm,
    paddingVertical: 10,
    borderRadius: raio.md,
    borderColor: cores.brand,
    borderWidth: 1,
    alignItems: "center",
  },
});
