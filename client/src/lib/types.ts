export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface OPAResult {
  status: 'complete';
  outcome: string;
  purpose: string;
  role: string;
  musts: string[];
  shoulds: string[];
  time_zone: string;
  reliability_score: number;
}

export type MisbarResult = OPAResult;

export interface AppState {
  step: 'welcome' | 'conversation' | 'results';
  messages: Message[];
  result: OPAResult | null;
  isLoading: boolean;
  isRtl: boolean;
  language: 'en' | 'ar';
}

export const STORAGE_KEYS = {
  THEME: 'opa_theme',
  LANGUAGE: 'opa_language',
  API_KEY: 'opa_api_key',
} as const;

export function sanitizeJsonResponse(content: string): string {
  let cleaned = content.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  return cleaned.trim();
}

export function tryParseResult(content: string): OPAResult | null {
  try {
    const sanitized = sanitizeJsonResponse(content);
    const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    if (
      parsed.status === 'complete' &&
      typeof parsed.outcome === 'string' &&
      typeof parsed.purpose === 'string' &&
      typeof parsed.role === 'string' &&
      Array.isArray(parsed.musts) &&
      Array.isArray(parsed.shoulds) &&
      typeof parsed.reliability_score === 'number'
    ) {
      return {
        ...parsed,
        time_zone: parsed.time_zone || 'The Zone',
      } as OPAResult;
    }
    return null;
  } catch {
    return null;
  }
}
