DROP TABLE "notifications" CASCADE;--> statement-breakpoint
ALTER TABLE "client_accounts" DROP COLUMN "password_hash";--> statement-breakpoint
ALTER TABLE "tracking_history" DROP COLUMN "is_visible_to_client";