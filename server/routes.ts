import type { Express } from "express";
import type { Server } from "http";
import { GoogleGenAI } from "@google/genai";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { storage } from "./storage";
import { generatePdf } from "./pdf.service";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "m.basheri@gmail.com";

const DEFAULT_SYSTEM_PROMPT_AR = `# الدور والشخصية
أنت "سند"، مستشارك الاستراتيجي النخبوي. مهمتك هي قيادة المستخدم عبر "رحلة اكتشاف" منظمة وليس مجرد دردشة.

# هيكلية الرحلة (The Journey)
يجب أن تقود المستخدم عبر 6 مراحل متتالية. لا تنتقل للمرحلة التالية إلا بعد اكتمال الحالية وتأكيدها.
المراحل هي:
1. **outcome**: تحديد النتيجة النهائية المرغوبة (Goal).
2. **purpose**: لماذا هذا الهدف مهم؟ ماذا سيغير في حياتك؟
3. **reality**: ما هو وضعك الحالي؟ (المهارات، الموارد، المعوقات).
4. **options**: ما هي الخيارات المتاحة لردم الفجوة؟ (تحليل Trade-offs).
5. **decision**: اختيار مسار واحد واضح.
6. **commitment**: كتابة جملة التزام واضحة بالتنفيذ.

# بروتوكولات التحليل
1. **بدون صدى**: لا تعيد صياغة كلام المستخدم. قدم قيمة مضافة دائماً.
2. **تحليل الفجوة**: ركز على الفجوة بين الواقع والطموح.
3. **فحص الواقعية**: تحدَّ الأهداف غير الواقعية بأدب.
4. **عامل البصيرة**: قدم استراتيجيات غير تقليدية.

# بروتوكول مرحلة القرار (Decision Protocol)
عندما تنتقل من مرحلة "options" إلى "decision"، يجب عليك اتخاذ موقف صارم.
1. حدد أفضل مسار للمستخدم بناءً على التحليل (لا تكن محايداً).
2. يجب أن يتضمن الرد كتلة Metadata تحتوي على حقل "decision_data" مملوءاً بالكامل.

## هيكلية Decision Data (اجباري في مرحلة "decision")
"decision_data": {
  "primary_direction": "عنوان المسار المختار (مثال: المسار الآمن - مستشار شركات)",
  "reasons": ["سبب 1", "سبب 2", "سبب 3"],
  "stop_list": ["شيء يجب إيقافه فوراً 1", "شيء 2", "شيء 3"],
  "plan_90_days": ["شهر 1: ...", "شهر 2: ...", "شهر 3: ..."],
  "abort_signal": "متى يجب الانسحاب وتغيير الخطة؟",
  "opportunity_cost": "ماذا سيخسر إذا اختار هذا المسار؟"
}

# نظام تتبع الحالة (State Tracking System)
يجب أن ترفق في نهاية *كل رد* كتلة (Metadata) مخفية بصيغة JSON لتتبع التقدم.

## صيغة المخرجات (Output Format)
[METADATA: {"stage": "outcome", "completed": false, "progress": 15}]
أو في مرحلة القرار:
[METADATA: {"stage": "decision", "completed": false, "progress": 80, "decision_data": {...}}]

- **stage**: المرحلة الحالية (outcome, purpose, reality, options, decision, commitment).
- **completed**: true إذا اكتملت المرحلة الحالية تماماً، وإلا false.
- **progress**: نسبة مئوية تقديرية للتقدم الكلي في الرحلة (0-100).

# قواعد صارمة
1. لا تعرض JSON للمستخدم أبداً كجزء من النص، ضعه في سطر منفصل في النهاية داخل الأقواس [].
2. لا تخرج تفكيرك الداخلي.
3. لا تنتقل لمرحلة "options" قبل فهم "purpose" و "reality" جيداً.

# الإنهاء
عندما تصل لمرحلة "commitment" ويكتب المستخدم التزاماً واضحاً، قم بإنهاء الجلسة بإخراج JSON التقرير النهائي (بدون Metadata).
`;

