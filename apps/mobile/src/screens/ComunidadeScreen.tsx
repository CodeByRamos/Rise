import { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { trpc } from "../lib/trpc";
import { cores, raio, espaco } from "../theme";
import { AppText, Screen, Card, Badge } from "../components/ui";
import { useHaptics } from "../hooks/useHaptics";
import { tempoRelativo, fraseDoMarco, tipoDoMarco } from "../utils/format";
import type { Nav, ComunidadeStackParams } from "../navigation/types";

type Escopo = "global" | "seguindo";

/**
 * Comunidade — o feed de marcos das outras pessoas, estilo rede social com a
 * identidade Rise. Alterna Comunidade/Seguindo; "Força" com haptic e update
 * otimista. Cada marco vira um card com selo, frase e reação.
 */
export function ComunidadeScreen() {
  const { impacto } = useHaptics();
  const nav = useNavigation<Nav<ComunidadeStackParams>>();
  const [escopo, setEscopo] = useState<Escopo>("global");
  const utils = trpc.useUtils();
  const feed = trpc.feed.list.useQuery({ escopo });

  const react = trpc.feed.react.useMutation({
    onSettled: () => void utils.feed.list.invalidate(),
  });

  return (
    <Screen semPadding>
      <View style={s.topo}>
        <View style={s.tituloLinha}>
          <AppText variante="h1" cor="snow">Comunidade</AppText>
          <View style={s.atalhos}>
            <Pressable style={s.atalho} onPress={() => nav.navigate("Ligas")}>
              <Feather name="award" size={18} color={cores.brand} />
            </Pressable>
            <Pressable style={s.atalho} onPress={() => nav.navigate("GuerraClasses")}>
              <Feather name="shield" size={18} color={cores.brand} />
            </Pressable>
          </View>
        </View>
        <View style={s.toggle}>
          {(["global", "seguindo"] as const).map((e) => (
            <Pressable
              key={e}
              onPress={() => {
                impacto();
                setEscopo(e);
              }}
              style={[s.toggleItem, escopo === e && s.toggleAtivo]}
            >
              <AppText variante="peq" cor={escopo === e ? "void" : "muted"}>
                {e === "global" ? "Comunidade" : "Seguindo"}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {feed.isLoading ? (
        <View style={s.centro}>
          <ActivityIndicator color={cores.brand} />
        </View>
      ) : (
        <FlatList
          data={feed.data ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: espaco.xl, paddingBottom: espaco.xxxl, gap: espaco.md }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={feed.isFetching && !feed.isLoading}
              onRefresh={() => void utils.feed.list.invalidate()}
              tintColor={cores.brand}
            />
          }
          renderItem={({ item }) => (
            <Card elevado>
              <View style={s.marcoTopo}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={s.avatar} contentFit="cover" />
                ) : (
                  <View style={[s.avatar, s.avatarVazio]}>
                    <AppText variante="corpoForte" cor="snow">
                      {(item.displayName ?? "?").charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <AppText variante="corpoForte" cor="snow">{item.displayName ?? "Alguém"}</AppText>
                  <AppText variante="micro" cor="faint" style={{ letterSpacing: 0.5 }}>
                    {tempoRelativo(item.createdAt)}
                  </AppText>
                </View>
                <Badge texto={tipoDoMarco(item.type)} />
              </View>

              <AppText variante="corpo" cor="snow" style={{ marginTop: espaco.md }}>
                {fraseDoMarco(item.type, item.payload)}
              </AppText>

              <Pressable
                onPress={() => {
                  impacto();
                  react.mutate({ feedItemId: item.id });
                }}
                style={s.forca}
              >
                <Feather
                  name="zap"
                  size={15}
                  color={item.deiForca ? cores.brand : cores.muted}
                />
                <AppText variante="peq" cor={item.deiForca ? "brand" : "muted"} tabular>
                  {item.forcas} {item.forcas === 1 ? "Força" : "Forças"}
                </AppText>
              </Pressable>
            </Card>
          )}
          ListEmptyComponent={
            <Card>
              <AppText variante="corpo" cor="muted" centro>
                {escopo === "seguindo"
                  ? "Siga pessoas para ver os marcos delas aqui."
                  : "Ainda não há marcos por aqui. Registre uma ação e comece o movimento."}
              </AppText>
            </Card>
          }
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  topo: { paddingHorizontal: espaco.xl, paddingTop: espaco.md, paddingBottom: espaco.lg, gap: espaco.md },
  tituloLinha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  atalhos: { flexDirection: "row", gap: espaco.sm },
  atalho: {
    width: 40,
    height: 40,
    borderRadius: raio.pill,
    borderColor: cores.line,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  toggle: { flexDirection: "row", backgroundColor: cores.surface, borderRadius: raio.pill, padding: 3, alignSelf: "flex-start" },
  toggleItem: { paddingHorizontal: espaco.lg, paddingVertical: espaco.sm, borderRadius: raio.pill },
  toggleAtivo: { backgroundColor: cores.brand },
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  marcoTopo: { flexDirection: "row", alignItems: "center", gap: espaco.md },
  avatar: { width: 40, height: 40, borderRadius: raio.pill, backgroundColor: cores.graphite },
  avatarVazio: { justifyContent: "center", alignItems: "center" },
  forca: { flexDirection: "row", alignItems: "center", gap: espaco.sm, marginTop: espaco.lg },
});
