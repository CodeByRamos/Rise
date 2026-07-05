ALTER TABLE "streaks" ADD COLUMN "pending_repair_value" integer;--> statement-breakpoint
ALTER TABLE "streaks" ADD COLUMN "repair_deadline" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "streaks" ADD COLUMN "last_repair_at" timestamp with time zone;