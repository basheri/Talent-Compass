import reshaper from 'arabic-persian-reshaper';

/**
 * React-PDF (PDFKit) doesn't perform Arabic shaping (contextual glyph forms)
 * in a reliable way. This helper converts Arabic letters into Presentation Forms
 * so they render connected correctly inside generated PDFs.
 *
 * - No-op for empty strings or strings with no Arabic letters.
 * - Safe: returns original text if anything goes wrong.
 */
export function shapeArabicForPdf(text: string): string {
  if (!text) return text;

  // Arabic blocks (covers Arabic, Arabic Supplement, Arabic Extended-A)
  const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
  if (!hasArabic) return text;

  try {
    // Use Arabic shaper rules (not Persian).
    return reshaper.ArabicShaper.convertArabic(text);
  } catch {
    return text;
  }
}
