CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'marriage_certificate';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'insurance_certificate';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'rptka';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'notifikasi';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'vitas_telex';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'dkptka_payment';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'domicile_certificate';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'diploma_certificate';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'cv_resume';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'kitas_card';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'other';--> statement-breakpoint
ALTER TABLE "application_documents" ADD COLUMN "issued_date" date;--> statement-breakpoint
ALTER TABLE "application_documents" ADD COLUMN "expiry_date" date;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "priority" "priority" DEFAULT 'medium' NOT NULL;