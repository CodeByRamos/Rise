import { useState } from "react";
import { View, StyleSheet, Pressable, Modal, ScrollView, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { trpc } from "../lib/trpc";
import { cores, raio, espaco } from "../theme";
import { AppText, Screen, Card } from "../components/ui";
import { useHaptics } from "../hooks/useHaptics";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DOW = ["D", "S", "T", "Q", "Q", "S", "S"];

/** Extrai o dia do mês de 'YYYY-MM-DD' ou de um número. */
function diaDoValor(v: string | number): number {
  if (typeof v === "number") return v;
  const p = v.split("-");
  return Number(p[2] ?? p[0] ?? 0);
}

/**
 * Histórico — calendário mensal de atividade (intensidade por nº de ações) e o
 * detalhe do dia (ações registradas com Área, XP e indicação de prova). Navega
 * entre meses. A prova (bucket privado) é sinalizada, não carregada aqui.
 */
export function HistoricoScreen() {
  const { toque } = useHaptics();
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1); // 1-12
  const [diaSel, setDiaSel] = useState<string | null>(null);

  const cal = trpc.progress.calendario.useQuery({ ano, mes });
  const detalhe = trpc.progress.diaDetalhe.useQuery(
    { data: diaSel ?? "2020-01-01" },
    { enabled: !!diaSel },
  );

  const porDia = new Map<number, number>();
  for (const d of cal.data?.dias ?? []) porDia.set(diaDoValor(d.dia), d.n);
  const maxN = Math.max(1, ...(cal.data?.dias ?? []).map((d) => d.n));

  const primeiroDow = new Date(ano, mes - 1, 1).getDay();
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array(primeiroDow).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  function mudarMes(delta: number) {
    toque();
    let m = mes + delta;
    let a = ano;
    if (m < 1) { m = 12; a -= 1; }
    if (m > 12) { m = 1; a += 1; }
    setMes(m);
    setAno(a);
  }

  function abrirDia(dia: number) {
    if (!porDia.get(dia)) return;
    toque();
    setDiaSel(`${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`);
  }

  return (
    <Screen>
      <View style={s.navMes}>
        <Pressable onPress={() => mudarMes(-1)} hitSlop={10}>
          <Feather name="chevron-left" size={22} color={cores.snow} />
        </Pressable>
        <AppText variante="h3" cor="snow">{MESES[mes - 1]} {ano}</AppText>
        <Pressable onPress={() => mudarMes(1)} hitSlop={10}>
          <Feather name="chevron-right" size={22} color={cores.snow} />
        </Pressable>
      </View>

      <View style={s.dowLinha}>
        {DOW.map((d, i) => (
          <AppText key={i} variante="micro" cor="faint" centro style={s.cel}>{d}</AppText>
        ))}
      </View>

      {cal.isLoading ? (
        <View style={s.centro}><ActivityIndicator color={cores.brand} /></View>
      ) : (
        <View style={s.grade}>
          {celulas.map((dia, i) => {
            if (dia === null) return <View key={`e${i}`} style={s.cel} />;
            const n = porDia.get(dia) ?? 0;
            const intensidade = n > 0 ? 0.25 + 0.75 * (n / maxN) : 0;
            return (
              <Pressable key={dia} style={s.cel} onPress={() => abrirDia(dia)}>
                <View style={[s.celDia, n > 0 && { backgroundColor: cores.brand, opacity: intensidade }]}>
                  <AppText variante="peq" cor={n > 0 ? "void" : "faint"} tabular>{dia}</AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Modal visible={!!diaSel} transparent animationType="slide" onRequestClose={() => setDiaSel(null)}>
        <Pressable style={s.modalFundo} onPress={() => setDiaSel(null)}>
          <Pressable style={s.modalCard} onPress={() => {}}>
            <View style={s.puxador} />
            <AppText variante="h3" cor="snow">{diaSel}</AppText>
            {detalhe.isLoading ? (
              <View style={{ paddingVertical: espaco.xl }}><ActivityIndicator color={cores.brand} /></View>
            ) : (
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={{ gap: espaco.sm }}>
                  {(detalhe.data ?? []).map((a) => (
                    <Card key={a.id} style={s.acao}>
                      <View style={[s.ponto, { backgroundColor: a.areaCor || cores.brand }]} />
                      <View style={{ flex: 1 }}>
                        <AppText variante="peq" cor="snow">{a.note ?? a.areaNome}</AppText>
                        <AppText variante="micro" cor="faint" style={{ letterSpacing: 0.3 }}>{a.areaNome}</AppText>
                      </View>
                      {a.photoPath && <Feather name="camera" size={14} color={cores.faint} />}
                      <AppText variante="peq" cor="brand" tabular>+{a.xp ?? 0}</AppText>
                    </Card>
                  ))}
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  navMes: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: espaco.md },
  dowLinha: { flexDirection: "row", marginBottom: espaco.sm },
  grade: { flexDirection: "row", flexWrap: "wrap" },
  cel: { width: `${100 / 7}%`, aspectRatio: 1, justifyContent: "center", alignItems: "center", padding: 3 },
  celDia: { width: "100%", height: "100%", borderRadius: raio.sm, justifyContent: "center", alignItems: "center", backgroundColor: cores.surface },
  centro: { paddingVertical: espaco.xxxl, alignItems: "center" },
  modalFundo: { flex: 1, backgroundColor: cores.overlay, justifyContent: "flex-end" },
  modalCard: { backgroundColor: cores.surface2, borderTopLeftRadius: raio.lg, borderTopRightRadius: raio.lg, padding: espaco.xxl, paddingBottom: espaco.xxxl, gap: espaco.md },
  puxador: { width: 40, height: 4, borderRadius: 2, backgroundColor: cores.lineStrong, alignSelf: "center", marginBottom: espaco.sm },
  acao: { flexDirection: "row", alignItems: "center", gap: espaco.md, padding: espaco.md },
  ponto: { width: 8, height: 8, borderRadius: 4 },
});
