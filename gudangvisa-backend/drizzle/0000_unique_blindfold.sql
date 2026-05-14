CREATE TYPE "public"."doc_status" AS ENUM('RECEIVED', 'IN_REVIEW', 'IN_PROCESS', 'APPROVED', 'REJECTED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."doc_type" AS ENUM('VISA', 'KITAS', 'PASSPORT');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('STAFF', 'ADMIN');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"passport_number" varchar(100),
	"contact_number" varchar(50),
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"doc_name" varchar(255) NOT NULL,
	"doc_type" "doc_type" NOT NULL,
	"status" "doc_status" DEFAULT 'RECEIVED' NOT NULL,
	"file_url" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracking_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"status_name" "doc_status" NOT NULL,
	"description_public" text NOT NULL,
	"description_internal" text,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracking_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracking_code" varchar(50) NOT NULL,
	"client_id" uuid NOT NULL,
	"service_type" varchar(100) NOT NULL,
	"current_status" "doc_status" DEFAULT 'RECEIVED' NOT NULL,
	"handled_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tracking_tickets_tracking_code_unique" UNIQUE("tracking_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'STAFF' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_ticket_id_tracking_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tracking_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_histories" ADD CONSTRAINT "tracking_histories_ticket_id_tracking_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tracking_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_histories" ADD CONSTRAINT "tracking_histories_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_tickets" ADD CONSTRAINT "tracking_tickets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_tickets" ADD CONSTRAINT "tracking_tickets_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tracking_code_idx" ON "tracking_tickets" USING btree ("tracking_code");