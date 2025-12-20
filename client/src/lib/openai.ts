import type { Message } from './types';
import { STORAGE_KEYS } from './types';

export function getApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEYS.API_KEY);
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEYS.API_KEY, key);
}

export function removeApiKey(): void {
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
}

export function hasApiKey(): boolean {
  const key = getApiKey();
  return !!key && key.trim().length > 0;
}

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

export async function sendMessage(
  messages: Message[],
  language: 'en' | 'ar'
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(language === 'ar' ? 'مفتاح API غير مكوّن' : 'API key not configured');
  }

  const systemPrompt = language === 'ar' ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN;

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errorMessage = error.error?.message || '';
    
    if (response.status === 401 || errorMessage.includes('invalid') || errorMessage.includes('Incorrect API key')) {
      throw new Error(language === 'ar' ? 'مفتاح API غير صالح' : 'Invalid API key');
    }
    if (response.status === 429 || errorMessage.includes('quota') || errorMessage.includes('exceeded')) {
      throw new Error(language === 'ar' ? 'تم تجاوز حصة API' : 'API quota exceeded');
    }
    throw new Error(errorMessage || (language === 'ar' ? 'فشل في الحصول على استجابة' : 'Failed to get response'));
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}
