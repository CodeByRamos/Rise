import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { cores, espaco } from "../theme";
import { HojeScreen } from "../screens/HojeScreen";
import { EvolucaoScreen } from "../screens/EvolucaoScreen";
import { ComunidadeScreen } from "../screens/ComunidadeScreen";
import { CoachScreen } from "../screens/CoachScreen";
import { PerfilScreen } from "../screens/PerfilScreen";

export type AppTabsParamList = {
  Hoje: undefined;
  Evolucao: undefined;
  Comunidade: undefined;
  Coach: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

// Ícone por aba (Feather = SVG de linha, coerente com o design system; sem emoji).
const ICONES: Record<keyof AppTabsParamList, keyof typeof Feather.glyphMap> = {
  Hoje: "zap",
  Evolucao: "trending-up",
  Comunidade: "users",
  Coach: "message-circle",
  Perfil: "user",
};

/**
 * Navegação primária mobile: Bottom Tabs — o padrão nativo alcançável com o
 * polegar. Colapsa os 15 destinos da web em 5 hubs (docs/18 §1.4). Cada aba
 * abre seu próprio stack para telas de detalhe (adicionadas por fase).
 */
export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: cores.brand,
        tabBarInactiveTintColor: cores.faint,
        tabBarStyle: {
          backgroundColor: cores.surface,
          borderTopColor: cores.line,
          borderTopWidth: 1,
          height: 62 + espaco.md,
          paddingTop: espaco.sm,
          paddingBottom: espaco.md,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => (
          <Feather name={ICONES[route.name]} size={size - 2} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Hoje" component={HojeScreen} />
      <Tab.Screen
        name="Evolucao"
        component={EvolucaoScreen}
        options={{ tabBarLabel: "Evolução" }}
      />
      <Tab.Screen name="Comunidade" component={ComunidadeScreen} />
      <Tab.Screen name="Coach" component={CoachScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}
