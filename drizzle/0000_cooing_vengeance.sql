CREATE TYPE "public"."event_status" AS ENUM('confirmed', 'tentative', 'cancelled');--> statement-breakpoint
CREATE TABLE "event_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"source" text NOT NULL,
	"source_url" text,
	"source_uid" text,
	"raw" jsonb,
	"scraped_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dedupe_key" text NOT NULL,
	"title" text NOT NULL,
	"normalized_title" text NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"timezone" text DEFAULT 'Europe/Madrid' NOT NULL,
	"all_day" text,
	"venue_name" text,
	"address" text,
	"city" text DEFAULT 'Burgos' NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"category" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"url" text,
	"image_url" text,
	"price" text,
	"status" "event_status" DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_sources" ADD CONSTRAINT "event_sources_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_sources_source_uid_idx" ON "event_sources" USING btree ("source","source_uid");--> statement-breakpoint
CREATE INDEX "event_sources_event_id_idx" ON "event_sources" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "events_dedupe_key_idx" ON "events" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "events_normalized_title_idx" ON "events" USING btree ("normalized_title");