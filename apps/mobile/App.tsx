import "react-native-gesture-handler";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, criarTrpcClient } from "./src/lib/trpc";
import { RootNavigator } from "./src/navigation/RootNavigator";

/**
 * Raiz do app Rise mobile. Providers na ordem correta: gesture handler (raiz
 * nativa) → safe area → tRPC/React Query → navegação. A sessão e o gate de auth
 * vivem no RootNavigator.
 */
export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  const [trpcClient] = useState(() => criarTrpcClient());

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="light" />
            <RootNavigator />
          </QueryClientProvider>
        </trpc.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
