import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { trpc } from "../lib/trpc";
import { supabase } from "../lib/supabase";
import { cores, raio, espaco } from "../theme";
import { AppText, Screen, Card, Button, Badge, Divider } from "../components/ui";
import { useHaptics } from "../hooks/useHaptics";
import { tempoRelativo } from "../utils/format";
import type { Nav, PerfilStackParams } from "../navigation/types";

/**
 * Perfil — identidade do jogador: avatar, handle, plano e conquistas. Ponto de
 * saída da conta. Edição de perfil/cosméticos e assinatura entram como telas de
 * detalhe (stack) nas próximas fases.
 */
export function PerfilScreen() {
  const { toque } = useHaptics();
  const nav = useNavigation<Nav<PerfilStackParams>>();
  const utils = trpc.useUtils();
  const perfil = trpc.profile.get.useQuery();
  const conquistas = trpc.profile.achievements.useQuery();
  const assinatura = trpc.subscription.status.useQuery();

  const p = perfil.data;

  return (
    <Screen semPadding>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: espaco.xl, paddingBottom: espaco.xxxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={perfil.isFetching && !perfil.isLoading}
            onRefresh={() => {
              void utils.profile.get.invalidate();
              void utils.profile.achievements.invalidate();
            }}
            tintColor={cores.brand}
          />
        }
      >
        <View style={s.cabecalho}>
          {p?.avatarUrl ? (
            <Image source={{ uri: p.avatarUrl }} style={s.avatar} contentFit="cover" />
          ) : (
            <View style={[s.avatar, s.avatarVazio]}>
              <AppText variante="display" cor="snow">
                {(p?.displayName ?? "?").charAt(0).toUpperCase()}
              </AppText>
            </View>
          )}
          <AppText variante="h2" cor="snow" style={{ marginTop: espaco.md }}>
            {p?.displayName ?? "Carregando…"}
          </AppText>
          {p?.handle && (
            <AppText variante="peq" cor="muted">@{p.handle}</AppText>
          )}
          {assinatura.data?.isPremium && (
            <View style={{ marginTop: espaco.sm }}>
              <Badge texto={assinatura.data.plan === "founder" ? "FUNDADOR" : "RISE+"} />
            </View>
          )}
          {p?.bio ? (
            <AppText variante="corpo" cor="muted" centro style={{ marginTop: espaco.md }}>
              {p.bio}
            </AppText>
          ) : null}
        </View>

        <Divider />

        <Pressable style={s.linkCard} onPress={() => nav.navigate("Loja")}>
          <Feather name="shopping-bag" size={18} color={cores.brand} />
          <AppText variante="corpo" cor="snow" style={{ flex: 1 }}>Loja de cosméticos</AppText>
          <Feather name="chevron-right" size={18} color={cores.faint} />
        </Pressable>

        <View style={{ height: espaco.lg }} />

        <AppText variante="h3" cor="snow" style={{ marginBottom: espaco.md }}>
          Conquistas
        </AppText>
        {conquistas.data && conquistas.data.length > 0 ? (
          <View style={{ gap: espaco.sm }}>
            {conquistas.data.map((c) => (
              <Card key={c.id} elevado style={s.conquista}>
                <View style={{ flex: 1 }}>
                  <AppText variante="corpoForte" cor="snow">{c.nome ?? c.id}</AppText>
                  {c.unlockedAt && (
                    <AppText variante="micro" cor="faint" style={{ letterSpacing: 0.3 }}>
                      {tempoRelativo(c.unlockedAt)}
                    </AppText>
                  )}
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <Card>
            <AppText variante="corpo" cor="muted" centro>
              Suas conquistas aparecem aqui conforme você evolui.
            </AppText>
          </Card>
        )}

        <Divider />

        <Button
          titulo="Sair da conta"
          variante="perigo"
          onPress={() => {
            toque();
            void supabase.auth.signOut();
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  cabecalho: { alignItems: "center", paddingTop: espaco.xl, paddingBottom: espaco.lg },
  avatar: { width: 96, height: 96, borderRadius: raio.pill, backgroundColor: cores.graphite },
  avatarVazio: { justifyContent: "center", alignItems: "center", borderColor: cores.line, borderWidth: 1 },
  conquista: { flexDirection: "row", alignItems: "center" },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.md,
    backgroundColor: cores.surface,
    borderColor: cores.line,
    borderWidth: 1,
    borderRadius: raio.card,
    padding: espaco.lg,
  },
});

