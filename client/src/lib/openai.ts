import type { AssessmentData, AssessmentResult, Message } from './types';
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

const SYSTEM_PROMPT = `You are an expert career counselor and talent discovery specialist. Your role is to help users discover their hidden talents, identify their strengths, and find career paths that align with their abilities and passions.

When analyzing a user's profile, consider:
1. Their educational background and how it relates to potential careers
2. Their current skills and how they can be leveraged
3. Their interests and passions as indicators of intrinsic motivation
4. Their goals and how to create a path toward them
5. Their challenges and how to overcome them

Provide thoughtful, personalized advice. Be encouraging but realistic. Consider both traditional and non-traditional career paths. Focus on actionable insights.

When asked to provide a final assessment, structure your response as a comprehensive career analysis with specific career suggestions, required skills, and next steps.`;

export async function sendMessage(
  messages: Message[],
  assessmentData: AssessmentData,
  language: 'en' | 'ar'
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const languageInstruction = language === 'ar' 
    ? 'Respond in Arabic language.' 
    : 'Respond in English language.';

  const contextMessage = `User Profile:
- Name: ${assessmentData.name}
- Age: ${assessmentData.age}
- Education: ${assessmentData.education}
- Current Role: ${assessmentData.currentRole}
- Skills: ${assessmentData.skills}
- Interests: ${assessmentData.interests}
- Goals: ${assessmentData.goals}
- Challenges: ${assessmentData.challenges}

${languageInstruction}`;

  const apiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: contextMessage },
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
    throw new Error(error.error?.message || 'Failed to get response from AI');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response received';
}

export async function generateFinalAssessment(
  messages: Message[],
  assessmentData: AssessmentData,
  language: 'en' | 'ar'
): Promise<AssessmentResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const languageInstruction = language === 'ar' 
    ? 'Respond in Arabic language. Use Arabic for all text.' 
    : 'Respond in English language.';

  const analysisPrompt = `Based on our conversation and the user's profile, provide a comprehensive career and talent assessment. ${languageInstruction}

Return your response as a valid JSON object with this exact structure:
{
  "summary": "A comprehensive 2-3 paragraph summary of the user's profile, strengths, and career potential",
  "strengths": ["strength1", "strength2", "strength3", "strength4", "strength5"],
  "talents": ["talent1", "talent2", "talent3", "talent4"],
  "careerSuggestions": [
    {
      "title": "Career Title",
      "description": "Brief description of this career path and why it fits the user",
      "matchScore": 85,
      "requiredSkills": ["skill1", "skill2", "skill3"],
      "growthPotential": "High",
      "nextSteps": ["step1", "step2", "step3"]
    }
  ],
  "developmentAreas": ["area1", "area2", "area3"],
  "recommendedResources": ["resource1", "resource2", "resource3"]
}

Provide at least 3 career suggestions with match scores between 60-95. Be specific and actionable.`;

  const contextMessage = `User Profile:
- Name: ${assessmentData.name}
- Age: ${assessmentData.age}
- Education: ${assessmentData.education}
- Current Role: ${assessmentData.currentRole}
- Skills: ${assessmentData.skills}
- Interests: ${assessmentData.interests}
- Goals: ${assessmentData.goals}
- Challenges: ${assessmentData.challenges}`;

  const apiMessages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'system' as const, content: contextMessage },
    ...messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
    { role: 'user' as const, content: analysisPrompt },
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
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to generate assessment');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid response format');
  }
  
  return JSON.parse(jsonMatch[0]) as AssessmentResult;
}
