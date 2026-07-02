import { router } from "./trpc";
import { actionRouter } from "./routers/action";
import { progressRouter } from "./routers/progress";
import { missionRouter } from "./routers/mission";

/** Router raiz do Rise. Consumido type-safe por apps/web e apps/mobile. */
export const appRouter = router({
  action: actionRouter,
  progress: progressRouter,
  mission: missionRouter,
});

export type AppRouter = typeof appRouter;
