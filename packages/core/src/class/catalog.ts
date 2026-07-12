/**
 * Classes principais — identidade declarada no perfil (o que você É), distinta
 * das Áreas da Vida (o que você FAZ). RPG sóbrio: nomes curtos, zero
 * infantilização. `areaAfim` liga a Classe à Área da Vida que a nutre — base
 * para as Guerras de Classe (agregação de XP por classe) e para o TÍTULO da
 * Classe, que progride com o Nível da Área afim.
 *
 * Isolamento: Classe é cosmética/identitária. NUNCA concede XP, nível ou
 * vantagem competitiva individual — só pertencimento, lema e título de status.
 */

export interface ClasseDef {
  id: string;
  nome: string;
  /** Uma linha, tom mentor. Mostrada ao escolher e no perfil. */
  descricao: string;
  /** Lema curto da Classe — reforça a identidade. */
  lema: string;
  /** 5 títulos de rank (crescentes), mapeados pelo Nível da Área afim. */
  titulos: readonly [string, string, string, string, string];
  /** Nome do ícone (lucide-style), reservado — hoje a UI usa o ponto de cor. */
  icon: string;
  /** Token de cor do design system (reaproveita o da Área afim). */
  colorToken: string;
  /** Área da Vida que nutre a Classe (id do catálogo). Base das Guerras de Classe. */
  areaAfim: string;
}

