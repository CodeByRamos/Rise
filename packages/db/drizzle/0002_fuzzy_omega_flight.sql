CREATE TYPE "public"."mission_status" AS ENUM('pending', 'completed');--> statement-breakpoint
CREATE TABLE "user_missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"template_id" text NOT NULL,
	"title" text NOT NULL,
	"metric" text NOT NULL,
	"target" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"xp_reward" integer NOT NULL,
	"sparks_reward" integer NOT NULL,
	"status" "mission_status" DEFAULT 'pending' NOT NULL,
	"assigned_date" date NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_missions" ADD CONSTRAINT "user_missions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_missions_day_uq" ON "user_missions" USING btree ("user_id","template_id","assigned_date");--> statement-breakpoint
CREATE INDEX "user_missions_user_day_idx" ON "user_missions" USING btree ("user_id","assigned_date","status");