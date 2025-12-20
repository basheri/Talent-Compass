import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileDown, 
  Loader2, 
  Star, 
  Heart, 
  Briefcase,
  RefreshCw,
  Target
} from 'lucide-react';
import type { MisbarResult } from '@/lib/types';

interface ResultsDisplayProps {
  isRtl: boolean;
  result: MisbarResult;
  onRestart: () => void;
}

export function ResultsDisplay({ isRtl, result, onRestart }: ResultsDisplayProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const labels = isRtl
    ? {
        title: 'تقريرك المهني',
        subtitle: 'نتائج تحليل مسبار',
        exportPdf: 'تحميل PDF',
        startNew: 'بدء محادثة جديدة',
        strengths: 'نقاط القوة',
        passion: 'الشغف',
        careerPaths: 'المسارات المهنية المقترحة',
        reliabilityScore: 'نسبة الموثوقية',
        preparedBy: 'تم إعداد هذا التقرير بواسطة مسبار',
        generatedOn: 'تاريخ الإعداد',
      }
    : {
        title: 'Your Career Report',
        subtitle: 'Misbar Analysis Results',
        exportPdf: 'Download PDF',
        startNew: 'Start New Journey',
        strengths: 'Your Strengths',
        passion: 'Your Passion',
        careerPaths: 'Suggested Career Paths',
        reliabilityScore: 'Reliability Score',
        preparedBy: 'This report was prepared by Misbar',
        generatedOn: 'Generated on',
      };

  const handleExportPdf = async () => {
    if (!reportRef.current) return;

    setIsExporting(true);

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;
      
      if (typeof html2pdf !== 'function') {
        throw new Error('PDF library not available');
      }
      
      const element = reportRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `misbar-career-report.pdf`,
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

          <Card data-testid="card-strengths">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-primary" />
                {labels.strengths}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.strengths.map((strength, index) => (
                  <Badge key={index} variant="secondary" className="text-sm py-1 px-3" data-testid={`badge-strength-${index}`}>
                    {strength}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-career-paths">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-primary" />
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
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium" data-testid={`text-career-path-${index}`}>{path}</h3>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="text-center pt-6 border-t text-xs text-muted-foreground print:block">
            <p>مسبار - Misbar Career Discovery</p>
            <p>{currentDate}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
