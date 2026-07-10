/** Segunda-feira 00:00 UTC da semana corrente — janela global e justa. */
export function inicioSemanaUTC(now: Date): Date {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const dow = d.getUTCDay(); // 0=domingo … 6=sábado
  d.setUTCDate(d.getUTCDate() - ((dow + 6) % 7)); // recua até segunda
  return d;
}
