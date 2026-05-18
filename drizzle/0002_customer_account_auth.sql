ALTER TABLE "customers"
ADD COLUMN IF NOT EXISTS "password_hash" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"session_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "customer_sessions_token_unique" ON "customer_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_sessions_customer_idx" ON "customer_sessions" USING btree ("customer_id");
