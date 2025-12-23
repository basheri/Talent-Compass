import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// System Prompts table - stores the AI prompts that can be edited by admin
export const systemPrompts = pgTable("system_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  language: varchar("language", { length: 10 }).notNull(), // 'ar' or 'en'
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by"), // user id who last updated
});

export const insertSystemPromptSchema = createInsertSchema(systemPrompts).omit({
  id: true,
  updatedAt: true,
});
export type InsertSystemPrompt = z.infer<typeof insertSystemPromptSchema>;
export type SystemPrompt = typeof systemPrompts.$inferSelect;

// Chat Sessions table - tracks anonymous user sessions
export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey(), // UUID from localStorage
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
}, (table) => [
  index("idx_chat_sessions_last_active").on(table.lastActiveAt),
]);

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  createdAt: true,
  lastActiveAt: true,
});
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

// Chat Messages table - logs all messages for analytics
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text("content"), // message content for archive
  stage: varchar("stage", { length: 30 }), // journey stage (outcome, purpose, reality, options, decision, commitment)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_chat_messages_session").on(table.sessionId),
  index("idx_chat_messages_created").on(table.createdAt),
]);

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Message Feedback table - stores thumbs up/down on individual AI messages
export const messageFeedback = pgTable("message_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  messageId: varchar("message_id").notNull(), // client-side message ID
  rating: varchar("rating", { length: 10 }).notNull(), // 'up' or 'down'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_message_feedback_session").on(table.sessionId),
]);

export const insertMessageFeedbackSchema = createInsertSchema(messageFeedback).omit({
  id: true,
  createdAt: true,
});
export type InsertMessageFeedback = z.infer<typeof insertMessageFeedbackSchema>;
export type MessageFeedback = typeof messageFeedback.$inferSelect;

// Session Feedback table - stores overall feedback after report completion
export const sessionFeedback = pgTable("session_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"), // optional free-form feedback
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_session_feedback_session").on(table.sessionId),
]);

export const insertSessionFeedbackSchema = createInsertSchema(sessionFeedback).omit({
  id: true,
  createdAt: true,
});
export type InsertSessionFeedback = z.infer<typeof insertSessionFeedbackSchema>;
export type SessionFeedback = typeof sessionFeedback.$inferSelect;

// Verified Resources table - curated educational resources and communities
export const verifiedResources = pgTable("verified_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 20 }).notNull(), // 'course' or 'community'
  name: text("name").notNull(), // Resource name
  nameAr: text("name_ar"), // Arabic name
  platform: varchar("platform", { length: 100 }).notNull(), // Coursera, LinkedIn, etc.
  field: varchar("field", { length: 100 }).notNull(), // tech, marketing, management, etc.
  fieldAr: varchar("field_ar", { length: 100 }), // Arabic field name
  level: varchar("level", { length: 20 }), // beginner, intermediate, advanced
  language: varchar("language", { length: 20 }), // ar, en, both
  cost: varchar("cost", { length: 20 }), // free, paid
  hasCertificate: varchar("has_certificate", { length: 10 }), // yes, no
  description: text("description"), // Brief description
  descriptionAr: text("description_ar"), // Arabic description
  isActive: varchar("is_active", { length: 10 }).default("yes"), // yes, no
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_verified_resources_type").on(table.type),
  index("idx_verified_resources_field").on(table.field),
  index("idx_verified_resources_active").on(table.isActive),
]);

export const insertVerifiedResourceSchema = createInsertSchema(verifiedResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVerifiedResource = z.infer<typeof insertVerifiedResourceSchema>;
export type VerifiedResource = typeof verifiedResources.$inferSelect;
