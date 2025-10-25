CREATE TABLE `menuPlanEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menuPlanId` int NOT NULL,
	`date` timestamp NOT NULL,
	`mealType` enum('fruehstueck','mittagessen','abendessen','snack') NOT NULL,
	`recipeId` int NOT NULL,
	`portions` int NOT NULL DEFAULT 4,
	`notes` text,
	CONSTRAINT `menuPlanEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menuPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menuPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recipeIngredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipeId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`quantity` varchar(100) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`pricePerUnit` int DEFAULT 0,
	`notes` text,
	CONSTRAINT `recipeIngredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('hauptgericht','beilage','dessert','vorspeise','getraenk','sonstiges') NOT NULL DEFAULT 'hauptgericht',
	`defaultPortions` int NOT NULL DEFAULT 4,
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recipes_id` PRIMARY KEY(`id`)
);
