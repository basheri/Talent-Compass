import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Star,
  Heart,
  Compass,
  Lightbulb,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import type { OPAResult } from '@/lib/types';
import { DownloadReportButton } from './sanad-report-pdf';

interface ResultsDisplayProps {
  isRtl: boolean;
  result: OPAResult;
  onRestart: () => void;
}

export function ResultsDisplay({ isRtl, result, onRestart }: ResultsDisplayProps) {
  const labels = isRtl
    ? {
        title: 'تحليلك الاستراتيجي',
        subtitle: 'نتائج المستشار الاستراتيجي',
        exportPdf: 'تحميل التقرير PDF',
        startNew: 'بدء جلسة جديدة',
        strengths: 'نقاط القوة',
        passion: 'الشغف والدافع العميق',
        careerPaths: 'المسارات المهنية المقترحة',
        advice: 'النصيحة الاستراتيجية',
        reliabilityScore: 'نسبة الثقة',
        preparedBy: 'تم إعداد هذا بواسطة سند - المستشار الاستراتيجي',
        generatedOn: 'تاريخ الإعداد',
        safeRoute: 'المسار الآمن',
        aggressiveRoute: 'مسار النمو السريع',
        blueOcean: 'المسار الفريد',
      }
    : {
        title: 'Your Strategic Analysis',
        subtitle: 'Elite Career Consultant Results',
        exportPdf: 'Download PDF Report',
        startNew: 'Start New Session',
        strengths: 'Your Strengths',
        passion: 'Your Deep Passion & Drive',
        careerPaths: 'Recommended Career Paths',
        advice: 'Strategic Advice',
        reliabilityScore: 'Confidence Score',
        preparedBy: 'Prepared by Sanad - Elite Strategic Consultant',
        generatedOn: 'Generated on',
        safeRoute: 'Safe Route',
        aggressiveRoute: 'Aggressive Growth',
        blueOcean: 'Blue Ocean Niche',
      };

  const currentDate = new Date().toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getPathIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Compass className="h-5 w-5" />;
      case 1:
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const getPathVariant = (index: number): 'default' | 'secondary' | 'outline' => {
    switch (index) {
      case 0:
        return 'secondary';
      case 1:
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <section className="py-8 px-4 md:px-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold" data-testid="text-results-title">{labels.title}</h1>
            <p className="text-muted-foreground" data-testid="text-results-subtitle">{labels.subtitle}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={onRestart}
              data-testid="button-restart"
            >
              <RefreshCw className="h-4 w-4 me-2" />
              {labels.startNew}
            </Button>
            <DownloadReportButton data={result} isRtl={isRtl} />
          </div>
        </div>

        <div 
          className="space-y-6 bg-background p-6" 
          data-testid="report-content"
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        >
          <div className="text-center pb-4 border-b print:block">
            <h1 className="text-2xl font-bold">{labels.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {labels.preparedBy} | {labels.generatedOn}: {currentDate}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 py-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary" data-testid="text-reliability-score">
                {result.reliability_score}%
              </div>
              <p className="text-sm text-muted-foreground">{labels.reliabilityScore}</p>
            </div>
            <Progress value={result.reliability_score} className="w-32 h-3" />
          </div>

          <Card data-testid="card-strengths">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-primary" />
                {labels.strengths}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {result.strengths.map((strength, index) => (
                <Badge 
                  key={index} 
                  variant="default" 
                  className="text-sm py-1 px-3"
                  data-testid={`badge-strength-${index}`}
                >
                  {strength}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card data-testid="card-passion">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-primary" />
                {labels.passion}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-passion">
                {result.passion}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-career-paths">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Compass className="h-5 w-5 text-primary" />
                {labels.careerPaths}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.career_paths.map((path, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-lg bg-muted/50"
                  data-testid={`career-path-${index}`}
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {getPathIcon(index)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium" data-testid={`text-path-${index}`}>{path}</p>
                  </div>
                  <Badge variant={getPathVariant(index)} className="text-xs">
                    {index === 0 ? (isRtl ? 'آمن' : 'Safe') : 
                     index === 1 ? (isRtl ? 'نمو' : 'Growth') : 
                     (isRtl ? 'فريد' : 'Unique')}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card data-testid="card-advice" className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-primary" />
                {labels.advice}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium leading-relaxed" data-testid="text-advice">
                {result.advice}
              </p>
            </CardContent>
          </Card>

          <div className="text-center pt-6 border-t text-xs text-muted-foreground print:block">
            <p>Sanad - Elite Strategic Career Consultant</p>
            <p>{currentDate}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
