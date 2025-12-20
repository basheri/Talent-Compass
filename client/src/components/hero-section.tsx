import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Zap, Target, FileText } from 'lucide-react';

interface HeroSectionProps {
  isRtl: boolean;
  onStart: () => void;
}

export function HeroSection({ isRtl, onStart }: HeroSectionProps) {
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const content = isRtl
    ? {
        badge: 'سند - مهندس الحياة | منهجية أنتوني روبنز',
        title: 'سند',
        titleHighlight: 'حياتك... ليست قائمة مهام',
        description: 'مرحبا! أنا سند، مهندس حياتك. سنحول أفكارك المتناثرة إلى خطة حياة واضحة باستخدام منهجية O.P.A. - النتيجة، الغرض، الإجراء. هل أنت مستعد لتحويل حياتك؟',
        ctaStart: 'ابدأ الآن',
        features: [
          { icon: Target, text: 'نتائج واضحة' },
          { icon: Zap, text: 'طاقة وتحفيز' },
          { icon: FileText, text: 'خطة عمل PDF' },
        ],
      }
    : {
        badge: 'Sanad - Life Architect | Tony Robbins Methodology',
        title: 'Sanad',
        titleHighlight: 'Your Life... Not a To-Do List',
        description: "Hello! I'm Sanad, your Life Architect. We'll transform your scattered ideas into a clear life plan using the O.P.A. methodology - Outcome, Purpose, Action. Ready to transform your life?",
        ctaStart: 'Start Now',
        features: [
          { icon: Target, text: 'Clear Outcomes' },
          { icon: Zap, text: 'Energy & Drive' },
          { icon: FileText, text: 'Action Plan PDF' },
        ],
      };

  return (
    <section 
      className="py-16 md:py-24 px-4 md:px-6"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Zap className="h-4 w-4" />
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
          <Button
            size="lg"
            onClick={onStart}
            className="text-base px-8"
            data-testid="button-start-journey"
          >
            {content.ctaStart}
            <ArrowIcon className="h-5 w-5 ms-2" />
          </Button>
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
