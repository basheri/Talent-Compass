import {
  systemPrompts, chatSessions, chatMessages, messageFeedback, sessionFeedback,
  type SystemPrompt, type InsertSystemPrompt,
  type ChatSession, type InsertChatSession,
  type ChatMessage, type InsertChatMessage,
  type MessageFeedback, type InsertMessageFeedback,
  type SessionFeedback, type InsertSessionFeedback
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, gte, count, and } from "drizzle-orm";

export interface IStorage {
  // System Prompts
  getSystemPrompt(language: string): Promise<SystemPrompt | undefined>;
  upsertSystemPrompt(prompt: InsertSystemPrompt & { language: string }): Promise<SystemPrompt>;

  // Chat Sessions
  getOrCreateSession(sessionId: string): Promise<ChatSession>;
  updateSessionActivity(sessionId: string): Promise<void>;

  // Chat Messages
  logMessage(sessionId: string, role: string): Promise<ChatMessage>;

  // Message Feedback (thumbs up/down during chat)
  saveMessageFeedback(data: InsertMessageFeedback): Promise<MessageFeedback>;
  getMessageFeedback(sessionId: string, messageId: string): Promise<MessageFeedback | undefined>;
  getSessionMessageFeedback(sessionId: string): Promise<MessageFeedback[]>;
  deleteMessageFeedback(sessionId: string, messageId: string): Promise<void>;

  // Session Feedback (overall feedback after report)
  saveSessionFeedback(data: InsertSessionFeedback): Promise<SessionFeedback>;
  getSessionFeedback(sessionId: string): Promise<SessionFeedback | undefined>;

  // Analytics
  getUniqueUsersCount(): Promise<number>;
  getTotalMessagesCount(): Promise<number>;
  getActiveUsers24h(): Promise<number>;
  getFeedbackStats(): Promise<{ thumbsUp: number; thumbsDown: number; avgRating: number; totalSessionFeedback: number }>;
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

