import type { Message } from './types';
import { getSessionId, generateNewSessionId } from './session';

export function hasApiKey(): boolean {
  return true;
}

export function clearChatSession(): void {
  generateNewSessionId();
}

export async function sendMessage(
  messages: Message[],
  language: 'en' | 'ar'
): Promise<string> {
  const sessionId = getSessionId();
  
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      history: messages,
      language,
      sessionId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || (language === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error'));
  }

  const data = await response.json();
  
  if (!data.content) {
    throw new Error(language === 'ar' ? 'لم يتم استلام رد' : 'No response received');
  }

  return data.content;
}
