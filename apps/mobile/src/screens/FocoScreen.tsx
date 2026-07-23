import { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import * as Crypto from "expo-crypto";
import { trpc } from "../lib/trpc";
import { cores, raio, espaco } from "../theme";
import { AppText, Screen, Card, Button } from "../components/ui";
import { useHaptics } from "../hooks/useHaptics";

interface Modo {
  id: string;
  nome: string;
  work: number;
  desc: string;
}
const MODOS: Modo[] = [
  { id: "pomodoro", nome: "Pomodoro", work: 25, desc: "25 min de foco" },
  { id: "deep", nome: "Deep Work", work: 50, desc: "50 min de foco" },
  { id: "sprint", nome: "Sprint", work: 90, desc: "90 min de foco" },
];

/**
 * Foco — Deep Work / Pomodoro cronometrado que vira XP (kind focus_session,
 * payload focusMinutes). Timer local; ao concluir o bloco, registra a sessão na
 * Área escolhida com prova automática. Paridade com /foco da web.
 */
export function FocoScreen() {
  const { sucesso, impacto, toque } = useHaptics();
  const utils = trpc.useUtils();
  const me = trpc.progress.me.useQuery();
  const resumo = trpc.action.focoResumo.useQuery();

  const [modo, setModo] = useState<Modo>(MODOS[1]!);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [restante, setRestante] = useState(modo.work * 60);
  const [rodando, setRodando] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const log = trpc.action.log.useMutation({
    onSuccess: () => {
      sucesso();
      void utils.action.focoResumo.invalidate();
      void utils.progress.me.invalidate();
    },
  });

  // Área default = primeira ativa quando os dados chegam.
  useEffect(() => {
    if (!areaId && me.data?.areas[0]) setAreaId(me.data.areas[0].id);
  }, [me.data, areaId]);

  useEffect(() => {
    if (!rodando) return;
    tick.current = setInterval(() => {
      setRestante((r) => {
        if (r <= 1) {
          clearInterval(tick.current!);
          concluir();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rodando]);

  function iniciar() {
    if (!areaId) return;
    impacto();
    setRestante(modo.work * 60);
    setRodando(true);
  }
  function parar() {
    toque();
    setRodando(false);
    if (tick.current) clearInterval(tick.current);
    setRestante(modo.work * 60);
  }
  function concluir() {
    setRodando(false);
    const area = me.data?.areas.find((a) => a.id === areaId);
    if (!area) return;
    log.mutate({
      lifeAreaId: area.id,
      clientActionId: Crypto.randomUUID(),
      kind: "focus_session",
      note: `Sessão de foco: ${modo.work} min em ${area.nome}.`,
      payload: { focusMinutes: modo.work },
    });
  }

  const min = Math.floor(restante / 60);
  const seg = restante % 60;
  const area = me.data?.areas.find((a) => a.id === areaId) ?? null;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: espaco.xxxl }}>
        <View style={s.timerWrap}>
          <AppText variante="display" cor={rodando ? "brand" : "snow"} tabular style={s.timer}>
            {String(min).padStart(2, "0")}:{String(seg).padStart(2, "0")}
          </AppText>
          <AppText variante="peq" cor="muted">
            {rodando ? `Foco em ${area?.nome ?? ""}` : modo.desc}
          </AppText>
        </View>

        {!rodando && (
          <>
            <AppText variante="micro" cor="faint" style={s.rotulo}>MODO</AppText>
            <View style={s.linhaChips}>
              {MODOS.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => {
                    toque();
                    setModo(m);
                    setRestante(m.work * 60);
                  }}
                  style={[s.chip, modo.id === m.id && s.chipAtivo]}
                >
                  <AppText variante="peq" cor={modo.id === m.id ? "void" : "muted"}>{m.nome}</AppText>
                </Pressable>
              ))}
            </View>

            <AppText variante="micro" cor="faint" style={s.rotulo}>ÁREA</AppText>
            <View style={s.linhaChips}>
              {(me.data?.areas ?? []).map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => {
                    toque();
                    setAreaId(a.id);
                  }}
                  style={[s.chip, areaId === a.id && s.chipAtivo]}
                >
                  <AppText variante="peq" cor={areaId === a.id ? "void" : "muted"}>{a.nome}</AppText>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <View style={{ marginTop: espaco.xl }}>
          {rodando ? (
            <Button titulo="Parar" variante="fantasma" onPress={parar} />
          ) : (
            <Button titulo="Iniciar foco" onPress={iniciar} desabilitado={!areaId || log.isPending} />
          )}
        </View>

        <Card style={{ marginTop: espaco.xl }} elevado>
          <AppText variante="micro" cor="faint">ESTA SEMANA</AppText>
          <View style={s.resumoLinha}>
            <View>
              <AppText variante="h2" cor="snow" tabular>{resumo.data?.sessoesSemana ?? 0}</AppText>
              <AppText variante="peq" cor="muted">sessões</AppText>
            </View>
            <View>
              <AppText variante="h2" cor="snow" tabular>{resumo.data?.minutosSemana ?? 0}</AppText>
              <AppText variante="peq" cor="muted">minutos</AppText>
            </View>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  timerWrap: { alignItems: "center", paddingVertical: espaco.xxxl },
  timer: { fontSize: 68, letterSpacing: -2 },
  rotulo: { marginTop: espaco.lg, marginBottom: espaco.sm },
  linhaChips: { flexDirection: "row", flexWrap: "wrap", gap: espaco.sm },
  chip: {
    borderColor: cores.line,
    borderWidth: 1,
    borderRadius: raio.pill,
    paddingHorizontal: espaco.lg,
    paddingVertical: espaco.sm,
    backgroundColor: cores.surface,
  },
  chipAtivo: { backgroundColor: cores.brand, borderColor: cores.brand },
  resumoLinha: { flexDirection: "row", gap: espaco.xxxl, marginTop: espaco.md },
});
