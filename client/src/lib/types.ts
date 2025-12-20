export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AssessmentData {
  name: string;
  age: string;
  education: string;
  currentRole: string;
  skills: string;
  interests: string;
  goals: string;
  challenges: string;
}

export interface CareerSuggestion {
  title: string;
  description: string;
  matchScore: number;
  requiredSkills: string[];
  growthPotential: 'High' | 'Medium' | 'Low';
  nextSteps: string[];
}

export interface AssessmentResult {
  summary: string;
  strengths: string[];
  talents: string[];
  careerSuggestions: CareerSuggestion[];
  developmentAreas: string[];
  recommendedResources: string[];
}

export interface AppState {
  step: 'welcome' | 'assessment' | 'conversation' | 'results';
  assessmentData: AssessmentData | null;
  messages: Message[];
  result: AssessmentResult | null;
  isLoading: boolean;
  isRtl: boolean;
  language: 'en' | 'ar';
}

export const initialAssessmentData: AssessmentData = {
  name: '',
  age: '',
  education: '',
  currentRole: '',
  skills: '',
  interests: '',
  goals: '',
  challenges: '',
};

export const STORAGE_KEYS = {
  API_KEY: 'career_discovery_api_key',
  THEME: 'career_discovery_theme',
  LANGUAGE: 'career_discovery_language',
} as const;
