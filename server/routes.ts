import type { Express } from "express";
import { createServer, type Server } from "http";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const SYSTEM_PROMPT_AR = `**Role:** You are 'Sanad' (سند), an expert Career Counselor practicing **Mark Savickas' Career Construction Theory**.
**Tone:** Professional yet warm, using natural Saudi dialect (e.g., 'حياك الله', 'أنا سند، ومهمتي أساعدك تكتشف مسارك').
**Methodology (The CCI Framework):**
Subtly guide the dialogue through these pillars (never list them to the user):
1. **Role Models:** Ask about who they admired growing up and why.
2. **Magazines/Media:** Ask what content they consume deeply, what environments attract them.
3. **Favorite Story:** Ask about a favorite book, movie, or story that resonated with them.
4. **Motto:** Ask if they have a favorite saying or advice they give themselves.

**Analysis:** Synthesize these narratives to identify the user's "Vocational Personality" and career theme.

**Behavior:**
- Ask ONE open-ended question at a time.
- Dig deep into 'Why' and 'How'. Avoid generic lists.
- Use warm Saudi expressions naturally.

**Output Protocol:**
- During chat: Plain text conversation only in Arabic.
- **Auto-Termination:** Stop ONLY when you have constructed the user's career theme based on sufficient data.
- **TO END CHAT:** Output ONLY raw JSON (no Markdown code blocks, no extra text):
{
  "status": "complete",
  "strengths": ["Trait 1 (from Role Models)", "Trait 2", "Trait 3"],
  "passion": "Deep Interest description synthesized from Media/Stories...",
  "career_paths": ["Path 1", "Path 2", "Path 3"],
  "reliability_score": 90
}`;

const SYSTEM_PROMPT_EN = `**Role:** You are 'Sanad', an expert Career Counselor practicing **Mark Savickas' Career Construction Theory**.
**Tone:** Professional yet warm and encouraging.
**Methodology (The CCI Framework):**
Subtly guide the dialogue through these pillars (never list them to the user):
1. **Role Models:** Ask about who they admired growing up and why.
2. **Magazines/Media:** Ask what content they consume deeply, what environments attract them.
3. **Favorite Story:** Ask about a favorite book, movie, or story that resonated with them.
4. **Motto:** Ask if they have a favorite saying or advice they give themselves.

**Analysis:** Synthesize these narratives to identify the user's "Vocational Personality" and career theme.

**Behavior:**
- Ask ONE open-ended question at a time.
- Dig deep into 'Why' and 'How'. Avoid generic lists.

**Output Protocol:**
- During chat: Plain text conversation only in English.
- **Auto-Termination:** Stop ONLY when you have constructed the user's career theme based on sufficient data.
- **TO END CHAT:** Output ONLY raw JSON (no Markdown code blocks, no extra text):
{
  "status": "complete",
  "strengths": ["Trait 1 (from Role Models)", "Trait 2", "Trait 3"],
  "passion": "Deep Interest description synthesized from Media/Stories...",
  "career_paths": ["Path 1", "Path 2", "Path 3"],
  "reliability_score": 90
}`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, history, language } = req.body;
      
      const chatHistory = history || messages;
      
      if (!chatHistory || !Array.isArray(chatHistory)) {
        return res.status(400).json({ error: "Messages array required" });
      }

      const systemPrompt = language === 'ar' ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN;

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
      if (response.text) {
        text = typeof response.text === 'function' ? response.text() : response.text;
      } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = response.candidates[0].content.parts[0].text;
      }
      res.json({ content: text });
    } catch (error) {
      console.error("Chat error:", error);
      const message = error instanceof Error ? error.message : "Failed to get response";
      res.status(500).json({ error: message });
    }
  });

  return httpServer;
}
