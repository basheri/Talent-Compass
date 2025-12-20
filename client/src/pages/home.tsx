import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { HeroSection } from '@/components/hero-section';
import { Conversation } from '@/components/conversation';
import { ResultsDisplay } from '@/components/results-display';
import type { AppState, Message, OPAResult } from '@/lib/types';
import { STORAGE_KEYS } from '@/lib/types';
import { clearChatSession } from '@/lib/ai-service';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { toast } = useToast();
  const [state, setState] = useState<AppState>({
    step: 'welcome',
    messages: [],
    result: null,
    isLoading: false,
    isRtl: true,
    language: 'ar',
  });

  useEffect(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as 'en' | 'ar' | null;
    if (savedLanguage) {
      setState(prev => ({
        ...prev,
        language: savedLanguage,
        isRtl: savedLanguage === 'ar',
      }));
    }
  }, []);

  const toggleLanguage = () => {
    setState(prev => {
      const newLang = prev.language === 'en' ? 'ar' : 'en';
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, newLang);
      return {
        ...prev,
        language: newLang,
        isRtl: newLang === 'ar',
      };
    });
  };

  const handleStartJourney = () => {
    const initialGreeting = state.isRtl
      ? 'مرحبا! أنا مهندس حياتك OPA. أنا هنا لأساعدك تحول أفكارك ومهامك إلى خطة حياة واضحة. لنبدأ... ما هي النتيجة المحددة التي تريد تحقيقها الآن؟ لا تعطيني قائمة مهام - أخبرني عن النتيجة النهائية التي تسعى لها.'
      : "Hello! I'm your OPA Life Architect. I'm here to help you transform your scattered ideas into a clear life plan. Let's begin... What is the specific OUTCOME you want to achieve right now? Don't give me a to-do list - tell me about the end result you're after.";

    const initialMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: initialGreeting,
      timestamp: new Date(),
    };

    clearChatSession();
    setState(prev => ({ ...prev, step: 'conversation', messages: [initialMessage] }));
  };

  const handleAddMessage = (message: Message) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const handleComplete = (result: OPAResult) => {
    setState(prev => ({
      ...prev,
      result,
      step: 'results',
    }));
  };

  const handleApiError = (errorMessage: string) => {
    toast({
      title: state.isRtl ? 'حدث خطأ' : 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  };

  const handleRestart = () => {
    clearChatSession();
    setState(prev => ({
      ...prev,
      step: 'welcome',
      messages: [],
      result: null,
    }));
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white dark:from-gray-900 dark:to-gray-950"
      dir={state.isRtl ? 'rtl' : 'ltr'}
      data-testid="home-page"
    >
      <Header 
        isRtl={state.isRtl} 
        onToggleLanguage={toggleLanguage} 
      />

      <main className="pb-16">
        {state.step === 'welcome' && (
          <HeroSection
            isRtl={state.isRtl}
            onStart={handleStartJourney}
          />
        )}

        {state.step === 'conversation' && (
          <Conversation
            isRtl={state.isRtl}
            messages={state.messages}
            language={state.language}
            onAddMessage={handleAddMessage}
            onComplete={handleComplete}
            onApiError={handleApiError}
          />
        )}

        {state.step === 'results' && state.result && (
          <ResultsDisplay
            isRtl={state.isRtl}
            result={state.result}
            onRestart={handleRestart}
          />
        )}
      </main>

      <footer className="border-t py-6 px-4 md:px-6" data-testid="footer">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p data-testid="text-privacy-notice">
            {state.isRtl
              ? 'جميع البيانات تبقى في متصفحك ولا يتم مشاركتها'
              : 'All data stays in your browser and is never shared'}
          </p>
          <p data-testid="text-powered-by">
            {state.isRtl
              ? 'مدعوم بتقنية Google Gemini'
              : 'Powered by Google Gemini'}
          </p>
        </div>
      </footer>
    </div>
  );
}
