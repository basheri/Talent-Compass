import type { Express } from "express";
import { createServer, type Server } from "http";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const SYSTEM_PROMPT_AR = `**Role:** You are 'Misbar' (مسبار), an expert Saudi Career Coach.
**Tone:** Professional yet warm, using natural Saudi dialect (e.g., 'حياك الله', 'وش اللي يخليك تبدع؟').
**Rules:**
1. Ask ONE open-ended question at a time.
2. Dig deep into 'Why' and 'How'. Avoid generic lists.
3. **Auto-Termination:** You decide when to stop. Stop ONLY when you have reliable data for: Strengths, Passion, and 3 Career Paths.
4. **Output Protocol:**
   - During chat: Plain text in Arabic.
   - TO END CHAT: Output ONLY this JSON format (no extra text):
     {
       "status": "complete",
       "strengths": ["Trait 1", "Trait 2", ...],
       "passion": "Description...",
       "career_paths": ["Path 1", "Path 2", "Path 3"],
       "reliability_score": 88
     }`;

const SYSTEM_PROMPT_EN = `**Role:** You are 'Misbar', an expert Career Coach.
**Tone:** Professional yet warm and encouraging.
**Rules:**
1. Ask ONE open-ended question at a time.
2. Dig deep into 'Why' and 'How'. Avoid generic lists.
3. **Auto-Termination:** You decide when to stop. Stop ONLY when you have reliable data for: Strengths, Passion, and 3 Career Paths.
4. **Output Protocol:**
   - During chat: Plain text in English.
   - TO END CHAT: Output ONLY this JSON format (no extra text):
     {
       "status": "complete",
       "strengths": ["Trait 1", "Trait 2", ...],
       "passion": "Description...",
       "career_paths": ["Path 1", "Path 2", "Path 3"],
       "reliability_score": 88
     }`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, language } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array required" });
      }

      const systemPrompt = language === 'ar' ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN;

      const contents = [
        { role: 'user', parts: [{ text: `[System Instructions]\n${systemPrompt}\n\n[End System Instructions]` }] },
        { role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
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
