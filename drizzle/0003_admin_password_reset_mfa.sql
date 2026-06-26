ALTER TABLE "admin_users"
ADD COLUMN IF NOT EXISTS "reset_token" text;
--> statement-breakpoint
ALTER TABLE "admin_users"
ADD COLUMN IF NOT EXISTS "reset_token_expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "admin_users"
ADD COLUMN IF NOT EXISTS "mfa_secret" text;
--> statement-breakpoint
ALTER TABLE "admin_users"
ADD COLUMN IF NOT EXISTS "mfa_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "admin_users"
ADD COLUMN IF NOT EXISTS "mfa_backup_codes" jsonb;
--> statement-breakpoint
ALTER TABLE "admin_sessions"
ADD COLUMN IF NOT EXISTS "mfa_verified" boolean DEFAULT false NOT NULL;
