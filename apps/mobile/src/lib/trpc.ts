import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@rise/api";
import { supabase } from "./supabase";

/**
 * Client tRPC do mobile. `AppRouter` entra SÓ como tipo — nada do servidor
 * (@rise/db, postgres) vai para o bundle nativo. Auth via header
 * `Authorization: Bearer <access_token>` (o route handler web valida o JWT
 * no Supabase — mesmo caminho de verdade do site).
 */
export const trpc = createTRPCReact<AppRouter>();

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export function criarTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${API_URL}/api/trpc`,
        transformer: superjson,
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
