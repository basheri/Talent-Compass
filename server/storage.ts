import { 
  systemPrompts, chatSessions, chatMessages,
  type SystemPrompt, type InsertSystemPrompt,
  type ChatSession, type InsertChatSession,
  type ChatMessage, type InsertChatMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, gte, count } from "drizzle-orm";

export interface IStorage {
  // System Prompts
  getSystemPrompt(language: string): Promise<SystemPrompt | undefined>;
  upsertSystemPrompt(prompt: InsertSystemPrompt & { language: string }): Promise<SystemPrompt>;
  
  // Chat Sessions
  getOrCreateSession(sessionId: string): Promise<ChatSession>;
  updateSessionActivity(sessionId: string): Promise<void>;
  
  // Chat Messages
  logMessage(sessionId: string, role: string): Promise<ChatMessage>;
  
  // Analytics
  getUniqueUsersCount(): Promise<number>;
  getTotalMessagesCount(): Promise<number>;
  getActiveUsers24h(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // System Prompts
  async getSystemPrompt(language: string): Promise<SystemPrompt | undefined> {
    const [prompt] = await db.select().from(systemPrompts).where(eq(systemPrompts.language, language));
    return prompt || undefined;
  }

  async upsertSystemPrompt(prompt: InsertSystemPrompt & { language: string }): Promise<SystemPrompt> {
    const existing = await this.getSystemPrompt(prompt.language);
    if (existing) {
      const [updated] = await db
        .update(systemPrompts)
        .set({ content: prompt.content, updatedAt: new Date(), updatedBy: prompt.updatedBy })
        .where(eq(systemPrompts.language, prompt.language))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(systemPrompts)
        .values(prompt)
        .returning();
      return created;
    }
  }

  // Chat Sessions
  async getOrCreateSession(sessionId: string): Promise<ChatSession> {
    const [existing] = await db.select().from(chatSessions).where(eq(chatSessions.id, sessionId));
    if (existing) {
      return existing;
    }
    const [created] = await db
      .insert(chatSessions)
      .values({ id: sessionId })
      .returning();
    return created;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    await db
      .update(chatSessions)
      .set({ lastActiveAt: new Date() })
      .where(eq(chatSessions.id, sessionId));
  }

  // Chat Messages
  async logMessage(sessionId: string, role: string): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values({ sessionId, role })
      .returning();
    return message;
  }

  // Analytics
  async getUniqueUsersCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(chatSessions);
    return result[0]?.count || 0;
  }

  async getTotalMessagesCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(chatMessages);
    return result[0]?.count || 0;
  }

  async getActiveUsers24h(): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await db
      .select({ count: count() })
      .from(chatSessions)
      .where(gte(chatSessions.lastActiveAt, oneDayAgo));
    return result[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();
