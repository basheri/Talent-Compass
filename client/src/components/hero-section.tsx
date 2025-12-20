import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Sparkles, Target, TrendingUp } from 'lucide-react';
import { hasApiKey } from '@/lib/openai';

interface HeroSectionProps {
  isRtl: boolean;
  onStart: () => void;
  onOpenSettings: () => void;
}

export function HeroSection({ isRtl, onStart, onOpenSettings }: HeroSectionProps) {
  const hasKey = hasApiKey();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const content = isRtl
    ? {
        badge: 'مدعوم بالذكاء الاصطناعي',
        title: 'اكتشف مسارك المهني',
        titleHighlight: 'ومواهبك الخفية',
        description: 'احصل على تحليل شخصي شامل لمهاراتك واهتماماتك واكتشف المسارات المهنية التي تناسبك. صدّر تقريرك المهني بصيغة PDF.',
        ctaStart: 'ابدأ الآن',
        ctaSettings: 'أدخل مفتاح API أولاً',
        features: [
          { icon: Sparkles, text: 'تحليل ذكي للمهارات' },
          { icon: Target, text: 'اقتراحات مهنية دقيقة' },
          { icon: TrendingUp, text: 'خطوات عملية للنمو' },
        ],
      }
    : {
        badge: 'AI-Powered Analysis',
        title: 'Discover Your Career Path',
        titleHighlight: '& Hidden Talents',
        description: 'Get a comprehensive, personalized analysis of your skills and interests. Uncover career paths that align with your unique potential and export professional PDF reports.',
        ctaStart: 'Start Discovery',
        ctaSettings: 'Enter API Key First',
        features: [
          { icon: Sparkles, text: 'Smart Skills Analysis' },
          { icon: Target, text: 'Precise Career Suggestions' },
          { icon: TrendingUp, text: 'Actionable Growth Steps' },
        ],
      };

  return (
    <section 
      className="py-16 md:py-24 px-4 md:px-6"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          {content.badge}
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
          {content.title}
          <br />
          <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            {content.titleHighlight}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {content.description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {hasKey ? (
            <Button
              size="lg"
              onClick={onStart}
              className="text-base px-8"
              data-testid="button-start-discovery"
            >
              {content.ctaStart}
              <ArrowIcon className="h-5 w-5 ms-2" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={onOpenSettings}
              variant="outline"
              className="text-base px-8"
              data-testid="button-open-settings"
            >
              {content.ctaSettings}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-8">
          {content.features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <feature.icon className="h-4 w-4 text-primary" />
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
