CREATE TABLE "season_claims" (
	"user_id" uuid NOT NULL,
	"season_key" text NOT NULL,
	"milestone_xp" integer NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "season_claims_user_id_season_key_milestone_xp_pk" PRIMARY KEY("user_id","season_key","milestone_xp")
);
--> statement-breakpoint
ALTER TABLE "season_claims" ADD CONSTRAINT "season_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;