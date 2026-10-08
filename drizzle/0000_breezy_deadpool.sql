CREATE TABLE `claims` (
	`id` text PRIMARY KEY NOT NULL,
	`gift` text NOT NULL,
	`session` text NOT NULL,
	`name` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text NOT NULL,
	`expires` integer NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`gift`) REFERENCES `gifts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_claims_gift` ON `claims` (`gift`);--> statement-breakpoint
CREATE INDEX `idx_claims_session` ON `claims` (`session`);--> statement-breakpoint
CREATE TABLE `gifts` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`price` integer NOT NULL,
	`outside` integer DEFAULT 0 NOT NULL,
	`group_gift` integer DEFAULT 0 NOT NULL,
	`ready` integer DEFAULT 0 NOT NULL,
	`year` integer,
	`url` text DEFAULT '' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`instructions` text DEFAULT '' NOT NULL
);
