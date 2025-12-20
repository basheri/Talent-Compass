import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Message } from './types';
import { STORAGE_KEYS } from './types';

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
- During chat: Plain text conversation only.
- **Auto-Termination:** Stop ONLY when you have constructed the user's career theme based on sufficient data.
- **TO END CHAT:** Output ONLY this JSON format (no Markdown framing):
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
- During chat: Plain text conversation only.
- **Auto-Termination:** Stop ONLY when you have constructed the user's career theme based on sufficient data.
- **TO END CHAT:** Output ONLY this JSON format (no Markdown framing):
     {
       "status": "complete",
       "strengths": ["Trait 1 (from Role Models)", "Trait 2", "Trait 3"],
       "passion": "Deep Interest description synthesized from Media/Stories...",
       "career_paths": ["Path 1", "Path 2", "Path 3"],
       "reliability_score": 90
     }`;

interface ChatSession {
  sendMessage: (message: string) => Promise<{ response: { text: () => string } }>;
}

let genAI: GoogleGenerativeAI | null = null;
let chatSession: ChatSession | null = null;
let currentApiKey: string | null = null;
let currentLanguage: 'en' | 'ar' | null = null;

function getApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEYS.API_KEY);
}

export function hasApiKey(): boolean {
  const key = getApiKey();
  return !!key && key.trim().length > 0;
}

export function clearChatSession(): void {
  genAI = null;
  chatSession = null;
  currentApiKey = null;
  currentLanguage = null;
}

export async function sendMessage(
  messages: Message[],
  language: 'en' | 'ar'
): Promise<string> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error(language === 'ar' ? 'مفتاح API غير موجود' : 'API key not found');
  }

  const systemPrompt = language === 'ar' ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN;

  try {
    if (!genAI || !chatSession || currentApiKey !== apiKey || currentLanguage !== language) {
      genAI = new GoogleGenerativeAI(apiKey);
      
      const model = genAI.getGenerativeModel({
        model: 'models/gemini-1.5-pro',
        systemInstruction: systemPrompt,
      });

      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: msg.content }],
      }));

      chatSession = model.startChat({ history });
      currentApiKey = apiKey;
      currentLanguage = language;
    }

    const lastMessage = messages[messages.length - 1];
    const result = await chatSession.sendMessage(lastMessage.content);
    const text = result.response.text();
    
    if (!text) {
      throw new Error(language === 'ar' ? 'لم يتم استلام رد' : 'No response received');
    }

    return text;
  } catch (error: unknown) {
    chatSession = null;
    genAI = null;
    currentApiKey = null;
    currentLanguage = null;
    
    if (error instanceof Error) {
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key') || error.message.includes('401')) {
        throw new Error(language === 'ar' ? 'مفتاح API غير صالح' : 'Invalid API key');
      }
      if (error.message.includes('quota') || error.message.includes('rate') || error.message.includes('429')) {
        throw new Error(language === 'ar' ? 'تم تجاوز حد الاستخدام' : 'Rate limit exceeded');
      }
      throw error;
    }
    
    throw new Error(language === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
  }
}
