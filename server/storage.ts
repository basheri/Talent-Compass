import {
  systemPrompts, chatSessions, chatMessages, messageFeedback, sessionFeedback, verifiedResources,
  type SystemPrompt, type InsertSystemPrompt,
  type ChatSession, type InsertChatSession,
  type ChatMessage, type InsertChatMessage,
  type MessageFeedback, type InsertMessageFeedback,
  type SessionFeedback, type InsertSessionFeedback,
  type VerifiedResource, type InsertVerifiedResource
} from "@shared/schema";
import { db, executeWithRetry } from "./db";
import { eq, sql, gte, count, and } from "drizzle-orm";

export interface IStorage {
  // System Prompts
  getSystemPrompt(language: string): Promise<SystemPrompt | undefined>;
  upsertSystemPrompt(prompt: InsertSystemPrompt & { language: string }): Promise<SystemPrompt>;

  // Chat Sessions
  getOrCreateSession(sessionId: string): Promise<ChatSession>;
  updateSessionActivity(sessionId: string): Promise<void>;
  getAllSessions(limit?: number, offset?: number): Promise<ChatSession[]>;
  getSessionsCount(): Promise<number>;

  // Chat Messages
  logMessage(sessionId: string, role: string, content?: string, stage?: string): Promise<ChatMessage>;
  getSessionMessages(sessionId: string): Promise<ChatMessage[]>;

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
  getBehaviorStats(): Promise<{ 
    avgMessagesPerSession: number; 
    completionRate: number; 
    stageDropoffs: Record<string, number>;
    messagesByDay: { date: string; count: number }[];
  }>;

  // Verified Resources
  getVerifiedResources(filters?: { type?: string; field?: string; isActive?: string }): Promise<VerifiedResource[]>;
  getVerifiedResourceById(id: string): Promise<VerifiedResource | undefined>;
  createVerifiedResource(data: InsertVerifiedResource): Promise<VerifiedResource>;
  updateVerifiedResource(id: string, data: Partial<InsertVerifiedResource>): Promise<VerifiedResource | undefined>;
  deleteVerifiedResource(id: string): Promise<void>;
  getResourcesByField(field: string, type?: string): Promise<VerifiedResource[]>;
}

export class DatabaseStorage implements IStorage {
  // System Prompts
  async getSystemPrompt(language: string): Promise<SystemPrompt | undefined> {
    return executeWithRetry(async () => {
      const [prompt] = await db!.select().from(systemPrompts).where(eq(systemPrompts.language, language));
      return prompt || undefined;
    }, 'getSystemPrompt');
  }

  async upsertSystemPrompt(prompt: InsertSystemPrompt & { language: string }): Promise<SystemPrompt> {
    return executeWithRetry(async () => {
      const existing = await this.getSystemPrompt(prompt.language);
      if (existing) {
        const [updated] = await db!
          .update(systemPrompts)
          .set({ content: prompt.content, updatedAt: new Date(), updatedBy: prompt.updatedBy })
          .where(eq(systemPrompts.language, prompt.language))
          .returning();
        return updated;
      } else {
        const [created] = await db!
          .insert(systemPrompts)
          .values(prompt)
          .returning();
        return created;
      }
    }, 'upsertSystemPrompt');
  }

  // Chat Sessions
  async getOrCreateSession(sessionId: string): Promise<ChatSession> {
    return executeWithRetry(async () => {
      const [existing] = await db!.select().from(chatSessions).where(eq(chatSessions.id, sessionId));
      if (existing) {
        return existing;
      }
      const [created] = await db!
        .insert(chatSessions)
        .values({ id: sessionId })
        .returning();
      return created;
    }, 'getOrCreateSession');
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    return executeWithRetry(async () => {
      await db!
        .update(chatSessions)
        .set({ lastActiveAt: new Date() })
        .where(eq(chatSessions.id, sessionId));
    }, 'updateSessionActivity');
  }

  async getAllSessions(limit = 50, offset = 0): Promise<ChatSession[]> {
    return executeWithRetry(async () => {
      return db!
        .select()
        .from(chatSessions)
        .orderBy(sql`${chatSessions.lastActiveAt} DESC`)
        .limit(limit)
        .offset(offset);
    }, 'getAllSessions');
  }

  async getSessionsCount(): Promise<number> {
    return executeWithRetry(async () => {
      const result = await db!.select({ count: count() }).from(chatSessions);
      return result[0]?.count || 0;
    }, 'getSessionsCount');
  }

