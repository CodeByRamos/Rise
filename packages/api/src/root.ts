import { router } from "./trpc";
import { actionRouter } from "./routers/action";
import { progressRouter } from "./routers/progress";
import { missionRouter } from "./routers/mission";
import { coachRouter } from "./routers/coach";
import { profileRouter } from "./routers/profile";
import { shopRouter } from "./routers/shop";
import { feedRouter } from "./routers/feed";
import { areaRouter } from "./routers/area";

/** Router raiz do Rise. Consumido type-safe por apps/web e apps/mobile. */
export const appRouter = router({
  action: actionRouter,
  progress: progressRouter,
  mission: missionRouter,
  coach: coachRouter,
  profile: profileRouter,
  shop: shopRouter,
  feed: feedRouter,
  area: areaRouter,
});

export type AppRouter = typeof appRouter;
