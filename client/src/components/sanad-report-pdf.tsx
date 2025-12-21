import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import type { OPAResult } from '@/lib/types';

interface DownloadReportButtonProps {
  data: OPAResult | null;
  isRtl: boolean;
}

export function DownloadReportButton({ data, isRtl }: DownloadReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const buttonLabel = isRtl ? 'تحميل التقرير PDF' : 'Download PDF Report';
  const loadingLabel = isRtl ? 'جاري تجهيز الملف...' : 'Generating PDF...';
  const fileName = isRtl ? 'تقرير-سند.pdf' : 'sanad-report.pdf';

  const baseErrorMessage = isRtl
    ? 'عذراً، حدث خطأ أثناء تجهيز الملف.'
    : 'Sorry, an error occurred while generating the file.';

  const isEmbedded = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const handleDownload = async () => {
    if (!data) return;

    try {
      setIsGenerating(true);

      const response = await fetch('/api/export-report-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          isRtl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const blob = await response.blob();

      if (isEmbedded) {
        const url = URL.createObjectURL(blob);
        const w = window.open(url, '_blank', 'noopener,noreferrer');
        if (!w) window.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: unknown) {
      const details = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      console.error('PDF Generation Failed:', error);
      alert(`${baseErrorMessage}\n\nتفاصيل التقنية:\n${details}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={!data || isGenerating} data-testid="button-export-pdf">
      {isGenerating ? (
        <Loader2 className="h-4 w-4 me-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 me-2" />
      )}
      {isGenerating ? loadingLabel : buttonLabel}
    </Button>
  );
}