  // Chat Messages
  async logMessage(sessionId: string, role: string, content?: string, stage?: string): Promise<ChatMessage> {
    return executeWithRetry(async () => {
      const [message] = await db!
        .insert(chatMessages)
        .values({ sessionId, role, content: content || null, stage: stage || null })
        .returning();
      return message;
    }, 'logMessage');
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    return executeWithRetry(async () => {
      return db!
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId))
        .orderBy(chatMessages.createdAt);
    }, 'getSessionMessages');
  }

  // Analytics
  async getUniqueUsersCount(): Promise<number> {
    return executeWithRetry(async () => {
      const result = await db!.select({ count: count() }).from(chatSessions);
      return result[0]?.count || 0;
    }, 'getUniqueUsersCount');
  }

  async getTotalMessagesCount(): Promise<number> {
    return executeWithRetry(async () => {
      const result = await db!.select({ count: count() }).from(chatMessages);
      return result[0]?.count || 0;
    }, 'getTotalMessagesCount');
  }

  async getActiveUsers24h(): Promise<number> {
    return executeWithRetry(async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await db!
        .select({ count: count() })
        .from(chatSessions)
        .where(gte(chatSessions.lastActiveAt, oneDayAgo));
      return result[0]?.count || 0;
    }, 'getActiveUsers24h');
  }

  // Message Feedback
  async saveMessageFeedback(data: InsertMessageFeedback): Promise<MessageFeedback> {
    return executeWithRetry(async () => {
      // Upsert: update if exists, insert if not
      const existing = await this.getMessageFeedback(data.sessionId, data.messageId);
      if (existing) {
        const [updated] = await db!
          .update(messageFeedback)
          .set({ rating: data.rating })
          .where(and(
            eq(messageFeedback.sessionId, data.sessionId),
            eq(messageFeedback.messageId, data.messageId)
          ))
          .returning();
        return updated;
      }
      const [created] = await db!
        .insert(messageFeedback)
        .values(data)
        .returning();
      return created;
    }, 'saveMessageFeedback');
  }

  async getMessageFeedback(sessionId: string, messageId: string): Promise<MessageFeedback | undefined> {
    return executeWithRetry(async () => {
      const [feedback] = await db!
        .select()
        .from(messageFeedback)
        .where(and(
          eq(messageFeedback.sessionId, sessionId),
          eq(messageFeedback.messageId, messageId)
        ));
      return feedback || undefined;
    }, 'getMessageFeedback');
  }

  async getSessionMessageFeedback(sessionId: string): Promise<MessageFeedback[]> {
    return executeWithRetry(async () => {
      return db!
        .select()
        .from(messageFeedback)
        .where(eq(messageFeedback.sessionId, sessionId));
    }, 'getSessionMessageFeedback');
  }

  async deleteMessageFeedback(sessionId: string, messageId: string): Promise<void> {
    return executeWithRetry(async () => {
      await db!
        .delete(messageFeedback)
        .where(and(
          eq(messageFeedback.sessionId, sessionId),
          eq(messageFeedback.messageId, messageId)
        ));
    }, 'deleteMessageFeedback');
  }

  // Session Feedback
  async saveSessionFeedback(data: InsertSessionFeedback): Promise<SessionFeedback> {
    return executeWithRetry(async () => {
      // Upsert: update if exists, insert if not
      const existing = await this.getSessionFeedback(data.sessionId);
      if (existing) {
        const [updated] = await db!
          .update(sessionFeedback)
          .set({ rating: data.rating, comment: data.comment })
          .where(eq(sessionFeedback.sessionId, data.sessionId))
          .returning();
        return updated;
      }
      const [created] = await db!
        .insert(sessionFeedback)
        .values(data)
        .returning();
      return created;
    }, 'saveSessionFeedback');
  }

  async getSessionFeedback(sessionId: string): Promise<SessionFeedback | undefined> {
    return executeWithRetry(async () => {
      const [feedback] = await db!
        .select()
        .from(sessionFeedback)
        .where(eq(sessionFeedback.sessionId, sessionId));
      return feedback || undefined;
    }, 'getSessionFeedback');
  }

  // Feedback Analytics
  async getFeedbackStats(): Promise<{ thumbsUp: number; thumbsDown: number; avgRating: number; totalSessionFeedback: number }> {
    return executeWithRetry(async () => {
      const [thumbsUpResult] = await db!
        .select({ count: count() })
        .from(messageFeedback)
        .where(eq(messageFeedback.rating, 'up'));
      const [thumbsDownResult] = await db!
        .select({ count: count() })
        .from(messageFeedback)
        .where(eq(messageFeedback.rating, 'down'));
      const [sessionStats] = await db!
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
    }, 'getFeedbackStats');
  }

  // Behavior Analytics
  async getBehaviorStats(): Promise<{ 
    avgMessagesPerSession: number; 
    completionRate: number; 
    stageDropoffs: Record<string, number>;
    messagesByDay: { date: string; count: number }[];
  }> {
    return executeWithRetry(async () => {
      // Average messages per session
      const [msgStats] = await db!
        .select({
          totalMessages: count(),
          totalSessions: sql<number>`COUNT(DISTINCT ${chatMessages.sessionId})`
        })
        .from(chatMessages);
      
      const avgMessagesPerSession = msgStats?.totalSessions 
        ? (msgStats.totalMessages / Number(msgStats.totalSessions)) 
        : 0;

      // Completion rate (sessions that reached 'commitment' stage)
      const [completedCount] = await db!
        .select({ count: sql<number>`COUNT(DISTINCT ${chatMessages.sessionId})` })
        .from(chatMessages)
        .where(eq(chatMessages.stage, 'commitment'));
      
      const [totalSessionsCount] = await db!
        .select({ count: count() })
        .from(chatSessions);
      
      const completionRate = totalSessionsCount?.count 
        ? (Number(completedCount?.count || 0) / totalSessionsCount.count) * 100 
        : 0;

      // Stage dropoffs - count sessions at each stage (last stage they reached)
      const stageResults = await db!
        .select({
          stage: chatMessages.stage,
          count: sql<number>`COUNT(DISTINCT ${chatMessages.sessionId})`
        })
        .from(chatMessages)
        .where(sql`${chatMessages.stage} IS NOT NULL`)
        .groupBy(chatMessages.stage);
      
      const stageDropoffs: Record<string, number> = {};
      for (const row of stageResults) {
        if (row.stage) {
          stageDropoffs[row.stage] = Number(row.count);
        }
      }

      // Messages by day (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const dailyResults = await db!
        .select({
          date: sql<string>`DATE(${chatMessages.createdAt})`,
          count: count()
        })
        .from(chatMessages)
        .where(gte(chatMessages.createdAt, sevenDaysAgo))
        .groupBy(sql`DATE(${chatMessages.createdAt})`)
        .orderBy(sql`DATE(${chatMessages.createdAt})`);
      
      const messagesByDay = dailyResults.map(row => ({
        date: String(row.date),
        count: row.count
      }));

      return {
        avgMessagesPerSession: Math.round(avgMessagesPerSession * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        stageDropoffs,
        messagesByDay,
      };
    }, 'getBehaviorStats');
  }

  // Verified Resources
  async getVerifiedResources(filters?: { type?: string; field?: string; isActive?: string }): Promise<VerifiedResource[]> {
    return executeWithRetry(async () => {
      let query = db!.select().from(verifiedResources);
      
      if (filters?.isActive) {
        query = query.where(eq(verifiedResources.isActive, filters.isActive)) as typeof query;
      }
      if (filters?.type) {
        query = query.where(eq(verifiedResources.type, filters.type)) as typeof query;
      }
      if (filters?.field) {
        query = query.where(eq(verifiedResources.field, filters.field)) as typeof query;
      }
      
      return query;
    }, 'getVerifiedResources');
  }

  async getVerifiedResourceById(id: string): Promise<VerifiedResource | undefined> {
    return executeWithRetry(async () => {
      const [resource] = await db!.select().from(verifiedResources).where(eq(verifiedResources.id, id));
      return resource || undefined;
    }, 'getVerifiedResourceById');
  }

  async createVerifiedResource(data: InsertVerifiedResource): Promise<VerifiedResource> {
    return executeWithRetry(async () => {
      const [created] = await db!.insert(verifiedResources).values(data).returning();
      return created;
    }, 'createVerifiedResource');
  }

  async updateVerifiedResource(id: string, data: Partial<InsertVerifiedResource>): Promise<VerifiedResource | undefined> {
    return executeWithRetry(async () => {
      const [updated] = await db!
        .update(verifiedResources)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(verifiedResources.id, id))
        .returning();
      return updated || undefined;
    }, 'updateVerifiedResource');
  }

  async deleteVerifiedResource(id: string): Promise<void> {
    return executeWithRetry(async () => {
      await db!.delete(verifiedResources).where(eq(verifiedResources.id, id));
    }, 'deleteVerifiedResource');
  }

  async getResourcesByField(field: string, type?: string): Promise<VerifiedResource[]> {
    return executeWithRetry(async () => {
      const conditions = [
        eq(verifiedResources.field, field),
        eq(verifiedResources.isActive, 'yes')
      ];
      
      if (type) {
        conditions.push(eq(verifiedResources.type, type));
      }
      
      return db!
        .select()
        .from(verifiedResources)
        .where(and(...conditions));
    }, 'getResourcesByField');
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

  async getAllSessions(limit = 50, offset = 0): Promise<ChatSession[]> {
    const sessions = Array.from(this.chatSessions.values());
    sessions.sort((a, b) => (b.lastActiveAt?.getTime() || 0) - (a.lastActiveAt?.getTime() || 0));
    return sessions.slice(offset, offset + limit);
  }

  async getSessionsCount(): Promise<number> {
    return this.chatSessions.size;
  }

  async logMessage(sessionId: string, role: string, content?: string, stage?: string): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sessionId,
      role,
      content: content || null,
      stage: stage || null,
      createdAt: new Date(),
    };
    this.chatMessages.push(message);
    return message;
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.chatMessages
      .filter(m => m.sessionId === sessionId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
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

  // Behavior Analytics
  async getBehaviorStats(): Promise<{ 
    avgMessagesPerSession: number; 
    completionRate: number; 
    stageDropoffs: Record<string, number>;
    messagesByDay: { date: string; count: number }[];
  }> {
    const sessionCount = this.chatSessions.size;
    const avgMessagesPerSession = sessionCount > 0 
      ? this.chatMessages.length / sessionCount 
      : 0;

    // Count sessions with commitment stage
    const sessionsWithCommitment = new Set<string>();
    const stageDropoffs: Record<string, number> = {};
    
    for (const msg of this.chatMessages) {
      if (msg.stage) {
        stageDropoffs[msg.stage] = (stageDropoffs[msg.stage] || 0) + 1;
        if (msg.stage === 'commitment') {
          sessionsWithCommitment.add(msg.sessionId);
        }
      }
    }

    const completionRate = sessionCount > 0 
      ? (sessionsWithCommitment.size / sessionCount) * 100 
      : 0;

    // Messages by day (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dayMap = new Map<string, number>();
    
    for (const msg of this.chatMessages) {
      if (msg.createdAt && msg.createdAt >= sevenDaysAgo) {
        const date = msg.createdAt.toISOString().split('T')[0];
        dayMap.set(date, (dayMap.get(date) || 0) + 1);
      }
    }

    const messagesByDay = Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      avgMessagesPerSession: Math.round(avgMessagesPerSession * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      stageDropoffs,
      messagesByDay,
    };
  }

  // Verified Resources (stub implementation for MemStorage)
  private verifiedResourcesMap: Map<string, VerifiedResource> = new Map();

  async getVerifiedResources(filters?: { type?: string; field?: string; isActive?: string }): Promise<VerifiedResource[]> {
    let resources = Array.from(this.verifiedResourcesMap.values());
    if (filters?.isActive) {
      resources = resources.filter(r => r.isActive === filters.isActive);
    }
    if (filters?.type) {
      resources = resources.filter(r => r.type === filters.type);
    }
    if (filters?.field) {
      resources = resources.filter(r => r.field === filters.field);
    }
    return resources;
  }

  async getVerifiedResourceById(id: string): Promise<VerifiedResource | undefined> {
    return this.verifiedResourcesMap.get(id);
  }

  async createVerifiedResource(data: InsertVerifiedResource): Promise<VerifiedResource> {
    const id = Math.random().toString(36).substring(7);
    const resource: VerifiedResource = {
      id,
      type: data.type,
      name: data.name,
      nameAr: data.nameAr ?? null,
      platform: data.platform,
      field: data.field,
      fieldAr: data.fieldAr ?? null,
      level: data.level ?? null,
      language: data.language ?? null,
      cost: data.cost ?? null,
      hasCertificate: data.hasCertificate ?? null,
      description: data.description ?? null,
      descriptionAr: data.descriptionAr ?? null,
      isActive: data.isActive ?? 'yes',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.verifiedResourcesMap.set(id, resource);
    return resource;
  }

  async updateVerifiedResource(id: string, data: Partial<InsertVerifiedResource>): Promise<VerifiedResource | undefined> {
    const existing = this.verifiedResourcesMap.get(id);
    if (!existing) return undefined;
    
    const updated: VerifiedResource = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.verifiedResourcesMap.set(id, updated);
    return updated;
  }

  async deleteVerifiedResource(id: string): Promise<void> {
    this.verifiedResourcesMap.delete(id);
  }

  async getResourcesByField(field: string, type?: string): Promise<VerifiedResource[]> {
    let resources = Array.from(this.verifiedResourcesMap.values())
      .filter(r => r.field === field && r.isActive === 'yes');
    
    if (type) {
      resources = resources.filter(r => r.type === type);
    }
    
    return resources;
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
