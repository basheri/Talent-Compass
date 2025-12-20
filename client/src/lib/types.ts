export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface OPAResult {
  status: 'complete';
  strengths: string[];
  passion: string;
  career_paths: string[];
  reliability_score: number;
  advice: string;
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

export function stripInternalMonologue(content: string): string {
  let cleaned = content;
  cleaned = cleaned.replace(/^(THOUGHT|PLAN|ANALYSIS|تفكير|تحليل|خطة)[:\s][\s\S]*?(?=\n\n|\n[A-Z]|$)/gim, '');
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  cleaned = cleaned.replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, '');
  cleaned = cleaned.replace(/\*\*(?:THOUGHT|PLAN|ANALYSIS)\*\*[\s\S]*?(?=\n\n|\*\*|$)/gi, '');
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
  
  const strengths = Array.isArray(parsed.strengths) && parsed.strengths.length > 0 
    ? parsed.strengths.filter((s: any) => s != null) 
    : ['طموح واعد', 'إرادة قوية'];
  const passion = parsed.passion || 'شغف بتحقيق الذات والنمو المستمر';
  const career_paths = Array.isArray(parsed.career_paths) && parsed.career_paths.length > 0 
    ? parsed.career_paths.filter((p: any) => p != null) 
    : ['مسار آمن', 'مسار نمو سريع'];
  const reliability_score = typeof parsed.reliability_score === 'number' 
    ? parsed.reliability_score 
    : 70;
  const advice = parsed.advice || 'ابدأ بخطوة صغيرة اليوم نحو هدفك الكبير';

  return {
    status: 'complete',
    strengths: strengths.length > 0 ? strengths : ['طموح واعد'],
    passion,
    career_paths: career_paths.length > 0 ? career_paths : ['مسار واعد'],
    reliability_score,
    advice,
  };
}
