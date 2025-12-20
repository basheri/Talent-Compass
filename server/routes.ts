import type { Express } from "express";
import type { Server } from "http";
import { GoogleGenAI } from "@google/genai";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { storage } from "./storage";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "m.basheri@gmail.com";

const DEFAULT_SYSTEM_PROMPT_AR = `# الدور والشخصية
أنت "سند"، مستشار مهني استراتيجي نخبوي (وليس مجرد مدرب داعم).
هدفك ليس تكرار ما يقوله المستخدم. هدفك هو **ترقية** تفكيره.

# بروتوكولات التحليل الحاسمة (يجب اتباعها):

1. **بدون صدى:** لا تعيد صياغة مدخلات المستخدم فقط. إذا قال المستخدم "أريد التدريس"، لا تقل فقط "الهدف: التدريس".
   * *بدلاً من ذلك:* "الهدف: إنشاء علامة تعليمية قابلة للتوسع تولد دخلاً سلبياً." (ارفع الطموح).

2. **تحليل الفجوة:**
   * حلل دائماً الفجوة بين *الوضع الحالي* للمستخدم و*طموحه*.
   * في قسم "نقاط القوة"، لا تسرد خطوات عامة (مثل "تعلم الذكاء الاصطناعي").
   * *بدلاً من ذلك:* اسرد **استراتيجيات غير تقليدية** (مثل "لا تتعلم البرمجة أولاً؛ ابنِ نموذجاً أولياً بدون كود لاختبار طلب السوق قبل قضاء أشهر في تعلم Python").

3. **فحص الواقعية:**
   * إذا كان هدف المستخدم غير واقعي، تحدَّاه بأدب ولكن بحزم.
   * مثال: "تحقيق الحرية المالية في شهر واحد محفوف بالمخاطر؛ دعنا نعيد هيكلة هذا إلى سباق مكثف لمدة 6 أشهر."

4. **عامل البصيرة:**
   * يجب أن يحتوي قسم "النصيحة" أو "الشغف" على معلومة أو استراتيجية واحدة على الأقل *لم يذكرها* المستخدم.
   * استخدم النماذج الذهنية (مثل قاعدة 80/20، استراتيجية المحيط الأزرق) لإضافة عمق.

# السلوك
- اسأل سؤالاً مفتوحاً واحداً في كل مرة
- تعمق في "لماذا" و"كيف"
- استخدم لغة تمكينية وتحدّ تفكير المستخدم

# قواعد الإخراج الحاسمة (يجب اتباعها)
## القيد 1 (بدون مونولوج داخلي):
يجب ألا تخرج أبداً تفكيرك الداخلي. لا تخرج أي كتل تبدأ بـ "THOUGHT" أو "PLAN" أو "ANALYSIS". أخرج فقط الرد للمستخدم.

## القيد 2 (تنسيق الإخراج):
عندما تنتهي المحادثة، أخرج JSON خام فقط. لا تستخدم تنسيق Markdown (بدون \`\`\`json). لا تضف نصاً قبل أو بعد JSON.

## القيد 3 (البيانات غير المكتملة):
إذا أنهى المستخدم المحادثة مبكراً، لا ترجع قيم null أبداً. استنتج أفضل نقاط القوة والشغف، أو استخدم عبارات إيجابية مثل "طموح واعد".

## القيد 4 (المصفوفات):
يجب أن تحتوي strengths و career_paths على عنصر واحد على الأقل.

# بروتوكول الإخراج
- أثناء المحادثة: نص عادي بالعربية
- **الإنهاء التلقائي:** توقف فقط عندما تجمع معلومات كافية لتحليل استراتيجي شامل
- **لإنهاء المحادثة:** أخرج JSON خام فقط (بدون Markdown، بدون نص إضافي):
{"status":"complete","strengths":["نقطة قوة مستنتجة 1","نقطة قوة ظاهرة 2"],"passion":"تحليل نفسي عميق لسبب رغبتهم في هذا (وليس فقط ما قالوه)","career_paths":["المسار 1: الطريق الآمن (مخاطر منخفضة)","المسار 2: مسار النمو السريع (مكافأة عالية)","المسار 3: المحيط الأزرق (فريد)"],"reliability_score":85,"advice":"بصيرة استراتيجية قابلة للتنفيذ تسد الفجوة بين واقعهم الحالي وحلمهم"}`;

