// Source of truth for the database schema.
// Edit this file to add or modify tables.
// Changes are auto-applied to the database when merged to main.

import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionStatus: text("subscription_status").notNull().default("inactive"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  hotkeys: jsonb("hotkeys").$type<Record<string, string>>().default({}),
  presets: jsonb("presets").$type<Array<{ name: string; speed: number }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
