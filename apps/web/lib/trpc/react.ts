import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@rise/api";

/**
 * Client tRPC tipado para React. `AppRouter` é importado SÓ como tipo — nada do
 * servidor (@rise/db, postgres) entra no bundle do cliente.
 */
export const trpc = createTRPCReact<AppRouter>();
