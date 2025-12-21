import { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import type { OPAResult } from '@/lib/types';
import { shapeArabicForPdf } from '@/lib/arabic-shaper';

// Use jsDelivr CDN for reliable font loading - bypasses Replit's local file serving issues
// Using TTF format which is more compatible with @react-pdf/renderer
Font.register({
  family: 'Cairo',
  src: 'https://cdn.jsdelivr.net/fontsource/fonts/cairo@latest/arabic-400-normal.ttf'
});

Font.register({
  family: 'Cairo-Bold',
  src: 'https://cdn.jsdelivr.net/fontsource/fonts/cairo@latest/arabic-700-normal.ttf'
});

// Keep PDF JSX readable: shape Arabic so letters connect properly in PDF output.
function tr(text: string, isRtl?: boolean) {
  return isRtl ? shapeArabicForPdf(text) : text;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Cairo',
    fontSize: 12,
    padding: 30,
    backgroundColor: '#FFFFFF',
    direction: 'rtl',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#10B981',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Cairo-Bold',
    color: '#10B981',
    textAlign: 'right',
  },
  headerDate: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'left',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'right',
  },
  sectionContent: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 1.6,
    textAlign: 'right',
  },
  listItem: {
    flexDirection: 'row-reverse',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    width: 20,
    fontSize: 12,
    color: '#10B981',
    textAlign: 'center',
    fontFamily: 'Cairo-Bold',
  },
  listText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 1.5,
    textAlign: 'right',
  },
  scoreSection: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#10B981',
    borderRadius: 8,
    textAlign: 'center',
  },
  scoreTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  scoreValue: {
    fontSize: 36,
    fontFamily: 'Cairo-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  pathItem: {
    flexDirection: 'row-reverse',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  pathNumber: {
    width: 30,
    height: 30,
    backgroundColor: '#3B82F6',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  pathNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Cairo-Bold',
    textAlign: 'center',
    lineHeight: 28,
    marginLeft: 10,
  },
  pathText: {
    flex: 1,
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'right',
  },
  pathBadge: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  badgeText: {
    fontSize: 11,
    color: '#1E40AF',
    textAlign: 'right',
    lineHeight: 1.4,
  },
});

interface SanadReportPDFProps {
  data: OPAResult;
  isRtl: boolean;
}

function SanadReportPDF({ data, isRtl }: SanadReportPDFProps) {
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isRtl ? 'تقرير سند الاحترافي' : 'Sanad Professional Report'}
          </Text>
          <Text style={styles.headerDate}>
            {isRtl ? `تاريخ التقرير: ${currentDate}` : `Report Date: ${currentDate}`}
          </Text>
        </View>

        <View style={styles.scoreSection}>
          <Text style={styles.scoreTitle}>
            {isRtl ? 'مستوى موثوقية النتائج' : 'Results Reliability Score'}
          </Text>
          <Text style={styles.scoreValue}>
            {Math.round(data.reliability_score)}%
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isRtl ? 'نقاط القوة الأساسية' : 'Core Strengths'}
          </Text>
          {data.strengths.map((strength, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{tr(strength, isRtl)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isRtl ? 'الشغف والدوافع' : 'Passion & Motivations'}
          </Text>
          <Text style={styles.sectionContent}>{tr(data.passion, isRtl)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isRtl ? 'المسارات المهنية المقترحة' : 'Recommended Career Paths'}
          </Text>
          {data.career_paths.map((path, index) => (
            <View key={index} style={styles.pathItem}>
              <View style={styles.pathNumber}>
                <Text style={styles.pathNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.pathText}>{tr(path, isRtl)}</Text>
            </View>
          ))}

          <View style={styles.pathBadge}>
            <Text style={styles.badgeText}>
              {isRtl 
                ? 'ملاحظة: هذه المسارات تم تحديدها بناءً على تحليل شامل لإجاباتك وأنماط تفكيرك.'
                : 'Note: These paths are identified based on comprehensive analysis of your answers and thinking patterns.'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isRtl ? 'التوصيات والخطوات التالية' : 'Recommendations & Next Steps'}
          </Text>
          <Text style={styles.sectionContent}>{tr(data.advice, isRtl)}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isRtl 
              ? 'تم إنشاء هذا التقرير بواسطة نظام سند للاستشارات المهنية - جميع الحقوق محفوظة'
              : 'Generated by Sanad Career Consultation System - All Rights Reserved'}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

interface DownloadReportButtonProps {
  data: OPAResult | null;
  isRtl: boolean;
}

export function DownloadReportButton({ data, isRtl }: DownloadReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const buttonLabel = isRtl ? 'تحميل التقرير PDF' : 'Download PDF Report';
  const loadingLabel = isRtl ? 'جاري تجهيز الملف...' : 'Generating PDF...';
  const fileName = isRtl ? 'تقرير-سند.pdf' : 'sanad-report.pdf';
  const errorMessage = isRtl 
    ? 'عذراً، حدث خطأ أثناء تجهيز الملف. يرجى المحاولة مرة أخرى.' 
    : 'Sorry, an error occurred while generating the file. Please try again.';

  const handleDownload = async () => {
    if (!data) return;

    try {
      setIsGenerating(true);

      console.log("Starting PDF generation...");
      const pdfDoc = pdf(<SanadReportPDF data={data} isRtl={isRtl} />);
      console.log("PDF document created, generating blob...");
      const blob = await pdfDoc.toBlob();
      console.log("Blob generated, size:", blob.size);

      saveAs(blob, fileName);
      console.log("PDF saved successfully");

    } catch (error: unknown) {
      console.error("Error generating PDF:", error);
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!data) {
    return (
      <Button disabled data-testid="button-export-pdf">
        <FileDown className="h-4 w-4 me-2" />
        {buttonLabel}
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleDownload} 
      disabled={isGenerating}
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

export { SanadReportPDF };
