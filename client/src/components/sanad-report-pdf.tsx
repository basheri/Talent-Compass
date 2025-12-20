import { Document, Page, Text, View, StyleSheet, Font, PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import type { OPAResult } from '@/lib/types';

Font.register({
  family: 'Cairo',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpcWmhzfH5lWWgcQyyS4J0.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpcWmhzfH5l92gcQyyS4J0.ttf', fontWeight: 'bold' }
  ]
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
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 10,
    textAlign: 'right',
  },
  sectionContent: {
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'right',
    lineHeight: 1.6,
  },
  badgesContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    fontSize: 11,
  },
  roleBadge: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 'bold',
    alignSelf: 'flex-end',
  },
  actionItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
  },
  actionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
    marginLeft: 10,
  },
  actionText: {
    flex: 1,
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'right',
  },
  shouldItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 6,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    marginLeft: 10,
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
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 10,
    textAlign: 'right',
  },
  adviceText: {
    fontSize: 13,
    color: '#1F2937',
    textAlign: 'right',
    lineHeight: 1.8,
    fontStyle: 'italic',
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
    fontWeight: 'bold',
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
        title: 'سند - مهندس الحياة',
        outcome: 'النتيجة المطلوبة',
        purpose: 'المحرك الداخلي والشغف',
        role: 'هويتك التمكينية',
        musts: 'يجب - MUSTS (أولوية قصوى)',
        shoulds: 'ينبغي - SHOULDS',
        timeZone: 'منطقة الوقت',
        focusScore: 'نسبة التركيز',
        advice: 'همسة سند',
        adviceContent: 'تذكر: النجاح ليس وجهة، بل رحلة مستمرة. ابدأ الآن بخطوة صغيرة، واستمر في التقدم. أنت قادر على تحقيق ما تريد.',
        footer: 'تم إنشاء هذا التقرير بواسطة سند - مهندس الحياة',
        methodology: 'مستوحى من منهجية Time of Your Life - Anthony Robbins',
        generatedOn: 'تاريخ الإعداد',
      }
    : {
        title: 'Sanad - Life Architect',
        outcome: 'Your Outcome',
        purpose: 'Your Internal Driver & Passion',
        role: 'Your Empowering Identity',
        musts: 'MUSTS (High Priority)',
        shoulds: 'SHOULDS',
        timeZone: 'Time Zone',
        focusScore: 'Focus Score',
        advice: "Sanad's Golden Advice",
        adviceContent: 'Remember: Success is not a destination, but a continuous journey. Start now with one small step, and keep moving forward. You are capable of achieving what you want.',
        footer: 'This report was generated by Sanad - Life Architect',
        methodology: 'Inspired by Time of Your Life methodology - Anthony Robbins',
        generatedOn: 'Generated on',
      };

  const currentDate = new Date().toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{labels.title}</Text>
          <Text style={styles.headerDate}>{labels.generatedOn}: {currentDate}</Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreValue}>{data.reliability_score}%</Text>
          <Text style={styles.scoreLabel}>{labels.focusScore}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.outcome}</Text>
          <Text style={styles.sectionContent}>{data.outcome || (isRtl ? 'هدف طموح' : 'Ambitious Goal')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.purpose}</Text>
          <Text style={styles.sectionContent}>{data.purpose || (isRtl ? 'تحقيق الذات' : 'Self-actualization')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.role}</Text>
          <View style={styles.badgesContainer}>
            <Text style={styles.roleBadge}>{data.role || (isRtl ? 'قائد التغيير' : 'Change Leader')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.musts}</Text>
          {(data.musts && data.musts.length > 0 ? data.musts : [isRtl ? 'خطوة أولى مهمة' : 'First important step']).map((action, index) => (
            <View key={index} style={styles.actionItem}>
              <Text style={styles.actionNumber}>{index + 1}</Text>
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}
        </View>

        {data.shoulds && data.shoulds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{labels.shoulds}</Text>
            {data.shoulds.map((action, index) => (
              <View key={index} style={styles.shouldItem}>
                <View style={styles.bullet} />
                <Text style={styles.actionText}>{action}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.timeZone}</Text>
          <View style={styles.badgesContainer}>
            <Text style={styles.badge}>{data.time_zone || 'The Zone'}</Text>
          </View>
        </View>

        <View style={styles.adviceBox}>
          <Text style={styles.adviceTitle}>{labels.advice}</Text>
          <Text style={styles.adviceText}>{labels.adviceContent}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{labels.footer}</Text>
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
  const buttonLabel = isRtl ? 'تحميل التقرير PDF' : 'Download PDF Report';
  const fileName = isRtl ? 'تقرير-سند.pdf' : 'sanad-report.pdf';

  if (!data) {
    return (
      <Button disabled data-testid="button-export-pdf">
        <FileDown className="h-4 w-4 me-2" />
        {buttonLabel}
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={<SanadReportPDF data={data} isRtl={isRtl} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <Button disabled={loading} data-testid="button-export-pdf">
          {loading ? (
            <Loader2 className="h-4 w-4 me-2 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 me-2" />
          )}
          {buttonLabel}
        </Button>
      )}
    </PDFDownloadLink>
  );
}

export { SanadReportPDF };
