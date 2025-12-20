import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileDown, 
  Loader2, 
  Star, 
  Sparkles, 
  TrendingUp, 
  Target, 
  BookOpen,
  RefreshCw,
  ArrowUp,
  Briefcase
} from 'lucide-react';
import type { AssessmentResult, AssessmentData } from '@/lib/types';

interface ResultsDisplayProps {
  isRtl: boolean;
  result: AssessmentResult;
  assessmentData: AssessmentData;
  onRestart: () => void;
}

export function ResultsDisplay({ isRtl, result, assessmentData, onRestart }: ResultsDisplayProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const labels = isRtl
    ? {
        title: 'نتائج التحليل المهني',
        subtitle: 'تقريرك الشخصي المفصل',
        exportPdf: 'تصدير كـ PDF',
        startNew: 'بدء تقييم جديد',
        summary: 'ملخص التحليل',
        strengths: 'نقاط القوة',
        talents: 'المواهب المكتشفة',
        careerSuggestions: 'المسارات المهنية المقترحة',
        matchScore: 'نسبة التوافق',
        requiredSkills: 'المهارات المطلوبة',
        growthPotential: 'إمكانية النمو',
        nextSteps: 'الخطوات التالية',
        developmentAreas: 'مجالات التطوير',
        resources: 'موارد موصى بها',
        high: 'عالي',
        medium: 'متوسط',
        low: 'منخفض',
        preparedFor: 'تم إعداد هذا التقرير لـ',
        generatedOn: 'تاريخ الإعداد',
      }
    : {
        title: 'Career Analysis Results',
        subtitle: 'Your Personalized Assessment Report',
        exportPdf: 'Export as PDF',
        startNew: 'Start New Assessment',
        summary: 'Analysis Summary',
        strengths: 'Your Strengths',
        talents: 'Discovered Talents',
        careerSuggestions: 'Suggested Career Paths',
        matchScore: 'Match Score',
        requiredSkills: 'Required Skills',
        growthPotential: 'Growth Potential',
        nextSteps: 'Next Steps',
        developmentAreas: 'Development Areas',
        resources: 'Recommended Resources',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        preparedFor: 'Prepared for',
        generatedOn: 'Generated on',
      };

  const getGrowthLabel = (growth: string) => {
    if (growth === 'High') return labels.high;
    if (growth === 'Medium') return labels.medium;
    return labels.low;
  };

  const getGrowthColor = (growth: string) => {
    if (growth === 'High') return 'bg-green-500/10 text-green-600 dark:text-green-400';
    if (growth === 'Medium') return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
    return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
  };

  const handleExportPdf = async () => {
    if (!reportRef.current) return;

    setIsExporting(true);

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;
      
      const element = reportRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `career-assessment-${assessmentData.name.replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const currentDate = new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
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
            <Button
              onClick={handleExportPdf}
              disabled={isExporting}
              data-testid="button-export-pdf"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 me-2" />
              )}
              {labels.exportPdf}
            </Button>
          </div>
        </div>

        <div 
          ref={reportRef} 
          className="space-y-6 bg-background" 
          data-testid="report-content"
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        >
          <div className="hidden print:block text-center pb-4 border-b">
            <h1 className="text-2xl font-bold">{labels.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {labels.preparedFor}: {assessmentData.name} | {labels.generatedOn}: {currentDate}
            </p>
          </div>

          <Card data-testid="card-summary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {labels.summary}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-summary">
                {result.summary}
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card data-testid="card-strengths">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-primary" />
                  {labels.strengths}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2" data-testid={`text-strength-${index}`}>
                      <span className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-talents">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {labels.talents}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.talents.map((talent, index) => (
                    <Badge key={index} variant="secondary" data-testid={`badge-talent-${index}`}>
                      {talent}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-career-suggestions">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                {labels.careerSuggestions}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.careerSuggestions.map((career, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-muted/50 space-y-4"
                  data-testid={`career-suggestion-${index}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="font-semibold text-lg" data-testid={`text-career-title-${index}`}>{career.title}</h3>
                    <div className="flex items-center gap-3">
                      <Badge className={getGrowthColor(career.growthPotential)} data-testid={`badge-growth-${index}`}>
                        <TrendingUp className="h-3 w-3 me-1" />
                        {getGrowthLabel(career.growthPotential)}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground" data-testid={`text-career-description-${index}`}>{career.description}</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{labels.matchScore}</span>
                      <span className="font-semibold" data-testid={`text-match-score-${index}`}>{career.matchScore}%</span>
                    </div>
                    <Progress value={career.matchScore} className="h-2" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <h4 className="text-sm font-medium mb-2">{labels.requiredSkills}</h4>
                      <div className="flex flex-wrap gap-1">
                        {career.requiredSkills.map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-xs" data-testid={`badge-skill-${index}-${i}`}>
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">{labels.nextSteps}</h4>
                      <ul className="space-y-1">
                        {career.nextSteps.map((step, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1" data-testid={`text-next-step-${index}-${i}`}>
                            <span className="text-primary mt-0.5">
                              {i + 1}.
                            </span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card data-testid="card-development-areas">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ArrowUp className="h-5 w-5 text-primary" />
                  {labels.developmentAreas}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.developmentAreas.map((area, index) => (
                    <li key={index} className="flex items-start gap-2" data-testid={`text-development-area-${index}`}>
                      <Target className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-resources">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {labels.resources}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.recommendedResources.map((resource, index) => (
                    <li key={index} className="flex items-start gap-2" data-testid={`text-resource-${index}`}>
                      <span className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-sm">{resource}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="print:block hidden text-center pt-6 border-t text-xs text-muted-foreground">
            <p>Career & Talent Discovery - AI-Powered Assessment</p>
            <p>{currentDate}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
