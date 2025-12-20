import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { HeroSection } from '@/components/hero-section';
import { Conversation } from '@/components/conversation';
import { ResultsDisplay } from '@/components/results-display';
import { SettingsModal } from '@/components/settings-modal';
import type { AppState, Message, MisbarResult } from '@/lib/types';
import { STORAGE_KEYS } from '@/lib/types';
import { hasApiKey, clearChatSession } from '@/lib/ai-service';
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
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyReady, setApiKeyReady] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as 'en' | 'ar' | null;
    if (savedLanguage) {
      setState(prev => ({
        ...prev,
        language: savedLanguage,
        isRtl: savedLanguage === 'ar',
      }));
    }
    setApiKeyReady(hasApiKey());
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
    if (!hasApiKey()) {
      setShowSettings(true);
      return;
    }

    const initialGreeting = state.isRtl
      ? 'حياك الله! أنا سند، مستشارك المهني. خلنا نتعرف عليك أكثر عشان نكتشف نقاط قوتك وشغفك. بداية، من الشخصيات اللي كنت تعجب فيها وأنت صغير؟ ممكن تكون شخصية حقيقية أو خيالية.'
      : "Hello! I'm Sanad, your career coach. Let's get to know you better to discover your strengths and passion. To start, who were the people you admired when you were growing up? They could be real or fictional.";

    const initialMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: initialGreeting,
      timestamp: new Date(),
    };

    clearChatSession();
    setState(prev => ({ ...prev, step: 'conversation', messages: [initialMessage] }));
  };

  const handleApiKeySet = () => {
    setApiKeyReady(true);
    handleStartJourney();
  };

  const handleAddMessage = (message: Message) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const handleComplete = (result: MisbarResult) => {
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
        onOpenSettings={() => setShowSettings(true)}
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

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isRtl={state.isRtl}
        onApiKeySet={handleApiKeySet}
      />
    </div>
  );
}
