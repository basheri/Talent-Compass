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

export async function submitMessageFeedback(
  messageId: string,
  rating: 'up' | 'down' | null
): Promise<void> {
  const sessionId = getSessionId();
  
  const response = await fetch('/api/feedback/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      messageId,
      rating,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to submit message feedback');
  }
}

export async function getMessageFeedback(): Promise<Record<string, 'up' | 'down'>> {
  const sessionId = getSessionId();
  
  const response = await fetch(`/api/feedback/messages/${sessionId}`);
  
  if (!response.ok) {
    return {};
  }
  
  const data = await response.json();
  const result: Record<string, 'up' | 'down'> = {};
  
  if (data.feedback && Array.isArray(data.feedback)) {
    for (const item of data.feedback) {
      result[item.messageId] = item.rating;
    }
  }
  
  return result;
}

export async function submitSessionFeedback(
  rating: number,
  comment?: string
): Promise<void> {
  const sessionId = getSessionId();
  
  const response = await fetch('/api/feedback/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      rating,
      comment,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to submit session feedback');
  }
}

export async function getSessionFeedback(): Promise<{ rating: number; comment?: string } | null> {
  const sessionId = getSessionId();
  
  const response = await fetch(`/api/feedback/session/${sessionId}`);
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  return data.feedback || null;
}