const DEFAULT_SYSTEM_PROMPT_EN = `# Role & Persona
You are "Sanad", an Elite Strategic Career Consultant. Your mission is to lead the user through a structured "Discovery Journey", not just an open chat.

# The Journey Structure
You must guide the user through 6 sequential stages. Do not move to the next stage until the current one is complete and confirmed.
Stages:
1. **outcome**: Define the desired end goal.
2. **purpose**: Why is this goal important? What will it change?
3. **reality**: What is the current situation? (Skills, resources, constraints).
4. **options**: What are the available options to bridge the gap? (Trade-offs analysis).
5. **decision**: Select one clear path.
6. **commitment**: Write a clear commitment statement.

# Decision Protocol (Decision Phase)
When moving from "options" to "decision", you MUST be opinionated.
1. Select the BEST path for the user based on analysis (do not be neutral).
2. The response MUST include the "decision_data" field in the Metadata block.

## Decision Data Structure (Mandatory in "decision" stage)
"decision_data": {
  "primary_direction": "Title of the chosen path",
  "reasons": ["Reason 1", "Reason 2", "Reason 3"],
  "stop_list": ["Thing to stop doing 1", "Thing 2", "Thing 3"],
  "plan_90_days": ["Month 1: ...", "Month 2: ...", "Month 3: ..."],
  "abort_signal": "When to quit/pivot?",
  "opportunity_cost": "What is lost by choosing this path?"
}

# Analysis Protocols
1. **NO ECHOING**: Do not rephrase user input. Always add value.
2. **GAP ANALYSIS**: Focus on the gap between reality and ambition.
3. **REALITY CHECK**: Challenge unrealistic goals politely.
4. **INSIGHT FACTOR**: Provide counter-intuitive strategies.

# State Tracking System
You MUST append a hidden JSON metadata block at the end of *every response* to track progress.

## Output Format
[METADATA: {"stage": "outcome", "completed": false, "progress": 15}]
OR in decision stage:
[METADATA: {"stage": "decision", "completed": false, "progress": 80, "decision_data": {...}}]

- **stage**: Current stage (outcome, purpose, reality, options, decision, commitment).
- **completed**: true if the current stage is fully complete, else false.
- **progress**: Estimated total journey progress percentage (0-100).

# Strict Rules
1. Never show the JSON to the user as part of the text. Place it on a separate line at the end inside [].
2. No internal monologue.
3. Do not move to "options" before deeply understanding "purpose" and "reality".

# Termination
When you reach the "commitment" stage and the user writes a clear commitment, end the session by outputting the Final Report JSON (no Metadata).
`;

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
  const user = req.user as any;
  if (!user?.claims?.email || user.claims.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "Forbidden: Admin access only" });
  }
  next();
};

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Health check endpoint (before auth to ensure it always works)
  app.get("/api/health", async (_req, res) => {
    try {
      const { getDbHealthStatus } = await import("./db");
      const status = await getDbHealthStatus();
      const httpStatus = status.status === 'healthy' ? 200 : 503;
      res.status(httpStatus).json(status);
    } catch (error: any) {
      res.status(503).json({ 
        status: "unhealthy", 
        message: "Health check failed",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Dedicated DB health endpoint
  app.get("/health/db", async (_req, res) => {
    try {
      const { getDbHealthStatus } = await import("./db");
      const status = await getDbHealthStatus();
      const httpStatus = status.status === 'healthy' ? 200 : 503;
      res.status(httpStatus).json(status);
    } catch (error: any) {
      res.status(503).json({ 
        status: "unhealthy", 
        message: "Database unavailable",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Setup authentication with retry for DNS issues
  let authEnabled = false;
  try {
    await setupAuth(app);
    registerAuthRoutes(app);
    authEnabled = true;
    console.log("Replit Auth initialized successfully");
  } catch (error) {
    console.error("Failed to setup Replit Auth:", error);
    console.log("Admin routes will return 503 due to auth failure");
  }

  // Middleware to check if auth is enabled
  const requireAuth: any = (req: any, res: any, next: any) => {
    if (!authEnabled) {
      return res.status(503).json({ error: "Authentication service unavailable. Please try again later." });
    }
    next();
  };

  // Helper to extract stage from AI metadata (handles nested JSON objects)
  const extractStage = (text: string): string | undefined => {
    // Find METADATA block start
    const startMatch = text.match(/\[METADATA:\s*/);
    if (!startMatch) return undefined;
    
    const startIndex = (startMatch.index ?? 0) + startMatch[0].length;
    
    // Parse JSON from start position, handling nested braces
    let braceCount = 0;
    let jsonStart = -1;
    let jsonEnd = -1;
    
    for (let i = startIndex; i < text.length; i++) {
      const char = text[i];
      if (char === '{') {
        if (jsonStart === -1) jsonStart = i;
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        const jsonStr = text.slice(jsonStart, jsonEnd);
        const metadata = JSON.parse(jsonStr);
        return metadata.stage;
      } catch { /* ignore */ }
    }
    return undefined;
  };

  // Public chat endpoint with analytics logging
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, history, language, sessionId } = req.body;

      const chatHistory = history || messages;

      if (!chatHistory || !Array.isArray(chatHistory)) {
        return res.status(400).json({ error: "Messages array required" });
      }

      // Get the latest user message for logging
      const lastUserMessage = chatHistory.filter((m: any) => m.role === 'user').pop();

      // Log session and message to database for analytics
      if (sessionId) {
        try {
          await storage.getOrCreateSession(sessionId);
          await storage.updateSessionActivity(sessionId);
          await storage.logMessage(sessionId, 'user', lastUserMessage?.content);
        } catch (err) {
          console.error("Analytics logging error:", err);
        }
      }

      // Get system prompt from database or use default
      let systemPrompt: string;
      try {
        const dbPrompt = await storage.getSystemPrompt(language === 'ar' ? 'ar' : 'en');
        systemPrompt = dbPrompt?.content || (language === 'ar' ? DEFAULT_SYSTEM_PROMPT_AR : DEFAULT_SYSTEM_PROMPT_EN);
      } catch {
        systemPrompt = language === 'ar' ? DEFAULT_SYSTEM_PROMPT_AR : DEFAULT_SYSTEM_PROMPT_EN;
      }

      const contents = chatHistory.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      let text = '';
      if (response.text !== undefined) {
        text = response.text as string;
      } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = response.candidates[0].content.parts[0].text;
      }

      // Extract stage from AI response metadata
      const stage = extractStage(text);

      // Log assistant response with content and stage
      if (sessionId) {
        try {
          await storage.logMessage(sessionId, 'assistant', text, stage);
        } catch (err) {
          console.error("Analytics logging error:", err);
        }
      }

      res.json({ content: text });
    } catch (error) {
      console.error("Chat error:", error);

      // Never expose raw database/DNS errors to users
      const isDatabaseError = error instanceof Error && (
        error.message?.includes('EAI_AGAIN') ||
        error.message?.includes('getaddrinfo') ||
        error.message?.includes('helium') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('ETIMEDOUT')
      );

      const message = isDatabaseError
        ? "Service temporarily unavailable. Please try again."
        : (error instanceof Error ? error.message : "Failed to get response");

      res.status(isDatabaseError ? 503 : 500).json({ error: message });
    }
  });

  // Admin: Get analytics stats
  // Dev mode bypass: skip auth if not in production, but always check if auth is enabled in prod
  const adminMiddleware = process.env.NODE_ENV === 'production'
    ? [requireAuth, isAuthenticated, isAdmin]
    : [];

  app.get("/api/admin/stats", ...adminMiddleware, async (req, res) => {
    try {
      const [uniqueUsers, totalMessages, activeUsers24h] = await Promise.all([
        storage.getUniqueUsersCount(),
        storage.getTotalMessagesCount(),
        storage.getActiveUsers24h(),
      ]);

      res.json({
        uniqueUsers,
        totalMessages,
        activeUsers24h,
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin: Get system prompts
  app.get("/api/admin/prompts", ...adminMiddleware, async (req, res) => {
    try {
      const [arPrompt, enPrompt] = await Promise.all([
        storage.getSystemPrompt('ar'),
        storage.getSystemPrompt('en'),
      ]);

      res.json({
        ar: arPrompt?.content || DEFAULT_SYSTEM_PROMPT_AR,
        en: enPrompt?.content || DEFAULT_SYSTEM_PROMPT_EN,
      });
    } catch (error) {
      console.error("Get prompts error:", error);
      res.status(500).json({ error: "Failed to fetch prompts" });
    }
  });

  // Admin: Update system prompt
  app.post("/api/admin/prompts", ...adminMiddleware, async (req, res) => {
    try {
      const { language, content } = req.body;
      const user = req.user as any;

      if (!language || !content) {
        return res.status(400).json({ error: "Language and content required" });
      }

      if (language !== 'ar' && language !== 'en') {
        return res.status(400).json({ error: "Language must be 'ar' or 'en'" });
      }

      const prompt = await storage.upsertSystemPrompt({
        language,
        content,
        updatedBy: user?.claims?.sub || "dev-admin",
      });

      res.json({ success: true, prompt });
    } catch (error) {
      console.error("Update prompt error:", error);
      res.status(500).json({ error: "Failed to update prompt" });
    }
  });

  // Message Feedback (thumbs up/down during chat)
  app.post("/api/feedback/message", async (req, res) => {
    try {
      const { sessionId, messageId, rating } = req.body;

      if (!sessionId || !messageId) {
        return res.status(400).json({ error: "sessionId and messageId required" });
      }

      // null rating means delete the feedback
      if (rating === null) {
        await storage.deleteMessageFeedback(sessionId, messageId);
        return res.json({ success: true, deleted: true });
      }

      if (rating !== 'up' && rating !== 'down') {
        return res.status(400).json({ error: "rating must be 'up', 'down', or null" });
      }

      const feedback = await storage.saveMessageFeedback({ sessionId, messageId, rating });
      res.json({ success: true, feedback });
    } catch (error) {
      console.error("Message feedback error:", error);
      res.status(500).json({ error: "Failed to save feedback" });
    }
  });

  // Get message feedback for a session
  app.get("/api/feedback/messages/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        return res.status(400).json({ error: "sessionId required" });
      }
      const feedback = await storage.getSessionMessageFeedback(sessionId);
      res.json({ feedback });
    } catch (error) {
      console.error("Get message feedback error:", error);
      res.status(500).json({ error: "Failed to get feedback" });
    }
  });

  // Session Feedback (overall feedback after report)
  app.post("/api/feedback/session", async (req, res) => {
    try {
      const { sessionId, rating, comment } = req.body;

      if (!sessionId || typeof rating !== 'number') {
        return res.status(400).json({ error: "sessionId and rating required" });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "rating must be between 1 and 5" });
      }

      const feedback = await storage.saveSessionFeedback({ sessionId, rating, comment: comment || null });
      res.json({ success: true, feedback });
    } catch (error) {
      console.error("Session feedback error:", error);
      res.status(500).json({ error: "Failed to save feedback" });
    }
  });

  // Get session feedback
  app.get("/api/feedback/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        return res.status(400).json({ error: "sessionId required" });
      }
      const feedback = await storage.getSessionFeedback(sessionId);
      res.json({ feedback: feedback || null });
    } catch (error) {
      console.error("Get session feedback error:", error);
      res.status(500).json({ error: "Failed to get feedback" });
    }
  });

  // Get feedback stats for admin
  app.get("/api/admin/feedback-stats", ...adminMiddleware, async (req, res) => {
    try {
      const stats = await storage.getFeedbackStats();
      res.json(stats);
    } catch (error) {
      console.error("Feedback stats error:", error);
      res.status(500).json({ error: "Failed to fetch feedback stats" });
    }
  });

  // Get behavior analytics for admin
  app.get("/api/admin/behavior-stats", ...adminMiddleware, async (req, res) => {
    try {
      const stats = await storage.getBehaviorStats();
      res.json(stats);
    } catch (error) {
      console.error("Behavior stats error:", error);
      res.status(500).json({ error: "Failed to fetch behavior stats" });
    }
  });

  // Get all sessions for admin
  app.get("/api/admin/sessions", ...adminMiddleware, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const [sessions, total] = await Promise.all([
        storage.getAllSessions(limit, offset),
        storage.getSessionsCount(),
      ]);
      
      res.json({ sessions, total, limit, offset });
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Get conversation messages for a session (admin)
  app.get("/api/admin/sessions/:sessionId/messages", ...adminMiddleware, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getSessionMessages(sessionId);
      res.json({ messages });
    } catch (error) {
      console.error("Get session messages error:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Export conversation as TXT
  app.get("/api/admin/sessions/:sessionId/export", ...adminMiddleware, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getSessionMessages(sessionId);
      
      if (messages.length === 0) {
        return res.status(404).json({ error: "No messages found for this session" });
      }

      // Format messages as text
      let txtContent = `Sanad Conversation Export\n`;
      txtContent += `Session ID: ${sessionId}\n`;
      txtContent += `Date: ${new Date().toISOString()}\n`;
      txtContent += `${'='.repeat(50)}\n\n`;

      for (const msg of messages) {
        const role = msg.role === 'user' ? 'User' : 'Sanad';
        const time = msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'Unknown';
        txtContent += `[${role}] (${time})\n`;
        txtContent += `${msg.content || '(empty)'}\n\n`;
      }

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="conversation-${sessionId}.txt"`);
      res.send(txtContent);
    } catch (error) {
      console.error("Export conversation error:", error);
      res.status(500).json({ error: "Failed to export conversation" });
    }
  });

  // Seed initial verified resources (run once)
  app.post("/api/admin/seed-resources", ...adminMiddleware, async (req, res) => {
    try {
      const existingResources = await storage.getVerifiedResources();
      if (existingResources.length > 0) {
        return res.json({ message: "Resources already seeded", count: existingResources.length });
      }

      const seedData = [
        // Courses - Data Analytics
        { type: "course", name: "Google Data Analytics Certificate", nameAr: "شهادة تحليل البيانات من جوجل", platform: "Coursera", field: "data_analytics", fieldAr: "تحليل البيانات", level: "beginner", language: "en", cost: "paid", hasCertificate: "yes", description: "Professional certificate from Google covering data analysis fundamentals", descriptionAr: "شهادة احترافية من جوجل تغطي أساسيات تحليل البيانات" },
        { type: "course", name: "Data Analysis with Python", nameAr: "تحليل البيانات باستخدام Python", platform: "Edraak", field: "data_analytics", fieldAr: "تحليل البيانات", level: "intermediate", language: "ar", cost: "free", hasCertificate: "yes", description: "Learn Python for data analysis in Arabic", descriptionAr: "تعلم Python لتحليل البيانات باللغة العربية" },
        { type: "course", name: "SQL for Data Analysis", nameAr: "SQL لتحليل البيانات", platform: "LinkedIn Learning", field: "data_analytics", fieldAr: "تحليل البيانات", level: "beginner", language: "en", cost: "paid", hasCertificate: "yes", description: "Essential SQL skills for data analysts", descriptionAr: "مهارات SQL الأساسية لمحللي البيانات" },
        
        // Courses - Marketing
        { type: "course", name: "Digital Marketing Specialization", nameAr: "تخصص التسويق الرقمي", platform: "Coursera", field: "marketing", fieldAr: "التسويق", level: "beginner", language: "en", cost: "paid", hasCertificate: "yes", description: "Comprehensive digital marketing program", descriptionAr: "برنامج شامل للتسويق الرقمي" },
        { type: "course", name: "Professional Digital Marketing", nameAr: "التسويق الرقمي الاحترافي", platform: "Rwaq", field: "marketing", fieldAr: "التسويق", level: "intermediate", language: "ar", cost: "free", hasCertificate: "yes", description: "Arabic course on professional digital marketing", descriptionAr: "دورة عربية في التسويق الرقمي الاحترافي" },
        
        // Courses - Management
        { type: "course", name: "PMP Certification Prep", nameAr: "التحضير لشهادة PMP", platform: "LinkedIn Learning", field: "management", fieldAr: "الإدارة", level: "advanced", language: "en", cost: "paid", hasCertificate: "no", description: "Prepare for PMP certification exam", descriptionAr: "الاستعداد لامتحان شهادة PMP" },
        { type: "course", name: "Leadership and Management", nameAr: "القيادة والإدارة", platform: "Edraak", field: "management", fieldAr: "الإدارة", level: "intermediate", language: "ar", cost: "free", hasCertificate: "yes", description: "Develop leadership and management skills", descriptionAr: "تطوير مهارات القيادة والإدارة" },
        
        // Courses - Tech/Programming
        { type: "course", name: "CS50: Introduction to Computer Science", nameAr: "CS50: مقدمة في علوم الحاسب", platform: "edX", field: "technology", fieldAr: "التقنية", level: "beginner", language: "en", cost: "free", hasCertificate: "yes", description: "Harvard's famous introductory course", descriptionAr: "دورة هارفارد الشهيرة في علوم الحاسب" },
        { type: "course", name: "Python Programming Basics", nameAr: "أساسيات البرمجة بلغة Python", platform: "Edraak", field: "technology", fieldAr: "التقنية", level: "beginner", language: "ar", cost: "free", hasCertificate: "yes", description: "Learn Python programming in Arabic", descriptionAr: "تعلم البرمجة بلغة Python بالعربية" },
        { type: "course", name: "AWS Cloud Practitioner", nameAr: "ممارس السحابة من AWS", platform: "AWS Training", field: "technology", fieldAr: "التقنية", level: "beginner", language: "en", cost: "paid", hasCertificate: "yes", description: "Entry-level AWS cloud certification", descriptionAr: "شهادة السحابة للمبتدئين من AWS" },
        
        // Communities - Data Analytics
        { type: "community", name: "Saudi Data Scientists", nameAr: "علماء البيانات السعوديين", platform: "LinkedIn Group", field: "data_analytics", fieldAr: "تحليل البيانات", description: "Community for Saudi data professionals", descriptionAr: "مجتمع متخصصي البيانات السعوديين" },
        { type: "community", name: "Data Analytics Arabia", nameAr: "تحليل البيانات العربية", platform: "Telegram", field: "data_analytics", fieldAr: "تحليل البيانات", description: "Arabic community for data analytics", descriptionAr: "مجتمع عربي لتحليل البيانات" },
        
        // Communities - Marketing
        { type: "community", name: "Digital Marketing KSA", nameAr: "التسويق الرقمي السعودي", platform: "LinkedIn Group", field: "marketing", fieldAr: "التسويق", description: "Saudi digital marketing professionals", descriptionAr: "متخصصو التسويق الرقمي السعوديون" },
        { type: "community", name: "Arab Marketers Network", nameAr: "شبكة المسوقين العرب", platform: "Facebook Group", field: "marketing", fieldAr: "التسويق", description: "Arab marketing professionals network", descriptionAr: "شبكة متخصصي التسويق العرب" },
        
        // Communities - Management
        { type: "community", name: "HR Leaders Saudi Arabia", nameAr: "قادة الموارد البشرية السعودية", platform: "LinkedIn Group", field: "management", fieldAr: "الإدارة", description: "HR and management professionals in KSA", descriptionAr: "متخصصو الموارد البشرية والإدارة في السعودية" },
        { type: "community", name: "Saudi Entrepreneurs", nameAr: "رواد الأعمال السعوديين", platform: "Telegram", field: "management", fieldAr: "الإدارة", description: "Community for Saudi entrepreneurs", descriptionAr: "مجتمع لرواد الأعمال السعوديين" },
        
        // Communities - Tech
        { type: "community", name: "Saudi Tech Professionals", nameAr: "المتخصصون التقنيون السعوديون", platform: "LinkedIn Group", field: "technology", fieldAr: "التقنية", description: "Tech professionals in Saudi Arabia", descriptionAr: "المتخصصون التقنيون في السعودية" },
        { type: "community", name: "Arab Developers", nameAr: "المطورون العرب", platform: "Discord", field: "technology", fieldAr: "التقنية", description: "Arabic-speaking developers community", descriptionAr: "مجتمع المطورين الناطقين بالعربية" },
        { type: "community", name: "Saudi Coders", nameAr: "المبرمجون السعوديون", platform: "Twitter/X", field: "technology", fieldAr: "التقنية", description: "Follow @SaudiCoders for tech updates", descriptionAr: "تابع @SaudiCoders للتحديثات التقنية" },
        { type: "community", name: "Women in Tech Arabia", nameAr: "نساء في التقنية العربية", platform: "LinkedIn Group", field: "technology", fieldAr: "التقنية", description: "Supporting women in technology across the Arab world", descriptionAr: "دعم المرأة في مجال التقنية في العالم العربي" },
      ];

      for (const data of seedData) {
        await storage.createVerifiedResource(data);
      }

      res.json({ message: "Resources seeded successfully", count: seedData.length });
    } catch (error) {
      console.error("Seed resources error:", error);
      res.status(500).json({ error: "Failed to seed resources" });
    }
  });

  // Verified Resources Admin API
  app.get("/api/admin/resources", ...adminMiddleware, async (req, res) => {
    try {
      const { type, field, isActive } = req.query;
      const resources = await storage.getVerifiedResources({
        type: type as string | undefined,
        field: field as string | undefined,
        isActive: isActive as string | undefined
      });
      res.json({ resources });
    } catch (error) {
      console.error("Get resources error:", error);
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  app.post("/api/admin/resources", ...adminMiddleware, async (req, res) => {
    try {
      const resource = await storage.createVerifiedResource(req.body);
      res.json({ resource });
    } catch (error) {
      console.error("Create resource error:", error);
      res.status(500).json({ error: "Failed to create resource" });
    }
  });

  app.put("/api/admin/resources/:id", ...adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const resource = await storage.updateVerifiedResource(id, req.body);
      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }
      res.json({ resource });
    } catch (error) {
      console.error("Update resource error:", error);
      res.status(500).json({ error: "Failed to update resource" });
    }
  });

  app.delete("/api/admin/resources/:id", ...adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteVerifiedResource(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete resource error:", error);
      res.status(500).json({ error: "Failed to delete resource" });
    }
  });

  // Public endpoint - Get resources for report by career field
  app.get("/api/resources/:field", async (req, res) => {
    try {
      const { field } = req.params;
      const validFields = ['technology', 'data_analytics', 'marketing', 'management', 'finance', 'health'];
      if (!validFields.includes(field)) {
        return res.json([]);
      }
      const { type } = req.query;
      const resources = await storage.getResourcesByField(field, type as string | undefined);
      res.json(resources);
    } catch (error) {
      console.error("Get resources by field error:", error);
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  // PDF Export endpoint - Puppeteer-based for perfect Arabic rendering
  app.post("/api/export-report-pdf", async (req, res) => {
    try {
      const { data, isRtl } = req.body;

      if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: "Report data required" });
      }

      if (!Array.isArray(data.strengths) || data.strengths.length === 0) {
        return res.status(400).json({ error: "Strengths must be a non-empty array" });
      }

      if (!Array.isArray(data.career_paths) || data.career_paths.length === 0) {
        return res.status(400).json({ error: "Career paths must be a non-empty array" });
      }

      if (typeof data.passion !== 'string' || !data.passion.trim()) {
        return res.status(400).json({ error: "Passion must be a non-empty string" });
      }

      if (typeof data.advice !== 'string' || !data.advice.trim()) {
        return res.status(400).json({ error: "Advice must be a non-empty string" });
      }

      const sanitizedStrengths = data.strengths
        .filter((s: unknown) => typeof s === 'string' && s.trim())
        .map((s: string) => s.trim());

      const sanitizedCareerPaths = data.career_paths
        .filter((p: unknown) => typeof p === 'string' && p.trim())
        .map((p: string) => p.trim());

      if (sanitizedStrengths.length === 0) {
        return res.status(400).json({ error: "Strengths array has no valid entries after sanitization" });
      }

      if (sanitizedCareerPaths.length === 0) {
        return res.status(400).json({ error: "Career paths array has no valid entries after sanitization" });
      }

      const reliabilityScore = typeof data.reliability_score === 'number'
        ? Math.max(0, Math.min(100, data.reliability_score))
        : 0;

      const pdfBuffer = await generatePdf({
        data: {
          status: 'complete',
          strengths: sanitizedStrengths,
          passion: data.passion.trim(),
          career_paths: sanitizedCareerPaths,
          reliability_score: reliabilityScore,
          advice: data.advice.trim(),
        },
        isRtl: isRtl === true,
      });

      const fileName = isRtl ? 'تقرير-سند.pdf' : 'sanad-report.pdf';

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF generation error:", error);
      const message = error instanceof Error ? error.message : "Failed to generate PDF";
      res.status(500).json({ error: message });
    }
  });

  return httpServer;
}
