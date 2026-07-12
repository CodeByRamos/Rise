/** Segunda-feira 00:00 UTC da semana corrente — janela global e justa. */
export function inicioSemanaUTC(now: Date): Date {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const dow = d.getUTCDay(); // 0=domingo … 6=sábado
  d.setUTCDate(d.getUTCDate() - ((dow + 6) % 7)); // recua até segunda
  return d;
}

/**
 * Segunda-feira (YYYY-MM-DD) da semana de uma data LOCAL 'YYYY-MM-DD'.
 * Aritmética de calendário pura sobre a data local do usuário — usada como
 * `assignedDate` das missões semanais (uma linha por semana).
 */
export function segundaDaSemanaLocal(isoLocal: string): string {
  const d = new Date(`${isoLocal}T00:00:00Z`);
  const diff = (d.getUTCDay() + 6) % 7; // dias desde segunda
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}
