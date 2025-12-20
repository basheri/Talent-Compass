export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface MisbarResult {
  status: 'complete';
  strengths: string[];
  passion: string;
  career_paths: string[];
  reliability_score: number;
}

export interface AppState {
  step: 'welcome' | 'conversation' | 'results';
  messages: Message[];
  result: MisbarResult | null;
  isLoading: boolean;
  isRtl: boolean;
  language: 'en' | 'ar';
}

export const STORAGE_KEYS = {
  THEME: 'sanad_theme',
  LANGUAGE: 'sanad_language',
  API_KEY: 'sanad_api_key',
} as const;

export function sanitizeJsonResponse(content: string): string {
  let cleaned = content.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  return cleaned.trim();
}

export function tryParseResult(content: string): MisbarResult | null {
  try {
    const sanitized = sanitizeJsonResponse(content);
    const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    if (
      parsed.status === 'complete' &&
      Array.isArray(parsed.strengths) &&
      typeof parsed.passion === 'string' &&
      Array.isArray(parsed.career_paths) &&
      typeof parsed.reliability_score === 'number'
    ) {
      return parsed as MisbarResult;
    }
    return null;
  } catch {
    return null;
  }
}
