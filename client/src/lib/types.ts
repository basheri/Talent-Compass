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
  cleaned = cleaned.replace(/^```json\s*/gim, '');
  cleaned = cleaned.replace(/^```\s*/gim, '');
  cleaned = cleaned.replace(/\s*```\s*$/gim, '');
  cleaned = cleaned.replace(/```/g, '');
  return cleaned.trim();
}

export function tryParseResult(content: string): OPAResult | null {
  try {
    const sanitized = sanitizeJsonResponse(content);
    
    const jsonRegex = /\{\s*"status"\s*:\s*"complete"[\s\S]*?\}/;
    const jsonMatch = sanitized.match(jsonRegex);
    if (!jsonMatch) {
      const fallbackMatch = sanitized.match(/\{[\s\S]*"status"\s*:\s*"complete"[\s\S]*\}/);
      if (!fallbackMatch) return null;
      
      try {
        const parsed = JSON.parse(fallbackMatch[0]);
        return validateAndNormalize(parsed);
      } catch {
        return null;
      }
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return validateAndNormalize(parsed);
  } catch {
    return null;
  }
}

function validateAndNormalize(parsed: any): OPAResult | null {
  if (parsed.status !== 'complete') return null;
  
  const outcome = parsed.outcome || 'هدف طموح';
  const purpose = parsed.purpose || 'تحقيق الذات';
  const role = parsed.role || 'قائد التغيير';
  const musts = Array.isArray(parsed.musts) && parsed.musts.length > 0 
    ? parsed.musts.filter((m: any) => m != null) 
    : ['خطوة أولى مهمة'];
  const shoulds = Array.isArray(parsed.shoulds) 
    ? parsed.shoulds.filter((s: any) => s != null) 
    : [];
  const time_zone = parsed.time_zone || 'The Zone';
  const reliability_score = typeof parsed.reliability_score === 'number' 
    ? parsed.reliability_score 
    : 70;

  return {
    status: 'complete',
    outcome,
    purpose,
    role,
    musts: musts.length > 0 ? musts : ['ابدأ الآن'],
    shoulds,
    time_zone,
    reliability_score,
  };
}
