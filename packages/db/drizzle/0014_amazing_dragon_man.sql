CREATE TABLE "coach_analyses" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text DEFAULT 'weekly_deep' NOT NULL,
	"model" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"facts" jsonb NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coach_analyses" ADD CONSTRAINT "coach_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coach_analyses_user_period_uq" ON "coach_analyses" USING btree ("user_id","kind","period_start");--> statement-breakpoint
CREATE INDEX "coach_analyses_user_idx" ON "coach_analyses" USING btree ("user_id","created_at");