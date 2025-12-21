import { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import type { OPAResult } from '@/lib/types';

/**
 * Arabic shaping for react-pdf:
 * react-pdf doesn't reliably shape Arabic, so we convert letters to presentation forms.
 * This is a lightweight shaper that fixes the "disconnected letters" issue for most Arabic.
 */
function shapeArabicForPdf(input: string): string {
  if (!input) return input;

  // quick exit if no Arabic
  if (!/[\u0600-\u06FF]/.test(input)) return input;

  const isDiacritic = (ch: string) => /[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(ch);

  // [isolated, final, initial, medial]
  const forms: Record<string, [string, string, string, string]> = {
    'ء': ['\uFE80', '\uFE80', '\uFE80', '\uFE80'],
    'آ': ['\uFE81', '\uFE82', '\uFE81', '\uFE82'],
    'أ': ['\uFE83', '\uFE84', '\uFE83', '\uFE84'],
    'ؤ': ['\uFE85', '\uFE86', '\uFE85', '\uFE86'],
    'إ': ['\uFE87', '\uFE88', '\uFE87', '\uFE88'],
    'ئ': ['\uFE89', '\uFE8A', '\uFE8B', '\uFE8C'],
    'ا': ['\uFE8D', '\uFE8E', '\uFE8D', '\uFE8E'],
    'ب': ['\uFE8F', '\uFE90', '\uFE91', '\uFE92'],
    'ة': ['\uFE93', '\uFE94', '\uFE93', '\uFE94'],
    'ت': ['\uFE95', '\uFE96', '\uFE97', '\uFE98'],
    'ث': ['\uFE99', '\uFE9A', '\uFE9B', '\uFE9C'],
    'ج': ['\uFE9D', '\uFE9E', '\uFE9F', '\uFEA0'],
    'ح': ['\uFEA1', '\uFEA2', '\uFEA3', '\uFEA4'],
    'خ': ['\uFEA5', '\uFEA6', '\uFEA7', '\uFEA8'],
    'د': ['\uFEA9', '\uFEAA', '\uFEA9', '\uFEAA'],
    'ذ': ['\uFEAB', '\uFEAC', '\uFEAB', '\uFEAC'],
    'ر': ['\uFEAD', '\uFEAE', '\uFEAD', '\uFEAE'],
    'ز': ['\uFEAF', '\uFEB0', '\uFEAF', '\uFEB0'],
    'س': ['\uFEB1', '\uFEB2', '\uFEB3', '\uFEB4'],
    'ش': ['\uFEB5', '\uFEB6', '\uFEB7', '\uFEB8'],
    'ص': ['\uFEB9', '\uFEBA', '\uFEBB', '\uFEBC'],
    'ض': ['\uFEBD', '\uFEBE', '\uFEBF', '\uFEC0'],
    'ط': ['\uFEC1', '\uFEC2', '\uFEC3', '\uFEC4'],
    'ظ': ['\uFEC5', '\uFEC6', '\uFEC7', '\uFEC8'],
    'ع': ['\uFEC9', '\uFECA', '\uFECB', '\uFECC'],
    'غ': ['\uFECD', '\uFECE', '\uFECF', '\uFED0'],
    'ف': ['\uFED1', '\uFED2', '\uFED3', '\uFED4'],
    'ق': ['\uFED5', '\uFED6', '\uFED7', '\uFED8'],
    'ك': ['\uFED9', '\uFEDA', '\uFEDB', '\uFEDC'],
    'ل': ['\uFEDD', '\uFEDE', '\uFEDF', '\uFEE0'],
    'م': ['\uFEE1', '\uFEE2', '\uFEE3', '\uFEE4'],
    'ن': ['\uFEE5', '\uFEE6', '\uFEE7', '\uFEE8'],
    'ه': ['\uFEE9', '\uFEEA', '\uFEEB', '\uFEEC'],
    'و': ['\uFEED', '\uFEEE', '\uFEED', '\uFEEE'],
    'ى': ['\uFEEF', '\uFEF0', '\uFEEF', '\uFEF0'],
    'ي': ['\uFEF1', '\uFEF2', '\uFEF3', '\uFEF4'],
  };

  const dualJoining = new Set([
    'ب','ت','ث','ج','ح','خ','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','ي','ئ'
  ]);

  const canConnectToPrev = (ch: string) => !!forms[ch] && ch !== 'ء';
  const canConnectToNext = (ch: string) => dualJoining.has(ch);
  const isArabicLetter = (ch: string) => !!forms[ch];

  // Lam-Alef ligatures
  const lamAlefMap: Record<string, { isolated: string; final: string }> = {
    'لا': { isolated: '\uFEFB', final: '\uFEFC' },
    'لأ': { isolated: '\uFEF7', final: '\uFEF8' },
    'لإ': { isolated: '\uFEF9', final: '\uFEFA' },
    'لآ': { isolated: '\uFEF5', final: '\uFEF6' },
  };

  const chars = Array.from(input);

  // build lam-alef tokens
  const tokens: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1] ?? '';
    if (ch === 'ل' && (next === 'ا' || next === 'أ' || next === 'إ' || next === 'آ')) {
      tokens.push(ch + next);
      i++;
      continue;
    }
    tokens.push(ch);
  }

  const prevNonDiacriticIndex = (i: number) => {
    for (let j = i - 1; j >= 0; j--) if (!isDiacritic(tokens[j])) return j;
    return -1;
  };
  const nextNonDiacriticIndex = (i: number) => {
    for (let j = i + 1; j < tokens.length; j++) if (!isDiacritic(tokens[j])) return j;
    return -1;
  };

  const out: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];

    if (tok.length === 1 && isDiacritic(tok)) {
      out.push(tok);
      continue;
    }

    // lam-alef ligature
    if (lamAlefMap[tok]) {
      const pIdx = prevNonDiacriticIndex(i);
      const prevTok = pIdx >= 0 ? tokens[pIdx] : '';
      const prevChar = prevTok.length === 2 ? prevTok[0] : prevTok;

      const connectsPrev =
        !!prevChar &&
        !lamAlefMap[prevTok] &&
        isArabicLetter(prevChar) &&
        canConnectToNext(prevChar);

      out.push(connectsPrev ? lamAlefMap[tok].final : lamAlefMap[tok].isolated);
      continue;
    }

    // non arabic
    if (tok.length !== 1 || !isArabicLetter(tok)) {
      out.push(tok);
      continue;
    }

    const pIdx = prevNonDiacriticIndex(i);
    const nIdx = nextNonDiacriticIndex(i);

    const prevTok = pIdx >= 0 ? tokens[pIdx] : '';
    const nextTok = nIdx >= 0 ? tokens[nIdx] : '';

    const prevChar = prevTok.length === 2 ? prevTok[0] : prevTok;
    const nextChar = nextTok.length === 2 ? nextTok[0] : nextTok;

    const prevIsLetter = prevTok ? (lamAlefMap[prevTok] ? true : isArabicLetter(prevChar)) : false;
    const nextIsLetter = nextTok ? (lamAlefMap[nextTok] ? true : isArabicLetter(nextChar)) : false;

    const prevCanToNext = prevTok ? (!lamAlefMap[prevTok] && canConnectToNext(prevChar)) : false;
    const nextCanToPrev = nextTok ? (lamAlefMap[nextTok] ? true : canConnectToPrev(nextChar)) : false;

    const connectsPrev = prevIsLetter && prevCanToNext && canConnectToPrev(tok);
    const connectsNext = nextIsLetter && canConnectToNext(tok) && nextCanToPrev;

    const [isolated, finalForm, initialForm, medialForm] = forms[tok];

    if (connectsPrev && connectsNext) out.push(medialForm);
    else if (connectsPrev && !connectsNext) out.push(finalForm);
    else if (!connectsPrev && connectsNext) out.push(initialForm);
    else out.push(isolated);
  }

  return out.join('');
}

