import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { HeroSection } from '@/components/hero-section';
import { Conversation } from '@/components/conversation';
import { ResultsDisplay } from '@/components/results-display';
import type { AppState, Message, OPAResult } from '@/lib/types';
import { STORAGE_KEYS } from '@/lib/types';
import { APP_CONSTANTS } from '@/lib/constants';
import { clearChatSession } from '@/lib/ai-service';
import { useToast } from '@/hooks/use-toast';

const MOCK_RESULT: OPAResult = {
  status: 'complete',
  strengths: [
    'التفكير الاستراتيجي',
    'القدرة على التحليل العميق',
    'مهارات القيادة الفطرية',
    'التواصل الفعال'
  ],
  passion: 'شغفك الحقيقي يكمن في بناء أنظمة وحلول تغير حياة الناس للأفضل. أنت لا تبحث عن وظيفة عادية، بل عن رسالة تتركها في هذا العالم.',
  career_paths: [
    'المسار الآمن: مدير مشاريع تقنية في شركة كبرى',
    'مسار النمو السريع: مؤسس شركة ناشئة في مجال التقنية',
    'المسار الفريد: مستشار استراتيجي للشركات الناشئة'
  ],
  reliability_score: 87,
  advice: 'استثمر في بناء شبكة علاقاتك المهنية قبل الانتقال. الفرص الكبرى تأتي من الأشخاص وليس من الإعلانات.'
};

export default function Home() {
  const { toast } = useToast();

  // Check for test mode via URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const isTestMode = urlParams.get('test') === 'pdf';

  const [state, setState] = useState<AppState>({
    step: isTestMode ? 'results' : 'welcome',
    messages: [],
    result: isTestMode ? MOCK_RESULT : null,
    isLoading: false,
    isRtl: true,
    language: 'ar',
    currentStage: 'outcome',
    stageProgress: 0,
    decisionData: null,
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

  // Update document direction globally
  useEffect(() => {
    document.documentElement.dir = state.isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = state.language;
  }, [state.isRtl, state.language]);

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
      ? APP_CONSTANTS.GREETING.AR
      : APP_CONSTANTS.GREETING.EN;

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
      title: state.isRtl ? APP_CONSTANTS.LABELS.ERROR_TITLE.AR : APP_CONSTANTS.LABELS.ERROR_TITLE.EN,
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
      className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white dark:from-gray-900 dark:to-gray-950 relative overflow-x-hidden"
      // dir prop removed as we handle it globally now
      data-testid="home-page"
    >
      {/* Beta Corner Ribbon */}
      <div
        className="fixed top-4 z-50"
        style={{ 
          [state.isRtl ? 'left' : 'right']: '-35px',
          transform: state.isRtl ? 'rotate(-45deg)' : 'rotate(45deg)'
        }}
        data-testid="beta-ribbon"
      >
        <div className="bg-primary text-primary-foreground text-xs font-bold py-1.5 px-10 shadow-lg text-center">
          {state.isRtl ? 'تجريبي' : 'Beta'}
        </div>
      </div>

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
            currentStage={state.currentStage}
            onUpdateStage={(stage, progress, decisionData) => {
              setState(prev => ({
                ...prev,
                currentStage: stage,
                stageProgress: progress,
                decisionData: decisionData ?? prev.decisionData,
              }));
            }}
          />
        )}

        {state.step === 'results' && state.result && (
          <ResultsDisplay
            isRtl={state.isRtl}
            result={state.result}
            onRestart={handleRestart}
            decisionData={state.decisionData}
          />
        )}
      </main>

      <footer className="border-t py-6 px-4 md:px-6" data-testid="footer">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p data-testid="text-privacy-notice">
            {state.isRtl
              ? APP_CONSTANTS.LABELS.PRIVACY.AR
              : APP_CONSTANTS.LABELS.PRIVACY.EN}
          </p>
          <p data-testid="text-powered-by">
            {state.isRtl
              ? APP_CONSTANTS.LABELS.POWERED_BY.AR
              : APP_CONSTANTS.LABELS.POWERED_BY.EN}
          </p>
        </div>
      </footer>
    </div>
  );
}
