CREATE TABLE `brand_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`style_prompt` text DEFAULT '' NOT NULL,
	`caption_persona` text DEFAULT '' NOT NULL,
	`ref_image_path` text,
	`image_model` text,
	`updated_at` integer NOT NULL
);
