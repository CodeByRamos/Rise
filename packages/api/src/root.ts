import { router } from "./trpc";
import { actionRouter } from "./routers/action";
import { progressRouter } from "./routers/progress";
import { missionRouter } from "./routers/mission";
import { coachRouter } from "./routers/coach";

/** Router raiz do Rise. Consumido type-safe por apps/web e apps/mobile. */
export const appRouter = router({
  action: actionRouter,
  progress: progressRouter,
  mission: missionRouter,
  coach: coachRouter,
});

export type AppRouter = typeof appRouter;
