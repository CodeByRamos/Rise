"use client";

import { trpc } from "@/lib/trpc/react";

const SEMANAS = 26;
const DIAS = SEMANAS * 7;

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/** Cor por intensidade de ações no dia (escala esmeralda). */
function cor(n: number): string {
  if (n <= 0) return "var(--color-graphite)";
  if (n === 1) return "color-mix(in srgb, var(--color-brand) 28%, var(--color-void))";
  if (n <= 3) return "color-mix(in srgb, var(--color-brand) 55%, var(--color-void))";
  if (n <= 5) return "color-mix(in srgb, var(--color-brand) 78%, var(--color-void))";
  return "var(--color-brand)";
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Heatmap de consistência — "toda ação aparece". */
export function Heatmap() {
  const dados = trpc.progress.heatmap.useQuery();

  const mapa = new Map<string, number>();
  for (const r of dados.data ?? []) mapa.set(r.dia, r.n);

  // Alinha a última coluna terminando hoje; recua até um domingo.
  const hoje = new Date();
  const fim = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()));
  const inicio = new Date(fim);
  inicio.setUTCDate(inicio.getUTCDate() - (DIAS - 1));
  inicio.setUTCDate(inicio.getUTCDate() - inicio.getUTCDay()); // volta ao domingo

  const colunas: { data: Date; n: number }[][] = [];
  const cursor = new Date(inicio);
  while (cursor <= fim) {
    const semana: { data: Date; n: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const dentroJanela = cursor <= fim;
      semana.push({
        data: new Date(cursor),
        n: dentroJanela ? (mapa.get(iso(cursor)) ?? 0) : -1,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    colunas.push(semana);
  }

  const total = (dados.data ?? []).reduce((s, r) => s + r.n, 0);
  const ativos = (dados.data ?? []).filter((r) => r.n > 0).length;

  // Rótulos de mês (mostra quando a semana começa num mês novo).
  const rotulos = colunas.map((sem, i) => {
    const primeiro = sem[0]!.data;
    const anterior = i > 0 ? colunas[i - 1]![0]!.data : null;
    if (!anterior || primeiro.getUTCMonth() !== anterior.getUTCMonth()) {
      return MESES[primeiro.getUTCMonth()]!;
    }
    return "";
  });

  return (
    <section className="mt-10 rounded-[24px] border border-line bg-surface-2 p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-faint">
          Consistência
        </h2>
        <span className="tnum text-xs text-muted">
          {ativos} dias ativos · {total} ações
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="inline-flex flex-col gap-1.5">
          <div className="flex gap-1 pl-0">
            {rotulos.map((m, i) => (
              <span
                key={i}
                className="w-3 text-[9px] text-faint"
                style={{ minWidth: 12 }}
              >
                {m}
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            {colunas.map((sem, ci) => (
              <div key={ci} className="flex flex-col gap-1">
                {sem.map((d, di) => (
                  <span
                    key={di}
                    className="size-3 rounded-[3px]"
                    title={
                      d.n >= 0
                        ? `${d.n} ${d.n === 1 ? "ação" : "ações"} em ${d.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`
                        : undefined
                    }
                    style={{
                      backgroundColor: d.n < 0 ? "transparent" : cor(d.n),
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[10px] text-faint">
        <span>menos</span>
        {[0, 1, 3, 5, 8].map((n) => (
          <span
            key={n}
            className="size-3 rounded-[3px]"
            style={{ backgroundColor: cor(n) }}
          />
        ))}
        <span>mais</span>
      </div>
    </section>
  );
}
