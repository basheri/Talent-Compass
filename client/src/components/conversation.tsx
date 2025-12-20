import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Bot, User } from 'lucide-react';
import type { Message, OPAResult } from '@/lib/types';
import { tryParseResult } from '@/lib/types';
import { sendMessage } from '@/lib/ai-service';

interface ConversationProps {
  isRtl: boolean;
  messages: Message[];
  language: 'en' | 'ar';
  onAddMessage: (message: Message) => void;
  onComplete: (result: OPAResult) => void;
  onApiError: (error: string) => void;
}

export function Conversation({
  isRtl,
  messages,
  language,
  onAddMessage,
  onComplete,
  onApiError,
}: ConversationProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);


  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    onAddMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(
        [...messages, userMessage],
        language
      );

      const result = tryParseResult(response);
      
      if (result) {
        onComplete(result);
      } else {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        onAddMessage(assistantMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      onApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const labels = isRtl
    ? {
        title: 'محادثة مع سند',
        placeholder: 'اكتب رسالتك هنا...',
        send: 'إرسال',
        thinking: 'جاري التفكير...',
      }
    : {
        title: 'Chat with Sanad',
        placeholder: 'Type your message here...',
        send: 'Send',
        thinking: 'Thinking...',
      };

  return (
    <section className="py-8 px-4 md:px-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold" data-testid="text-conversation-title">{labels.title}</h2>
        </div>

        <Card className="overflow-hidden">
          <ScrollArea 
            ref={scrollRef}
            className="h-[400px] md:h-[450px] p-4"
          >
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' 
                      ? isRtl ? 'flex-row-reverse' : 'flex-row'
                      : ''
                  }`}
                  data-testid={`message-${message.role}-${message.id}`}
                >
                  <div
                    className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`flex-1 rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3" data-testid="typing-indicator">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {labels.thinking}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <CardContent className="border-t p-4">
            <div className="flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={labels.placeholder}
                className={`min-h-[60px] resize-none flex-1 ${isRtl ? 'text-right' : ''}`}
                disabled={isLoading}
                data-testid="input-chat-message"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-auto aspect-square"
                data-testid="button-send-message"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
