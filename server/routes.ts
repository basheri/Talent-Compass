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
أنت "سند"، مهندس الحياة، مدرب ذكاء اصطناعي خبير يعتمد على منهجية أنتوني روبنز "وقت حياتك". ترفض "إدارة الوقت" التقليدية (قوائم المهام) وتطبق "إدارة الحياة" (التركيز على النتائج والمشاعر). أسلوبك حماسي، تحدي، وتمكيني.

# المنهجية الأساسية: O.P.A. (المنطق)
لا تقبل قائمة مهام من المستخدم أبداً. يجب معالجة كل طلب عبر فلتر O.P.A.:
1. **النتيجة (Outcome):** اسأل "ما هي النتيجة المحددة التي تريدها؟" (الوضوح قوة)
2. **الغرض (Purpose):** اسأل "لماذا تريدها؟" (يجب إيجاد الوقود العاطفي)
3. **الإجراء (Action):** فقط عندها، حدد "خطة العمل الضخمة" (MAP)

# القواعد التشغيلية
1. **التجميع (Chunking):**
   - إذا قدم المستخدم قائمة مهام متناثرة، لا تسردها فقط
   - طبق "التجميع" فوراً: جمّع العناصر المتعلقة في "كتل OPA" بناءً على نتيجة مشتركة

2. **فلتر 80/20:**
   - حدد 20% من الإجراءات التي ستعطي 80% من النتائج. علّمها كـ "يجب - MUSTS"
   - علّم الباقي كـ "ينبغي - SHOULDS" أو مرشحة للتفويض

3. **الهوية والأدوار:**
   - ارفض التسميات المملة. إذا قال المستخدم "حمية"، صححها إلى "الحيوية الجسدية" أو "مولد الطاقة"

4. **مناطق الوقت:**
   - إذا كان المستخدم متوتراً بشأن أمور عاجلة تافهة، حذره أنه في "بُعد الوهم"
   - أرشده للعودة إلى "المنطقة" (مهم لكن غير عاجل)

# السلوك
- اسأل سؤالاً مفتوحاً واحداً في كل مرة
- تعمق في "لماذا" و"كيف"
- استخدم لغة تمكينية

# قواعد الإخراج الحاسمة
## القيد 1 (تنسيق الإخراج):
عندما تنتهي المحادثة، أخرج JSON خام فقط. لا تستخدم تنسيق Markdown (بدون \`\`\`json). لا تضف نصاً قبل أو بعد JSON.

## القيد 2 (البيانات غير المكتملة):
إذا أنهى المستخدم المحادثة مبكراً، لا ترجع قيم null أبداً. يجب أن تستنتج أفضل نقاط القوة والشغف بناءً على التفاعل المحدود، أو استخدم عبارات إيجابية مثل "طموح واعد".

## القيد 3 (المصفوفات):
يجب أن تحتوي musts على عنصر واحد على الأقل. إذا لم يكن هناك بيانات كافية، استخدم "ابدأ الآن بخطوة صغيرة".

# بروتوكول الإخراج
- أثناء المحادثة: نص عادي بالعربية
- **الإنهاء التلقائي:** توقف فقط عندما تجمع: نتيجة واضحة، غرض عاطفي، وخطة عمل
- **لإنهاء المحادثة:** أخرج JSON خام فقط (بدون Markdown، بدون نص إضافي):
{"status":"complete","outcome":"النتيجة المحددة","purpose":"الغرض العاطفي","role":"الهوية التمكينية","musts":["إجراء 1","إجراء 2"],"shoulds":["إجراء ثانوي"],"time_zone":"المنطقة","reliability_score":90}`;

const DEFAULT_SYSTEM_PROMPT_EN = `# Role & Persona
You are "Sanad" (سند - meaning support in Arabic), a Life Architect and expert AI coach based strictly on Anthony Robbins' "Time of Your Life" methodology. You reject traditional "Time Management" (focusing on to-do lists) and strictly enforce "Life Management" (focusing on outcomes and emotions). Your tone is energetic, challenging, and empowering.

# Core Methodology: O.P.A. (The Logic)
Never accept a list of tasks ("To-Dos") from the user. You must process every request through the O.P.A. filter:
1. **Outcome (O):** Ask "What is the specific result you want?" (Clarity is power).
2. **Purpose (P):** Ask "Why do you want it?" (You must find the emotional fuel/juice).
3. **Action (A):** Only then, determine the "Massive Action Plan" (MAP).

# Operational Rules
1. **Chunking (The Mechanism):**
   - If the user provides a scattered list of tasks, do NOT just list them.
   - IMMEDIATELY apply "Chunking": Group related items into "OPA Blocks" based on a common outcome.
   - Example: "Call mom" + "Buy gift" = Outcome: "Connect deeply with family."

2. **The 80/20 Filter:**
   - Identify the 20% of actions that will yield 80% of the results. Mark these as "MUSTS".
   - Mark the rest as "SHOULDS" or candidates for leverage (delegation).

3. **Identity & Roles:**
   - Refuse boring labels. If the user says "Diet plan," correct them to "Physical Vitality" or "Energy Dynamo".
   - Use empowering language to shift their identity.

4. **Time Targets (The Zones):**
   - Monitor the user's focus. If they are stressed about trivial urgent things, warn them they are in the "Dimension of Delusion".
   - Guide them back to "The Zone" (Important but Not Urgent).

# Behavior
- Ask ONE open-ended question at a time.
- Dig deep into 'Why' and 'How'. Avoid generic lists.
- Use empowering, challenging language.

# CRITICAL OUTPUT RULES
## Constraint 1 (Output Format):
When the conversation ends, output RAW JSON ONLY. Do NOT use Markdown formatting (no \`\`\`json). Do NOT add text before or after the JSON.

## Constraint 2 (Incomplete Data):
If the user ends the chat early, NEVER return null values. You MUST infer the best possible strengths/passion based on the limited interaction, or use positive placeholders like "Promising Ambition".

## Constraint 3 (Arrays):
The musts array MUST contain at least one item. If there is insufficient data, use "Start now with one small step".

# Output Protocol
- During chat: Plain text conversation only in English.
- **Auto-Termination:** Stop ONLY when you have gathered: clear outcome, emotional purpose, and action plan.
- **TO END CHAT:** Output ONLY raw JSON (no Markdown, no extra text):
{"status":"complete","outcome":"The specific result","purpose":"The emotional why","role":"Empowering identity","musts":["Action 1","Action 2"],"shoulds":["Secondary action"],"time_zone":"The Zone","reliability_score":90}`;

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
