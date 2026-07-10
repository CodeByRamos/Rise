/**
 * Classes principais — identidade declarada no perfil (o que você É), distinta
 * das Áreas da Vida (o que você FAZ). RPG sóbrio: nomes curtos, zero
 * infantilização. `areaAfim` liga a Classe à Área da Vida que a nutre — base
 * para as futuras Guerras de Classe (agregação de XP por classe). `colorToken`
 * e `icon` reaproveitam os da Área afim para coerência visual.
 *
 * Isolamento: Classe é cosmética/identitária. NUNCA concede XP, nível ou
 * vantagem competitiva individual — só pertencimento.
 */

export interface ClasseDef {
  id: string;
  nome: string;
  /** Uma linha, tom mentor. Mostrada ao escolher e no perfil. */
  descricao: string;
  /** Nome do ícone (lucide-style), reservado — hoje a UI usa o ponto de cor. */
  icon: string;
  /** Token de cor do design system (reaproveita o da Área afim). */
  colorToken: string;
  /** Área da Vida que nutre a Classe (id do catálogo). Base das Guerras de Classe. */
  areaAfim: string;
}

export const CLASS_CATALOG: readonly ClasseDef[] = [
  { id: "desenvolvedor", nome: "Desenvolvedor", descricao: "Constrói o mundo em linhas de código.", icon: "code", colorToken: "--area-programacao", areaAfim: "programacao" },
  { id: "surfista", nome: "Surfista", descricao: "Lê o mar e vive a próxima onda.", icon: "waves", colorToken: "--area-surf", areaAfim: "surf" },
  { id: "atleta", nome: "Atleta", descricao: "Força forjada em treino e disciplina.", icon: "dumbbell", colorToken: "--area-academia", areaAfim: "academia" },
  { id: "corredor", nome: "Corredor", descricao: "Um pé na frente do outro, sempre adiante.", icon: "footprints", colorToken: "--area-corrida", areaAfim: "corrida" },
  { id: "ciclista", nome: "Ciclista", descricao: "A estrada é longa; o ritmo é seu.", icon: "bike", colorToken: "--area-ciclismo", areaAfim: "ciclismo" },
  { id: "nadador", nome: "Nadador", descricao: "Braçada após braçada, contra a resistência.", icon: "waves", colorToken: "--area-natacao", areaAfim: "natacao" },
  { id: "escalador", nome: "Escalador", descricao: "O topo se conquista um agarre por vez.", icon: "mountain", colorToken: "--area-escalada", areaAfim: "escalada" },
  { id: "skatista", nome: "Skatista", descricao: "Cai, levanta, tenta de novo até sair.", icon: "activity", colorToken: "--area-skate", areaAfim: "skate" },
  { id: "erudito", nome: "Erudito", descricao: "Aprende sem parar; tudo vira conhecimento.", icon: "book-open", colorToken: "--area-estudos", areaAfim: "estudos" },
  { id: "leitor", nome: "Leitor", descricao: "Devora livros e acumula mundos.", icon: "book", colorToken: "--area-leitura", areaAfim: "leitura" },
  { id: "poliglota", nome: "Poliglota", descricao: "Cada idioma, uma nova forma de pensar.", icon: "languages", colorToken: "--area-idiomas", areaAfim: "idiomas" },
  { id: "musico", nome: "Músico", descricao: "Transforma disciplina em som.", icon: "music", colorToken: "--area-musica", areaAfim: "musica" },
  { id: "artista", nome: "Artista", descricao: "Vê o que ainda não existe e o desenha.", icon: "palette", colorToken: "--area-arte", areaAfim: "arte" },
  { id: "escritor", nome: "Escritor", descricao: "Ordena o caos em palavras.", icon: "pen-tool", colorToken: "--area-escrita", areaAfim: "escrita" },
  { id: "fotografo", nome: "Fotógrafo", descricao: "Congela o instante que os outros perdem.", icon: "camera", colorToken: "--area-fotografia", areaAfim: "fotografia" },
  { id: "chef", nome: "Chef", descricao: "Faz da rotina um ritual saboroso.", icon: "utensils", colorToken: "--area-culinaria", areaAfim: "culinaria" },
  { id: "gamer", nome: "Gamer", descricao: "Estratégia, reflexo e horas de maestria.", icon: "gamepad-2", colorToken: "--area-games", areaAfim: "games" },
  { id: "investidor", nome: "Investidor", descricao: "Pensa em anos enquanto os outros pensam em dias.", icon: "wallet", colorToken: "--area-financas", areaAfim: "financas" },
  { id: "empreendedor", nome: "Empreendedor", descricao: "Constrói o que ainda não existe.", icon: "briefcase", colorToken: "--area-trabalho", areaAfim: "trabalho" },
  { id: "monge", nome: "Monge", descricao: "Silêncio, foco e presença como prática.", icon: "sparkles", colorToken: "--area-espiritualidade", areaAfim: "espiritualidade" },
];

const POR_ID = new Map(CLASS_CATALOG.map((c) => [c.id, c] as const));

/** Definição da Classe pelo id, ou undefined se o slug não existe. */
export function classePorId(id: string | null | undefined): ClasseDef | undefined {
  return id ? POR_ID.get(id) : undefined;
}

/** Conjunto de ids válidos — para validação no servidor. */
export const CLASS_IDS: ReadonlySet<string> = new Set(CLASS_CATALOG.map((c) => c.id));
