/**
 * Templates de Ação por Área da Vida — sugestões que preenchem o registro
 * rápido (docs/13 §3, docs/17 Sprint 2: "maior RICE do produto"). Antes o
 * registro era nota livre em branco; isso é a fricção que faz a Área parecer
 * "sem graça". Agora cada Área oferece 4–5 ações prontas (toque para
 * preencher a nota, editável antes de enviar). Puramente sugestão de
 * conteúdo — nunca altera XP-base, curva ou regra de negócio.
 */

export interface ActionTemplate {
  /** Slug único dentro da área — não persiste em lugar nenhum, só de UI. */
  id: string;
  /** Texto que preenche o campo de nota (o usuário pode editar). */
  label: string;
  /** Sugestão de intensidade (1 = padrão, 2 = redobrada) — usuário pode mudar. */
  intensity?: 1 | 2;
}

export const ACTION_TEMPLATES: Readonly<Record<string, readonly ActionTemplate[]>> = {
  estudos: [
    { id: "aula", label: "Assisti a uma aula ou curso" },
    { id: "resumo", label: "Fiz um resumo do que estudei" },
    { id: "exercicios", label: "Resolvi exercícios" },
    { id: "revisao", label: "Revisei conteúdo antigo" },
  ],
  programacao: [
    { id: "projeto", label: "Codei no meu projeto" },
    { id: "bug", label: "Resolvi um bug difícil" },
    { id: "curso", label: "Estudei uma tecnologia nova" },
    { id: "opensource", label: "Contribuí em open source" },
    { id: "refactor", label: "Refatorei código legado", intensity: 2 },
  ],
  academia: [
    { id: "forca", label: "Treino de força" },
    { id: "cardio", label: "Treino de cardio" },
    { id: "casa", label: "Treino em casa" },
    { id: "pr", label: "Bati um recorde pessoal", intensity: 2 },
  ],
  saude: [
    { id: "checkup", label: "Fiz um check-up ou exame" },
    { id: "agua", label: "Bebi água o dia todo" },
    { id: "postura", label: "Cuidei da postura" },
    { id: "remedio", label: "Segui o tratamento em dia" },
  ],
  sono: [
    { id: "cedo", label: "Dormi no horário certo" },
    { id: "oito", label: "Dormi 8 horas" },
    { id: "sem-tela", label: "Sem tela antes de dormir" },
    { id: "soneca", label: "Cochilo restaurador" },
  ],
  alimentacao: [
    { id: "caseira", label: "Comida caseira e equilibrada" },
    { id: "sem-acucar", label: "Um dia sem açúcar" },
    { id: "vegetais", label: "Pratos com mais vegetais" },
    { id: "planejei", label: "Planejei as refeições da semana" },
  ],
  leitura: [
    { id: "capitulo", label: "Li um capítulo" },
    { id: "livro", label: "Terminei um livro", intensity: 2 },
    { id: "artigo", label: "Li um artigo ou ensaio" },
    { id: "audiobook", label: "Ouvi um audiobook" },
  ],
  financas: [
    { id: "planilha", label: "Atualizei minhas finanças" },
    { id: "poupei", label: "Guardei uma parte da renda" },
    { id: "investi", label: "Fiz um aporte" },
    { id: "corte", label: "Cortei um gasto desnecessário" },
  ],
  idiomas: [
    { id: "conversacao", label: "Pratiquei conversação" },
    { id: "vocabulario", label: "Revisei vocabulário novo" },
    { id: "serie", label: "Assisti conteúdo no idioma" },
    { id: "app", label: "Completei a lição do app" },
  ],
  musica: [
    { id: "pratica", label: "Pratiquei um instrumento" },
    { id: "musica-nova", label: "Aprendi uma música nova" },
    { id: "teoria", label: "Estudei teoria musical" },
    { id: "composicao", label: "Compus ou improvisei" },
  ],
  surf: [
    { id: "sessao", label: "Peguei uma sessão de surf" },
    { id: "manobra", label: "Treinei uma manobra nova" },
    { id: "remada", label: "Trabalhei o preparo físico do surf" },
    { id: "onda-grande", label: "Enfrentei uma onda grande", intensity: 2 },
  ],
  skate: [
    { id: "sessao", label: "Sessão de skate na rua ou pista" },
    { id: "manobra-nova", label: "Aprendi uma manobra nova" },
    { id: "queda", label: "Caí e levantei de novo" },
    { id: "linha", label: "Fechei uma linha difícil", intensity: 2 },
  ],
  espiritualidade: [
    { id: "oracao", label: "Momento de oração ou reflexão" },
    { id: "gratidao", label: "Escrevi o que sou grato" },
    { id: "silencio", label: "Tempo de silêncio e presença" },
    { id: "leitura-espiritual", label: "Li algo espiritual" },
  ],
  relacionamentos: [
    { id: "conversa", label: "Conversa de verdade com alguém" },
    { id: "presente", label: "Estive presente sem celular" },
    { id: "reconciliar", label: "Resolvi um desentendimento" },
    { id: "reconectar", label: "Reconectei com alguém distante" },
  ],
  trabalho: [
    { id: "entrega", label: "Entreguei uma tarefa importante" },
    { id: "reuniao", label: "Reunião produtiva" },
    { id: "planejamento", label: "Planejei a semana de trabalho" },
    { id: "aprendizado", label: "Aprendi uma habilidade nova no trabalho" },
  ],
  corrida: [
    { id: "corrida-leve", label: "Corrida leve" },
    { id: "tiro", label: "Treino de tiros/intervalado" },
    { id: "longao", label: "Fiz um longão", intensity: 2 },
    { id: "distancia", label: "Bati minha maior distância", intensity: 2 },
  ],
  ciclismo: [
    { id: "pedal", label: "Pedal do dia a dia" },
    { id: "trilha", label: "Pedal de trilha/MTB" },
    { id: "treino", label: "Treino intervalado na bike" },
    { id: "rota-longa", label: "Rota longa", intensity: 2 },
  ],
  natacao: [
    { id: "piscina", label: "Treino na piscina" },
    { id: "tecnica", label: "Trabalhei a técnica" },
    { id: "mar", label: "Nadei no mar/aberto" },
    { id: "distancia", label: "Bati minha maior distância", intensity: 2 },
  ],
  yoga: [
    { id: "pratica", label: "Prática de yoga" },
    { id: "respiracao", label: "Exercício de respiração" },
    { id: "alongamento", label: "Sessão de alongamento" },
    { id: "postura-nova", label: "Aprendi uma postura nova" },
  ],
  escalada: [
    { id: "sessao", label: "Sessão de escalada ou boulder" },
    { id: "via-nova", label: "Completei uma via nova" },
    { id: "forca-dedos", label: "Treino de força/dedos" },
    { id: "grau-novo", label: "Subi de grau", intensity: 2 },
  ],
  danca: [
    { id: "aula", label: "Aula de dança" },
    { id: "pratica-livre", label: "Pratiquei livremente" },
    { id: "coreografia", label: "Aprendi uma coreografia" },
    { id: "apresentacao", label: "Me apresentei ou gravei", intensity: 2 },
  ],
  natureza: [
    { id: "trilha", label: "Fiz uma trilha" },
    { id: "ar-livre", label: "Tempo ao ar livre" },
    { id: "acampamento", label: "Acampei ou passei a noite fora", intensity: 2 },
    { id: "observacao", label: "Observei a natureza com calma" },
  ],
  arte: [
    { id: "desenho", label: "Desenhei ou pintei" },
    { id: "estudo-tecnico", label: "Estudei uma técnica nova" },
    { id: "obra", label: "Terminei uma peça", intensity: 2 },
    { id: "exposicao", label: "Visitei uma exposição de referência" },
  ],
  escrita: [
    { id: "pagina", label: "Escrevi uma página" },
    { id: "diario", label: "Escrevi no diário" },
    { id: "revisao", label: "Revisei um texto" },
    { id: "publiquei", label: "Publiquei algo que escrevi", intensity: 2 },
  ],
  fotografia: [
    { id: "ensaio", label: "Saí para fotografar" },
    { id: "edicao", label: "Editei fotos" },
    { id: "tecnica", label: "Pratiquei uma técnica nova" },
    { id: "portfolio", label: "Atualizei o portfólio" },
  ],
  culinaria: [
    { id: "receita-nova", label: "Fiz uma receita nova" },
    { id: "tecnica", label: "Pratiquei uma técnica de cozinha" },
    { id: "marmita", label: "Preparei marmitas da semana" },
    { id: "para-alguem", label: "Cozinhei para alguém" },
  ],
  jardinagem: [
    { id: "regar", label: "Cuidei das plantas" },
    { id: "plantio", label: "Plantei algo novo" },
    { id: "colheita", label: "Fiz uma colheita" },
    { id: "poda", label: "Poda e manutenção" },
  ],
  meditacao: [
    { id: "sessao", label: "Sessão de meditação" },
    { id: "respiracao", label: "Exercício de respiração guiada" },
    { id: "mindfulness", label: "Momento de atenção plena no dia" },
    { id: "retiro", label: "Retiro ou sessão longa", intensity: 2 },
  ],
  games: [
    { id: "ranked", label: "Partida ranqueada" },
    { id: "aprendizado", label: "Aprendi uma estratégia nova" },
    { id: "campanha", label: "Avancei numa campanha" },
    { id: "conquista", label: "Desbloqueei uma conquista difícil", intensity: 2 },
  ],
  voluntariado: [
    { id: "acao", label: "Fiz uma ação voluntária" },
    { id: "doacao", label: "Fiz uma doação" },
    { id: "mentoria", label: "Ajudei ou dei mentoria a alguém" },
    { id: "evento", label: "Participei de um evento social" },
  ],
};

/** Sugestões da área, ou lista vazia se a área não tiver templates (custom). */
export function templatesDaArea(areaCatalogId: string | null | undefined): readonly ActionTemplate[] {
  if (!areaCatalogId) return [];
  return ACTION_TEMPLATES[areaCatalogId] ?? [];
}