export const CLASS_CATALOG: readonly ClasseDef[] = [
  { id: "desenvolvedor", nome: "Desenvolvedor", descricao: "Constrói o mundo em linhas de código.", lema: "Toda linha aproxima do impossível.", titulos: ["Iniciante", "Programador", "Engenheiro", "Arquiteto", "Mestre do Código"], icon: "code", colorToken: "--area-programacao", areaAfim: "programacao" },
  { id: "surfista", nome: "Surfista", descricao: "Lê o mar e vive a próxima onda.", lema: "A próxima onda é a melhor.", titulos: ["Novato", "Surfista", "Regular", "Big Rider", "Lenda do Mar"], icon: "waves", colorToken: "--area-surf", areaAfim: "surf" },
  { id: "atleta", nome: "Atleta", descricao: "Força forjada em treino e disciplina.", lema: "A disciplina vence o talento.", titulos: ["Iniciante", "Praticante", "Atleta", "Veterano", "Titã"], icon: "dumbbell", colorToken: "--area-academia", areaAfim: "academia" },
  { id: "corredor", nome: "Corredor", descricao: "Um pé na frente do outro, sempre adiante.", lema: "Adiante, sempre.", titulos: ["Novato", "Corredor", "Fundista", "Maratonista", "Ultramaratonista"], icon: "footprints", colorToken: "--area-corrida", areaAfim: "corrida" },
  { id: "ciclista", nome: "Ciclista", descricao: "A estrada é longa; o ritmo é seu.", lema: "O ritmo é seu.", titulos: ["Novato", "Pedalante", "Ciclista", "Escalador", "Rei da Montanha"], icon: "bike", colorToken: "--area-ciclismo", areaAfim: "ciclismo" },
  { id: "nadador", nome: "Nadador", descricao: "Braçada após braçada, contra a resistência.", lema: "Contra a resistência, sempre.", titulos: ["Iniciante", "Nadador", "Velocista", "Fundista", "Tritão"], icon: "waves", colorToken: "--area-natacao", areaAfim: "natacao" },
  { id: "escalador", nome: "Escalador", descricao: "O topo se conquista um agarre por vez.", lema: "Um agarre por vez.", titulos: ["Iniciante", "Escalador", "Alpinista", "Conquistador", "Mestre do Topo"], icon: "mountain", colorToken: "--area-escalada", areaAfim: "escalada" },
  { id: "skatista", nome: "Skatista", descricao: "Cai, levanta, tenta de novo até sair.", lema: "Cai, levanta, tenta de novo.", titulos: ["Novato", "Skatista", "Rider", "Pro", "Lenda do Skate"], icon: "activity", colorToken: "--area-skate", areaAfim: "skate" },
  { id: "erudito", nome: "Erudito", descricao: "Aprende sem parar; tudo vira conhecimento.", lema: "Tudo vira conhecimento.", titulos: ["Aprendiz", "Estudante", "Erudito", "Sábio", "Polímata"], icon: "book-open", colorToken: "--area-estudos", areaAfim: "estudos" },
  { id: "leitor", nome: "Leitor", descricao: "Devora livros e acumula mundos.", lema: "Cada livro, um mundo.", titulos: ["Curioso", "Leitor", "Bibliófilo", "Erudito", "Devorador de Livros"], icon: "book", colorToken: "--area-leitura", areaAfim: "leitura" },
  { id: "poliglota", nome: "Poliglota", descricao: "Cada idioma, uma nova forma de pensar.", lema: "Cada idioma, um novo eu.", titulos: ["Iniciante", "Falante", "Bilíngue", "Poliglota", "Intérprete"], icon: "languages", colorToken: "--area-idiomas", areaAfim: "idiomas" },
  { id: "musico", nome: "Músico", descricao: "Transforma disciplina em som.", lema: "Disciplina que vira som.", titulos: ["Iniciante", "Instrumentista", "Músico", "Virtuose", "Maestro"], icon: "music", colorToken: "--area-musica", areaAfim: "musica" },
  { id: "artista", nome: "Artista", descricao: "Vê o que ainda não existe e o desenha.", lema: "Ver o que ainda não existe.", titulos: ["Iniciante", "Ilustrador", "Artista", "Autor", "Mestre da Arte"], icon: "palette", colorToken: "--area-arte", areaAfim: "arte" },
  { id: "escritor", nome: "Escritor", descricao: "Ordena o caos em palavras.", lema: "Ordenar o caos em palavras.", titulos: ["Aprendiz", "Redator", "Escritor", "Autor", "Romancista"], icon: "pen-tool", colorToken: "--area-escrita", areaAfim: "escrita" },
  { id: "fotografo", nome: "Fotógrafo", descricao: "Congela o instante que os outros perdem.", lema: "Congelar o instante.", titulos: ["Amador", "Fotógrafo", "Autoral", "Documentarista", "Mestre da Luz"], icon: "camera", colorToken: "--area-fotografia", areaAfim: "fotografia" },
  { id: "chef", nome: "Chef", descricao: "Faz da rotina um ritual saboroso.", lema: "Rotina que vira ritual.", titulos: ["Aprendiz", "Cozinheiro", "Chef", "Chef de Cuisine", "Mestre-Cuca"], icon: "utensils", colorToken: "--area-culinaria", areaAfim: "culinaria" },
  { id: "gamer", nome: "Gamer", descricao: "Estratégia, reflexo e horas de maestria.", lema: "Maestria, um nível por vez.", titulos: ["Casual", "Jogador", "Competitivo", "Pro", "Lenda"], icon: "gamepad-2", colorToken: "--area-games", areaAfim: "games" },
  { id: "investidor", nome: "Investidor", descricao: "Pensa em anos enquanto os outros pensam em dias.", lema: "Pensar em anos.", titulos: ["Poupador", "Investidor", "Alocador", "Estrategista", "Magnata"], icon: "wallet", colorToken: "--area-financas", areaAfim: "financas" },
  { id: "empreendedor", nome: "Empreendedor", descricao: "Constrói o que ainda não existe.", lema: "Construir o que não existe.", titulos: ["Iniciante", "Fundador", "Empreendedor", "CEO", "Visionário"], icon: "briefcase", colorToken: "--area-trabalho", areaAfim: "trabalho" },
  { id: "monge", nome: "Monge", descricao: "Silêncio, foco e presença como prática.", lema: "Presença como prática.", titulos: ["Iniciante", "Praticante", "Contemplativo", "Asceta", "Iluminado"], icon: "sparkles", colorToken: "--area-espiritualidade", areaAfim: "espiritualidade" },
];

const POR_ID = new Map(CLASS_CATALOG.map((c) => [c.id, c] as const));

/** Definição da Classe pelo id, ou undefined se o slug não existe. */
export function classePorId(id: string | null | undefined): ClasseDef | undefined {
  return id ? POR_ID.get(id) : undefined;
}

/** Conjunto de ids válidos — para validação no servidor. */
export const CLASS_IDS: ReadonlySet<string> = new Set(CLASS_CATALOG.map((c) => c.id));

/** Níveis mínimos (da Área afim) de cada tier de título. */
export const CLASSE_TIER_MIN = [0, 2, 5, 15, 30] as const;

/** Tier (0..4) do título dado o Nível da Área afim. */
export function tierDaClasse(nivelAreaAfim: number): number {
  let tier = 0;
  for (let i = 0; i < CLASSE_TIER_MIN.length; i++) {
    if (nivelAreaAfim >= CLASSE_TIER_MIN[i]!) tier = i;
  }
  return tier;
}

/** Título de rank da Classe conforme o Nível da Área afim (cosmético). */
export function tituloDaClasse(classe: ClasseDef, nivelAreaAfim: number): string {
  return classe.titulos[tierDaClasse(nivelAreaAfim)] ?? classe.titulos[0];
}