// Fonts
Font.register({
  family: 'Cairo',
  src: 'https://cdn.jsdelivr.net/fontsource/fonts/cairo@latest/arabic-400-normal.ttf',
});
Font.register({
  family: 'Cairo-Bold',
  src: 'https://cdn.jsdelivr.net/fontsource/fonts/cairo@latest/arabic-700-normal.ttf',
});

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
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#10B981',
    marginBottom: 10,
    textAlign: 'right',
  },
  sectionContent: {
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'right',
    lineHeight: 18,
  },

  // ✅ مهم: react-pdf ما يدعم gap — كانت سبب كسر التوليد
  badgesContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    fontSize: 11,
    marginLeft: 8,
    marginBottom: 8,
  },

  pathItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
  },
  pathNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
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
    lineHeight: 18,
  },
  pathBadge: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    fontSize: 9,
    marginRight: 10,
  },

  adviceBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  adviceTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#10B981',
    marginBottom: 10,
    textAlign: 'right',
  },
  adviceText: {
    fontSize: 13,
    color: '#1F2937',
    textAlign: 'right',
    lineHeight: 22,
  },

  scoreContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  scoreValue: {
    fontSize: 36,
    fontFamily: 'Cairo-Bold',
    color: '#10B981',
    marginLeft: 10,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6B7280',
  },

  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    color: '#9CA3AF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  footerText: {
    marginBottom: 4,
  },
});

