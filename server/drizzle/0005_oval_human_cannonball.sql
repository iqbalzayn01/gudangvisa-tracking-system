ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
ALTER TABLE "tracking_history" ALTER COLUMN "from_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tracking_history" ALTER COLUMN "to_status" SET DATA TYPE text;--> statement-breakpoint
UPDATE "applications" SET "status" = CASE "status"
  WHEN 'document_collection' THEN 'draft'
  WHEN 'document_revision' THEN 'document_verification'
  WHEN 'submission_to_immigration' THEN 'immigration_processing'
  WHEN 'immigration_review' THEN 'immigration_processing'
  WHEN 'biometric_scheduled' THEN 'immigration_processing'
  WHEN 'biometric_completed' THEN 'immigration_processing'
  WHEN 'approved' THEN 'completed'
  WHEN 'evisa_issued' THEN 'completed'
  WHEN 'rejected' THEN 'cancelled'
  WHEN 'on_hold' THEN 'cancelled'
  ELSE "status"
END;--> statement-breakpoint
UPDATE "tracking_history" SET "from_status" = CASE "from_status"
  WHEN 'document_collection' THEN 'draft'
  WHEN 'document_revision' THEN 'document_verification'
  WHEN 'submission_to_immigration' THEN 'immigration_processing'
  WHEN 'immigration_review' THEN 'immigration_processing'
  WHEN 'biometric_scheduled' THEN 'immigration_processing'
  WHEN 'biometric_completed' THEN 'immigration_processing'
  WHEN 'approved' THEN 'completed'
  WHEN 'evisa_issued' THEN 'completed'
  WHEN 'rejected' THEN 'cancelled'
  WHEN 'on_hold' THEN 'cancelled'
  ELSE "from_status"
END
WHERE "from_status" IS NOT NULL;--> statement-breakpoint
UPDATE "tracking_history" SET "to_status" = CASE "to_status"
  WHEN 'document_collection' THEN 'draft'
  WHEN 'document_revision' THEN 'document_verification'
  WHEN 'submission_to_immigration' THEN 'immigration_processing'
  WHEN 'immigration_review' THEN 'immigration_processing'
  WHEN 'biometric_scheduled' THEN 'immigration_processing'
  WHEN 'biometric_completed' THEN 'immigration_processing'
  WHEN 'approved' THEN 'completed'
  WHEN 'evisa_issued' THEN 'completed'
  WHEN 'rejected' THEN 'cancelled'
  WHEN 'on_hold' THEN 'cancelled'
  ELSE "to_status"
END;--> statement-breakpoint
DROP TYPE "public"."application_status";--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('draft', 'document_verification', 'immigration_processing', 'approval_pending', 'completed', 'cancelled');--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."application_status";--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DATA TYPE "public"."application_status" USING "status"::"public"."application_status";--> statement-breakpoint
ALTER TABLE "tracking_history" ALTER COLUMN "from_status" SET DATA TYPE "public"."application_status" USING "from_status"::"public"."application_status";--> statement-breakpoint
ALTER TABLE "tracking_history" ALTER COLUMN "to_status" SET DATA TYPE "public"."application_status" USING "to_status"::"public"."application_status";