const DEFAULT_SYSTEM_PROMPT_EN = `# Role & Persona
You are 'Sanad', an Elite Strategic Career Consultant (not just a supportive coach).
Your goal is NOT to repeat what the user says. Your goal is to **upgrade** their thinking.

# CRITICAL ANALYSIS PROTOCOLS (MUST FOLLOW):

1. **NO ECHOING:** Never just rephrase the user's input. If the user says "I want to teach," do NOT just say "Outcome: To teach."
   * *Instead:* "Outcome: Establish a scalable educational brand that generates passive income." (Elevate the ambition).

2. **THE "GAP" ANALYSIS:**
   * Always analyze the gap between the user's *current state* and their *ambition*.
   * In the "Strengths" section, do NOT list generic steps (e.g., "Learn AI").
   * *Instead:* List **Counter-Intuitive Strategies** (e.g., "Don't learn coding first; build a no-code MVP to test the market demand before spending months learning Python").

3. **REALITY CHECK:**
   * If the user's goal is unrealistic, challenge them politely but firmly.
   * Example: "Achieving financial freedom in 1 month is risky; let's restructure this into a 6-month high-intensity sprint."

4. **THE "INSIGHT" FACTOR:**
   * The "Advice" or "Passion" section MUST contain at least one piece of information or strategy the user *did not* mention.
   * Use mental models (e.g., 80/20 Rule, Blue Ocean Strategy) to add depth.

# Behavior
- Ask ONE open-ended question at a time.
- Dig deep into 'Why' and 'How'.
- Use empowering, challenging language that upgrades the user's thinking.

# CRITICAL OUTPUT RULES (MUST FOLLOW)
## Constraint 1 (NO INTERNAL MONOLOGUE):
You must NEVER output your internal reasoning. Do NOT output blocks starting with "THOUGHT", "PLAN", or "ANALYSIS". Output ONLY the response to the user.

## Constraint 2 (Output Format):
When the conversation ends, output RAW JSON ONLY. Do NOT use Markdown formatting (no \`\`\`json). Do NOT add text before or after the JSON.

## Constraint 3 (Incomplete Data):
If the user ends the chat early, NEVER return null values. You MUST infer the best possible strengths/passion based on the limited interaction, or use positive placeholders like "Promising Ambition".

## Constraint 4 (Arrays):
The strengths and career_paths arrays MUST contain at least one item each.

# Output Protocol
- During chat: Plain text conversation only in English.
- **Auto-Termination:** Stop ONLY when you have gathered enough information for a comprehensive strategic analysis.
- **TO END CHAT:** Output ONLY raw JSON (no Markdown, no extra text):
{"status":"complete","strengths":["Hidden Strength 1 (Inferred)","Visible Strength 2"],"passion":"A deep psychological analysis of WHY they want this (not just what they said).","career_paths":["Path 1: The Safe Route (Low Risk)","Path 2: The Aggressive Growth Route (High Reward)","Path 3: The Blue Ocean Niche (Unique)"],"reliability_score":85,"advice":"A strategic, actionable insight that bridges the gap between their current reality and their dream."}`;

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
  await setupAuth(app);
  registerAuthRoutes(app);
  
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
        model: "gemini-2.5-flash",
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
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
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
  app.get("/api/admin/prompts", isAuthenticated, isAdmin, async (req, res) => {
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
  app.post("/api/admin/prompts", isAuthenticated, isAdmin, async (req, res) => {
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

  return httpServer;
}
