import { pgEnum } from "drizzle-orm/pg-core";

/** Enums canônicos do domínio (docs/08-banco-de-dados.md). */

export const planTier = pgEnum("plan_tier", ["free", "plus", "founder", "team"]);
export const userStatus = pgEnum("user_status", [
  "active",
  "suspended",
  "deleted",
]);
export const goalStatus = pgEnum("goal_status", [
  "active",
  "completed",
  "abandoned",
]);
export const taskStatus = pgEnum("task_status", ["pending", "done", "skipped"]);
export const actionStatus = pgEnum("action_status", [
  "pending",
  "validated",
  "flagged",
  "reversed",
]);
export const levelScope = pgEnum("level_scope", ["area", "rise"]);
export const streakState = pgEnum("streak_state", [
  "active",
  "frozen",
  "broken",
  "resting",
]);
export const missionStatus = pgEnum("mission_status", [
  "pending",
  "completed",
]);
