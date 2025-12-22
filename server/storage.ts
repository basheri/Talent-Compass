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

export class MemStorage implements IStorage {
  private systemPrompts: Map<string, SystemPrompt>;
  private chatSessions: Map<string, ChatSession>;
  private chatMessages: ChatMessage[];

  constructor() {
    this.systemPrompts = new Map();
    this.chatSessions = new Map();
    this.chatMessages = [];
  }

  async getSystemPrompt(language: string): Promise<SystemPrompt | undefined> {
    return this.systemPrompts.get(language);
  }

  async upsertSystemPrompt(prompt: InsertSystemPrompt & { language: string }): Promise<SystemPrompt> {
    const existing = this.systemPrompts.get(prompt.language);
    const newPrompt: SystemPrompt = {
      id: existing?.id ?? Math.random().toString(36).substring(7),
      language: prompt.language,
      content: prompt.content,
      updatedAt: new Date(),
      updatedBy: prompt.updatedBy ?? null,
    };
    this.systemPrompts.set(prompt.language, newPrompt);
    return newPrompt;
  }

  async getOrCreateSession(sessionId: string): Promise<ChatSession> {
    if (!this.chatSessions.has(sessionId)) {
      this.chatSessions.set(sessionId, {
        id: sessionId,
        createdAt: new Date(),
        lastActiveAt: new Date(),
      });
    }
    return this.chatSessions.get(sessionId)!;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    const session = this.chatSessions.get(sessionId);
    if (session) {
      session.lastActiveAt = new Date();
    }
  }

  async logMessage(sessionId: string, role: string): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sessionId,
      role,
      createdAt: new Date(),
    };
    this.chatMessages.push(message);
    return message;
  }

  async getUniqueUsersCount(): Promise<number> {
    return this.chatSessions.size;
  }

  async getTotalMessagesCount(): Promise<number> {
    return this.chatMessages.length;
  }

  async getActiveUsers24h(): Promise<number> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let count = 0;
    for (const session of this.chatSessions.values()) {
      if (session.lastActiveAt && session.lastActiveAt > cutoff) {
        count++;
      }
    }
    return count;
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
