import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { cores, tipo } from "../theme";
import type {
  HojeStackParams,
  EvolucaoStackParams,
  ComunidadeStackParams,
  PerfilStackParams,
} from "./types";
import { HojeScreen } from "../screens/HojeScreen";
import { FocoScreen } from "../screens/FocoScreen";
import { PlanejamentoScreen } from "../screens/PlanejamentoScreen";
import { HabitosScreen } from "../screens/HabitosScreen";
import { MetasScreen } from "../screens/MetasScreen";
import { HistoricoScreen } from "../screens/HistoricoScreen";
import { EvolucaoScreen } from "../screens/EvolucaoScreen";
import { EstatisticasScreen } from "../screens/EstatisticasScreen";
import { ComunidadeScreen } from "../screens/ComunidadeScreen";
import { LigasScreen } from "../screens/LigasScreen";
import { GuerraClassesScreen } from "../screens/GuerraClassesScreen";
import { PerfilScreen } from "../screens/PerfilScreen";
import { LojaScreen } from "../screens/LojaScreen";

// Header padrão dark — telas principais escondem (têm seu próprio título);
// telas de detalhe mostram com botão voltar nativo.
const headerBase = {
  headerStyle: { backgroundColor: cores.void },
  headerTintColor: cores.snow,
  headerTitleStyle: { ...(tipo.h3 as object), color: cores.snow },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: cores.void },
} as const;

const Hoje = createNativeStackNavigator<HojeStackParams>();
export function HojeStack() {
  return (
    <Hoje.Navigator screenOptions={headerBase}>
      <Hoje.Screen name="HojeHome" component={HojeScreen} options={{ headerShown: false }} />
      <Hoje.Screen name="Foco" component={FocoScreen} options={{ title: "Foco" }} />
      <Hoje.Screen name="Planejamento" component={PlanejamentoScreen} options={{ title: "Planejar" }} />
      <Hoje.Screen name="Habitos" component={HabitosScreen} options={{ title: "Hábitos" }} />
      <Hoje.Screen name="Metas" component={MetasScreen} options={{ title: "Metas" }} />
      <Hoje.Screen name="Historico" component={HistoricoScreen} options={{ title: "Histórico" }} />
    </Hoje.Navigator>
  );
}

const Evo = createNativeStackNavigator<EvolucaoStackParams>();
export function EvolucaoStack() {
  return (
    <Evo.Navigator screenOptions={headerBase}>
      <Evo.Screen name="EvolucaoHome" component={EvolucaoScreen} options={{ headerShown: false }} />
      <Evo.Screen name="Estatisticas" component={EstatisticasScreen} options={{ title: "Estatísticas" }} />
    </Evo.Navigator>
  );
}

const Com = createNativeStackNavigator<ComunidadeStackParams>();
export function ComunidadeStack() {
  return (
    <Com.Navigator screenOptions={headerBase}>
      <Com.Screen name="ComunidadeHome" component={ComunidadeScreen} options={{ headerShown: false }} />
      <Com.Screen name="Ligas" component={LigasScreen} options={{ title: "Ligas" }} />
      <Com.Screen name="GuerraClasses" component={GuerraClassesScreen} options={{ title: "Guerra de Classes" }} />
    </Com.Navigator>
  );
}

const Perf = createNativeStackNavigator<PerfilStackParams>();
export function PerfilStack() {
  return (
    <Perf.Navigator screenOptions={headerBase}>
      <Perf.Screen name="PerfilHome" component={PerfilScreen} options={{ headerShown: false }} />
      <Perf.Screen name="Loja" component={LojaScreen} options={{ title: "Loja" }} />
    </Perf.Navigator>
  );
}
