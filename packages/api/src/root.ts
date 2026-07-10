import { router } from "./trpc";
import { actionRouter } from "./routers/action";
import { progressRouter } from "./routers/progress";
import { missionRouter } from "./routers/mission";
import { coachRouter } from "./routers/coach";
import { profileRouter } from "./routers/profile";
import { shopRouter } from "./routers/shop";
import { feedRouter } from "./routers/feed";
import { areaRouter } from "./routers/area";
import { socialRouter } from "./routers/social";
import { leagueRouter } from "./routers/league";
import { classWarRouter } from "./routers/class-war";
import { seasonRouter } from "./routers/season";
import { notificationRouter } from "./routers/notification";

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
  social: socialRouter,
  league: leagueRouter,
  classWar: classWarRouter,
  season: seasonRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
