import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { HeroSection } from '@/components/hero-section';
import { AssessmentForm } from '@/components/assessment-form';
import { Conversation } from '@/components/conversation';
import { ResultsDisplay } from '@/components/results-display';
import { SettingsModal } from '@/components/settings-modal';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AppState, AssessmentData, Message } from '@/lib/types';
import { STORAGE_KEYS } from '@/lib/types';
import { generateFinalAssessment, hasApiKey } from '@/lib/openai';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { toast } = useToast();
  const [state, setState] = useState<AppState>({
    step: 'welcome',
    assessmentData: null,
    messages: [],
    result: null,
    isLoading: false,
    isRtl: false,
    language: 'en',
  });
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [generatingResults, setGeneratingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleStartAssessment = () => {
    if (!hasApiKey()) {
      setSettingsOpen(true);
      toast({
        title: state.isRtl ? 'مفتاح API مطلوب' : 'API Key Required',
        description: state.isRtl 
          ? 'يرجى إدخال مفتاح OpenAI API للمتابعة' 
          : 'Please enter your OpenAI API key to continue',
        variant: 'destructive',
      });
      return;
    }
    setState(prev => ({ ...prev, step: 'assessment' }));
  };

  const handleAssessmentComplete = (data: AssessmentData) => {
    if (!hasApiKey()) {
      setSettingsOpen(true);
      toast({
        title: state.isRtl ? 'مفتاح API مطلوب' : 'API Key Required',
        description: state.isRtl 
          ? 'يرجى إدخال مفتاح OpenAI API للمتابعة' 
          : 'Please enter your OpenAI API key to continue',
        variant: 'destructive',
      });
      return;
    }
    setState(prev => ({
      ...prev,
      assessmentData: data,
      step: 'conversation',
      messages: [],
    }));
  };

  const handleAddMessage = (message: Message) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const handleFinishConversation = async () => {
    if (!state.assessmentData) return;

    if (!hasApiKey()) {
      setSettingsOpen(true);
      toast({
        title: state.isRtl ? 'مفتاح API مطلوب' : 'API Key Required',
        description: state.isRtl 
          ? 'يرجى إدخال مفتاح OpenAI API للمتابعة' 
          : 'Please enter your OpenAI API key to continue',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingResults(true);
    setError(null);
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await generateFinalAssessment(
        state.messages,
        state.assessmentData,
        state.language
      );
      setState(prev => ({
        ...prev,
        result,
        step: 'results',
        isLoading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate results';
      setError(errorMessage);
      toast({
        title: state.isRtl ? 'حدث خطأ' : 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setState(prev => ({ ...prev, isLoading: false }));
    } finally {
      setGeneratingResults(false);
    }
  };

  const handleRestart = () => {
    setState({
      step: 'welcome',
      assessmentData: null,
      messages: [],
      result: null,
      isLoading: false,
      isRtl: state.isRtl,
      language: state.language,
    });
    setError(null);
  };

  const labels = state.isRtl
    ? { generating: 'جاري إنشاء تقريرك المهني...', tryAgain: 'حاول مرة أخرى', errorTitle: 'حدث خطأ' }
    : { generating: 'Generating your career report...', tryAgain: 'Try Again', errorTitle: 'An error occurred' };

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950"
      dir={state.isRtl ? 'rtl' : 'ltr'}
      data-testid="home-page"
    >
      <Header isRtl={state.isRtl} onToggleLanguage={toggleLanguage} />

      <main className="pb-16">
        {state.step === 'welcome' && (
          <HeroSection
            isRtl={state.isRtl}
            onStart={handleStartAssessment}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}

        {state.step === 'assessment' && (
          <AssessmentForm
            isRtl={state.isRtl}
            onComplete={handleAssessmentComplete}
            onBack={() => setState(prev => ({ ...prev, step: 'welcome' }))}
          />
        )}

        {state.step === 'conversation' && state.assessmentData && !generatingResults && (
          <Conversation
            isRtl={state.isRtl}
            messages={state.messages}
            assessmentData={state.assessmentData}
            language={state.language}
            onAddMessage={handleAddMessage}
            onFinish={handleFinishConversation}
          />
        )}

        {generatingResults && (
          <div className="py-32 flex flex-col items-center justify-center gap-4" data-testid="loading-results">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">{labels.generating}</p>
          </div>
        )}

        {error && !generatingResults && state.step === 'conversation' && (
          <div className="max-w-2xl mx-auto py-8 px-4 text-center" data-testid="error-display">
            <div className="p-6 rounded-lg bg-destructive/10 text-destructive">
              <p className="font-medium mb-2">{labels.errorTitle}</p>
              <p className="text-sm mb-4">{error}</p>
              <Button
                onClick={() => setError(null)}
                variant="destructive"
                data-testid="button-dismiss-error"
              >
                {labels.tryAgain}
              </Button>
            </div>
          </div>
        )}

        {state.step === 'results' && state.result && state.assessmentData && (
          <ResultsDisplay
            isRtl={state.isRtl}
            result={state.result}
            assessmentData={state.assessmentData}
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
              ? 'مدعوم بتقنية OpenAI'
              : 'Powered by OpenAI'}
          </p>
        </div>
      </footer>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        isRtl={state.isRtl}
      />
    </div>
  );
}
