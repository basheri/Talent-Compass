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
  // Setup authentication
  // await setupAuth(app);
  // registerAuthRoutes(app);

  // Public chat endpoint with analytics logging
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, history, language, sessionId } = req.body;

      const chatHistory = history || messages;

      if (!chatHistory || !Array.isArray(chatHistory)) {
        return res.status(400).json({ error: "Messages array required" });
      }

      // Log session and message to database for analytics
      if (sessionId) {
        try {
          await storage.getOrCreateSession(sessionId);
          await storage.updateSessionActivity(sessionId);
          await storage.logMessage(sessionId, 'user');
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

      // Log assistant response
      if (sessionId) {
        try {
          await storage.logMessage(sessionId, 'assistant');
        } catch (err) {
          console.error("Analytics logging error:", err);
        }
      }

      res.json({ content: text });
    } catch (error) {
      console.error("Chat error:", error);
      const message = error instanceof Error ? error.message : "Failed to get response";
      res.status(500).json({ error: message });
    }
  });

  // Admin: Get analytics stats
  // Dev mode bypass: skip auth if not in production
  const adminMiddleware = process.env.NODE_ENV === 'production'
    ? [isAuthenticated, isAdmin]
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
        updatedBy: user.claims.sub,
      });

      res.json({ success: true, prompt });
    } catch (error) {
      console.error("Update prompt error:", error);
      res.status(500).json({ error: "Failed to update prompt" });
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
