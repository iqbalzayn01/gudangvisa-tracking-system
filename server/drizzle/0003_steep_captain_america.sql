DROP INDEX "applications_reference_number_idx";--> statement-breakpoint
CREATE INDEX "application_documents_application_id_idx" ON "application_documents" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_documents_expiry_date_idx" ON "application_documents" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_action_entity_type_idx" ON "audit_logs" USING btree ("action","entity_type");--> statement-breakpoint
CREATE INDEX "notifications_client_id_idx" ON "notifications" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "notifications_application_id_idx" ON "notifications" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "tracking_history_application_id_idx" ON "tracking_history" USING btree ("application_id");