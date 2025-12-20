import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target,
  Heart,
  Zap,
  CheckCircle2,
  Circle,
  RefreshCw,
  Clock
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
        title: 'خطة حياتك OPA',
        subtitle: 'نتائج مهندس الحياة',
        exportPdf: 'تحميل التقرير PDF',
        startNew: 'بدء جلسة جديدة',
        outcome: 'النتيجة المطلوبة',
        purpose: 'الغرض العاطفي',
        role: 'هويتك التمكينية',
        musts: 'يجب - MUSTS (أولوية قصوى)',
        shoulds: 'ينبغي - SHOULDS',
        timeZone: 'منطقة الوقت',
        reliabilityScore: 'نسبة التركيز',
        preparedBy: 'تم إعداد هذا بواسطة OPA Life Architect',
        generatedOn: 'تاريخ الإعداد',
      }
    : {
        title: 'Your OPA Life Plan',
        subtitle: 'Life Architect Results',
        exportPdf: 'Download PDF Report',
        startNew: 'Start New Session',
        outcome: 'Your Outcome',
        purpose: 'Your Purpose (The Juice)',
        role: 'Your Empowering Identity',
        musts: 'MUSTS (High Priority)',
        shoulds: 'SHOULDS',
        timeZone: 'Time Zone',
        reliabilityScore: 'Focus Score',
        preparedBy: 'Prepared by OPA Life Architect',
        generatedOn: 'Generated on',
      };

  const currentDate = new Date().toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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

          <Card data-testid="card-outcome">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                {labels.outcome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium" data-testid="text-outcome">
                {result.outcome}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-purpose">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-primary" />
                {labels.purpose}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-purpose">
                {result.purpose}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-role">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary" />
                {labels.role}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="default" className="text-base py-2 px-4" data-testid="badge-role">
                {result.role}
              </Badge>
            </CardContent>
          </Card>

          <Card data-testid="card-musts">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                {labels.musts}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.musts.map((action, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20"
                  data-testid={`must-action-${index}`}
                >
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium" data-testid={`text-must-${index}`}>{action}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {result.shoulds && result.shoulds.length > 0 && (
            <Card data-testid="card-shoulds">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Circle className="h-5 w-5 text-muted-foreground" />
                  {labels.shoulds}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.shoulds.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    data-testid={`should-action-${index}`}
                  >
                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-muted-foreground" data-testid={`text-should-${index}`}>{action}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card data-testid="card-time-zone">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                {labels.timeZone}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge 
                variant={result.time_zone?.toLowerCase().includes('zone') ? 'default' : 'secondary'} 
                className="text-sm py-1 px-3"
                data-testid="badge-time-zone"
              >
                {result.time_zone || 'The Zone'}
              </Badge>
            </CardContent>
          </Card>

          <div className="text-center pt-6 border-t text-xs text-muted-foreground print:block">
            <p>OPA Life Architect - Time of Your Life</p>
            <p>{currentDate}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