  // Message Feedback
  async saveMessageFeedback(data: InsertMessageFeedback): Promise<MessageFeedback> {
    // Upsert: update if exists, insert if not
    const existing = await this.getMessageFeedback(data.sessionId, data.messageId);
    if (existing) {
      const [updated] = await db
        .update(messageFeedback)
        .set({ rating: data.rating })
        .where(and(
          eq(messageFeedback.sessionId, data.sessionId),
          eq(messageFeedback.messageId, data.messageId)
        ))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(messageFeedback)
      .values(data)
      .returning();
    return created;
  }

  async getMessageFeedback(sessionId: string, messageId: string): Promise<MessageFeedback | undefined> {
    const [feedback] = await db
      .select()
      .from(messageFeedback)
      .where(and(
        eq(messageFeedback.sessionId, sessionId),
        eq(messageFeedback.messageId, messageId)
      ));
    return feedback || undefined;
  }

  async getSessionMessageFeedback(sessionId: string): Promise<MessageFeedback[]> {
    return db
      .select()
      .from(messageFeedback)
      .where(eq(messageFeedback.sessionId, sessionId));
  }

  async deleteMessageFeedback(sessionId: string, messageId: string): Promise<void> {
    await db
      .delete(messageFeedback)
      .where(and(
        eq(messageFeedback.sessionId, sessionId),
        eq(messageFeedback.messageId, messageId)
      ));
  }

  // Session Feedback
  async saveSessionFeedback(data: InsertSessionFeedback): Promise<SessionFeedback> {
    // Upsert: update if exists, insert if not
    const existing = await this.getSessionFeedback(data.sessionId);
    if (existing) {
      const [updated] = await db
        .update(sessionFeedback)
        .set({ rating: data.rating, comment: data.comment })
        .where(eq(sessionFeedback.sessionId, data.sessionId))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(sessionFeedback)
      .values(data)
      .returning();
    return created;
  }

  async getSessionFeedback(sessionId: string): Promise<SessionFeedback | undefined> {
    const [feedback] = await db
      .select()
      .from(sessionFeedback)
      .where(eq(sessionFeedback.sessionId, sessionId));
    return feedback || undefined;
  }

  // Feedback Analytics
  async getFeedbackStats(): Promise<{ thumbsUp: number; thumbsDown: number; avgRating: number; totalSessionFeedback: number }> {
    const [thumbsUpResult] = await db
      .select({ count: count() })
      .from(messageFeedback)
      .where(eq(messageFeedback.rating, 'up'));
    const [thumbsDownResult] = await db
      .select({ count: count() })
      .from(messageFeedback)
      .where(eq(messageFeedback.rating, 'down'));
    const [sessionStats] = await db
      .select({ 
        count: count(),
        avg: sql<number>`COALESCE(AVG(${sessionFeedback.rating}), 0)`
      })
      .from(sessionFeedback);

    return {
      thumbsUp: thumbsUpResult?.count || 0,
      thumbsDown: thumbsDownResult?.count || 0,
      avgRating: Number(sessionStats?.avg) || 0,
      totalSessionFeedback: sessionStats?.count || 0,
    };
  }
}

export class MemStorage implements IStorage {
  private systemPrompts: Map<string, SystemPrompt>;
  private chatSessions: Map<string, ChatSession>;
  private chatMessages: ChatMessage[];
  private messageFeedbackMap: Map<string, MessageFeedback>;
  private sessionFeedbackMap: Map<string, SessionFeedback>;

  constructor() {
    this.systemPrompts = new Map();
    this.chatSessions = new Map();
    this.chatMessages = [];
    this.messageFeedbackMap = new Map();
    this.sessionFeedbackMap = new Map();
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

  // Message Feedback
  async saveMessageFeedback(data: InsertMessageFeedback): Promise<MessageFeedback> {
    const key = `${data.sessionId}:${data.messageId}`;
    const feedback: MessageFeedback = {
      id: this.messageFeedbackMap.get(key)?.id ?? Math.random().toString(36).substring(7),
      sessionId: data.sessionId,
      messageId: data.messageId,
      rating: data.rating,
      createdAt: new Date(),
    };
    this.messageFeedbackMap.set(key, feedback);
    return feedback;
  }

  async getMessageFeedback(sessionId: string, messageId: string): Promise<MessageFeedback | undefined> {
    return this.messageFeedbackMap.get(`${sessionId}:${messageId}`);
  }

  async getSessionMessageFeedback(sessionId: string): Promise<MessageFeedback[]> {
    const result: MessageFeedback[] = [];
    for (const [key, feedback] of this.messageFeedbackMap.entries()) {
      if (key.startsWith(`${sessionId}:`)) {
        result.push(feedback);
      }
    }
    return result;
  }

  async deleteMessageFeedback(sessionId: string, messageId: string): Promise<void> {
    const key = `${sessionId}:${messageId}`;
    this.messageFeedbackMap.delete(key);
  }

  // Session Feedback
  async saveSessionFeedback(data: InsertSessionFeedback): Promise<SessionFeedback> {
    const feedback: SessionFeedback = {
      id: this.sessionFeedbackMap.get(data.sessionId)?.id ?? Math.random().toString(36).substring(7),
      sessionId: data.sessionId,
      rating: data.rating,
      comment: data.comment ?? null,
      createdAt: new Date(),
    };
    this.sessionFeedbackMap.set(data.sessionId, feedback);
    return feedback;
  }

  async getSessionFeedback(sessionId: string): Promise<SessionFeedback | undefined> {
    return this.sessionFeedbackMap.get(sessionId);
  }

  // Feedback Analytics
  async getFeedbackStats(): Promise<{ thumbsUp: number; thumbsDown: number; avgRating: number; totalSessionFeedback: number }> {
    let thumbsUp = 0;
    let thumbsDown = 0;
    for (const feedback of this.messageFeedbackMap.values()) {
      if (feedback.rating === 'up') thumbsUp++;
      else if (feedback.rating === 'down') thumbsDown++;
    }
    
    let totalRating = 0;
    let totalSessionFeedback = 0;
    for (const feedback of this.sessionFeedbackMap.values()) {
      totalRating += feedback.rating;
      totalSessionFeedback++;
    }

    return {
      thumbsUp,
      thumbsDown,
      avgRating: totalSessionFeedback > 0 ? totalRating / totalSessionFeedback : 0,
      totalSessionFeedback,
    };
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
