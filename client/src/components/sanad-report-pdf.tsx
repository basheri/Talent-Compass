import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import type { OPAResult } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface DownloadReportButtonProps {
  data: OPAResult | null;
  isRtl: boolean;
}

export function DownloadReportButton({ data, isRtl }: DownloadReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const buttonLabel = isRtl ? 'تحميل التقرير PDF' : 'Download PDF Report';
  const loadingLabel = isRtl ? 'جاري تجهيز الملف...' : 'Generating PDF...';

  const handleDownload = async () => {
    if (!data) return;

    try {
      setIsGenerating(true);

      const response = await fetch('/api/export-report-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, isRtl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Open PDF in new tab (works better in iframe/Replit environment)
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      
      if (!newWindow) {
        // Fallback: trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = isRtl ? 'تقرير-سند.pdf' : 'sanad-report.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Clean up blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 60000);

      toast({
        title: isRtl ? 'تم توليد التقرير' : 'Report Generated',
        description: isRtl 
          ? 'تم فتح التقرير في نافذة جديدة' 
          : 'Report opened in a new window',
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('PDF Generation Failed:', error);
      
      toast({
        title: isRtl ? 'خطأ' : 'Error',
        description: isRtl 
          ? `حدث خطأ أثناء توليد التقرير: ${errorMessage}` 
          : `Failed to generate report: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={handleDownload} 
      disabled={!data || isGenerating} 
      data-testid="button-export-pdf"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 me-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 me-2" />
      )}
      {isGenerating ? loadingLabel : buttonLabel}
    </Button>
  );
}
