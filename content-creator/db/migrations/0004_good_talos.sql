ALTER TABLE `brand_profile` ADD `caption_max_chars` integer DEFAULT 300 NOT NULL;--> statement-breakpoint
ALTER TABLE `brand_profile` ADD `cta_text` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `brand_profile` ADD `cta_url` text DEFAULT '' NOT NULL;