import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Compass, MessageCircle, FileText } from 'lucide-react';
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
        badge: 'مستشارك المهني السعودي',
        title: 'مسبار',
        titleHighlight: 'اكتشف شغفك ومواهبك',
        description: 'حياك الله! أنا مسبار، مستشارك المهني بالذكاء الاصطناعي. راح نتكلم سوا عشان نكتشف نقاط قوتك وشغفك، وبعدين نطلع لك تقرير مهني احترافي.',
        ctaStart: 'ابدأ الرحلة',
        ctaSettings: 'أدخل مفتاح API أولاً',
        features: [
          { icon: MessageCircle, text: 'محادثة ذكية' },
          { icon: Compass, text: 'اكتشاف الشغف' },
          { icon: FileText, text: 'تقرير PDF' },
        ],
      }
    : {
        badge: 'Your AI Career Coach',
        title: 'Misbar',
        titleHighlight: 'Discover Your Passion & Strengths',
        description: "Hello! I'm Misbar, your AI career coach. Let's have a conversation to discover your strengths and passion, then I'll generate a professional career report for you.",
        ctaStart: 'Start Journey',
        ctaSettings: 'Enter API Key First',
        features: [
          { icon: MessageCircle, text: 'Smart Conversation' },
          { icon: Compass, text: 'Passion Discovery' },
          { icon: FileText, text: 'PDF Report' },
        ],
      };

  return (
    <section 
      className="py-16 md:py-24 px-4 md:px-6"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Compass className="h-4 w-4" />
          {content.badge}
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
          <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
            {content.title}
          </span>
          <br />
          <span className="text-2xl md:text-3xl lg:text-4xl text-foreground mt-2 block">
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
              data-testid="button-start-journey"
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