interface SanadReportPDFProps {
  data: OPAResult;
  isRtl: boolean;
}

function SanadReportPDF({ data, isRtl }: SanadReportPDFProps) {
  const labels = isRtl
    ? {
        title: 'سند - المستشار الاستراتيجي',
        strengths: 'نقاط القوة',
        passion: 'الشغف والدافع العميق',
        careerPaths: 'المسارات المهنية المقترحة',
        confidenceScore: 'نسبة الثقة',
        advice: 'النصيحة الاستراتيجية',
        footer: 'تم إنشاء هذا التقرير بواسطة سند - المستشار الاستراتيجي',
        methodology: 'Elite Strategic Career Consultant',
        generatedOn: 'تاريخ الإعداد',
        safe: 'آمن',
        growth: 'نمو',
        unique: 'فريد',
      }
    : {
        title: 'Sanad - Elite Strategic Consultant',
        strengths: 'Your Strengths',
        passion: 'Your Deep Passion & Drive',
        careerPaths: 'Recommended Career Paths',
        confidenceScore: 'Confidence Score',
        advice: 'Strategic Advice',
        footer: 'This report was generated by Sanad - Elite Strategic Consultant',
        methodology: 'Elite Strategic Career Consultant',
        generatedOn: 'Generated on',
        safe: 'Safe',
        growth: 'Growth',
        unique: 'Unique',
      };

  const t = (s: string) => (isRtl ? shapeArabicForPdf(s) : s);

  const currentDate = new Date().toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getPathLabel = (index: number) => {
    switch (index) {
      case 0:
        return labels.safe;
      case 1:
        return labels.growth;
      default:
        return labels.unique;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t(labels.title)}</Text>
          <Text style={styles.headerDate}>
            {t(labels.generatedOn)}: {currentDate}
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreValue}>{Math.round(data.reliability_score)}%</Text>
          <Text style={styles.scoreLabel}>{t(labels.confidenceScore)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(labels.strengths)}</Text>
          <View style={styles.badgesContainer}>
            {data.strengths.map((strength, index) => (
              <Text key={index} style={styles.badge}>
                {t(strength)}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(labels.passion)}</Text>
          <Text style={styles.sectionContent}>{t(data.passion)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(labels.careerPaths)}</Text>
          {data.career_paths.map((path, index) => (
            <View key={index} style={styles.pathItem}>
              <Text style={styles.pathNumber}>{index + 1}</Text>
              <Text style={styles.pathText}>{t(path)}</Text>
              <Text style={styles.pathBadge}>{t(getPathLabel(index))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.adviceBox}>
          <Text style={styles.adviceTitle}>{t(labels.advice)}</Text>
          <Text style={styles.adviceText}>{t(data.advice)}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t(labels.footer)}</Text>
          <Text style={styles.footerText}>{labels.methodology}</Text>
          <Text>{currentDate}</Text>
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

      const pdfDoc = pdf(<SanadReportPDF data={data} isRtl={isRtl} />);
      const blob = await pdfDoc.toBlob();

      // ✅ حل Replit embedded: التحميل المباشر قد يفشل داخل iframe
      // نفتح الـ PDF في تبويب جديد (المستخدم يقدر ينزّله من عارض الـ PDF)
      if (isEmbedded) {
        const url = URL.createObjectURL(blob);
        const w = window.open(url, '_blank', 'noopener,noreferrer');
        if (!w) window.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return;
      }

      // خارج iframe: تحميل طبيعي
      saveAs(blob, fileName);
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

export { SanadReportPDF };
