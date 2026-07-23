import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

/**
 * Param lists dos stacks por aba. Cada aba é um stack próprio: a tela principal
 * empilha telas de detalhe (padrão nativo). Tipagem forte da navegação —
 * useNavigation<Nav<'X'>>() garante rotas/params corretos em compile time.
 */
export type HojeStackParams = {
  HojeHome: undefined;
  Foco: undefined;
  Planejamento: undefined;
  Habitos: undefined;
  Metas: undefined;
  Historico: undefined;
};

export type EvolucaoStackParams = {
  EvolucaoHome: undefined;
  Estatisticas: undefined;
};

export type ComunidadeStackParams = {
  ComunidadeHome: undefined;
  Ligas: undefined;
  GuerraClasses: undefined;
};

export type PerfilStackParams = {
  PerfilHome: undefined;
  Loja: undefined;
};

export type Nav<
  P extends Record<string, object | undefined>,
> = NativeStackNavigationProp<P>;
