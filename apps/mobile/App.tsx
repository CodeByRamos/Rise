import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./src/lib/supabase";
import { trpc, criarTrpcClient } from "./src/lib/trpc";
import { Login } from "./src/screens/Login";
import { Home } from "./src/screens/Home";

/**
 * Raiz do app mobile (Sprint 6): providers tRPC/React Query + gate de auth.
 * Sessão persiste em AsyncStorage; onAuthStateChange troca Login ⇄ Home.
 */
export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => criarTrpcClient());
  const [session, setSession] = useState<Session | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setPronto(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        {pronto && (session ? <Home /> : <Login />)}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
