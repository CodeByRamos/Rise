import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { trpc } from "../lib/trpc";
import { cores, raio, espaco } from "../theme";
import { AppText, Screen, Card, Button } from "../components/ui";
import { useHaptics } from "../hooks/useHaptics";
import type { Nav, HojeStackParams } from "../navigation/types";

/**
 * Planejamento — centro de comando da semana: a intenção da semana (rumo, sem
 * XP fácil) e acesso rápido a Hábitos, Metas e Histórico. Um lugar para decidir
 * o que importa antes de agir.
 */
export function PlanejamentoScreen() {
  const { toque, sucesso } = useHaptics();
  const nav = useNavigation<Nav<HojeStackParams>>();
  const utils = trpc.useUtils();
  const me = trpc.progress.me.useQuery();
  const habitos = trpc.habit.hoje.useQuery();

  const [intencao, setIntencao] = useState("");
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    if (me.data && !editando) setIntencao(me.data.intencaoSemana ?? "");
  }, [me.data, editando]);

  const salvar = trpc.progress.setIntencao.useMutation({
    onSuccess: () => {
      setEditando(false);
      sucesso();
      void utils.progress.me.invalidate();
    },
  });

  const totalHabitos = habitos.data?.habitos.length ?? 0;
  const feitos = (habitos.data?.habitos ?? []).filter((h) => h.feitoHoje).length;

  const links: { rota: keyof HojeStackParams; icone: keyof typeof Feather.glyphMap; titulo: string; sub: string }[] = [
    { rota: "Habitos", icone: "check-circle", titulo: "Hábitos", sub: `${feitos}/${totalHabitos} feitos hoje` },
    { rota: "Metas", icone: "target", titulo: "Metas", sub: "Alvos por Área da Vida" },
    { rota: "Historico", icone: "calendar", titulo: "Histórico", sub: "Sua atividade mês a mês" },
  ];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: espaco.xxxl, gap: espaco.md }}>
        <AppText variante="h1" cor="snow" style={{ paddingTop: espaco.md }}>Planejar</AppText>

        <Card elevado style={{ gap: espaco.md }}>
          <View style={s.linha}>
            <Feather name="compass" size={16} color={cores.brand} />
            <AppText variante="micro" cor="faint">INTENÇÃO DA SEMANA</AppText>
          </View>
          {editando ? (
            <>
              <TextInput
                style={s.input}
                placeholder="O que essa semana precisa de você?"
                placeholderTextColor={cores.faint}
                multiline
                value={intencao}
                onChangeText={setIntencao}
                maxLength={200}
                autoFocus
              />
              <View style={{ flexDirection: "row", gap: espaco.sm }}>
                <Button
                  titulo={salvar.isPending ? "Salvando…" : "Salvar"}
                  onPress={() => salvar.mutate({ texto: intencao.trim() })}
                  ocupado={salvar.isPending}
                  style={{ flex: 1 }}
                />
                <Button titulo="Cancelar" variante="fantasma" onPress={() => { setEditando(false); setIntencao(me.data?.intencaoSemana ?? ""); }} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <Pressable onPress={() => { toque(); setEditando(true); }}>
              <AppText variante="corpo" cor={intencao ? "snow" : "muted"}>
                {intencao || "Toque para definir sua intenção desta semana."}
              </AppText>
            </Pressable>
          )}
        </Card>

        {links.map((l) => (
          <Pressable key={l.rota} onPress={() => { toque(); nav.navigate(l.rota); }}>
            <Card elevado style={s.linkCard}>
              <View style={s.icone}><Feather name={l.icone} size={18} color={cores.brand} /></View>
              <View style={{ flex: 1 }}>
                <AppText variante="corpoForte" cor="snow">{l.titulo}</AppText>
                <AppText variante="peq" cor="muted">{l.sub}</AppText>
              </View>
              <Feather name="chevron-right" size={18} color={cores.faint} />
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: "row", alignItems: "center", gap: espaco.sm },
  input: { backgroundColor: cores.surface, borderColor: cores.line, borderWidth: 1, borderRadius: raio.md, padding: espaco.lg, minHeight: 72, color: cores.snow, fontSize: 15, textAlignVertical: "top" },
  linkCard: { flexDirection: "row", alignItems: "center", gap: espaco.md },
  icone: { width: 40, height: 40, borderRadius: raio.pill, backgroundColor: cores.brandSoft, justifyContent: "center", alignItems: "center" },
});
