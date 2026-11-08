/** Shared category identifiers. These do not change report status or permissions. */
export const REPORT_KINDS = ['broken_pump', 'shortage', 'suspected_contamination', 'sanitation_hygiene', 'other'] as const;
export type ReportKind = typeof REPORT_KINDS[number];
export const reportKindNames: Record<ReportKind, {en: string; bn: string}> = {
  broken_pump: {en: 'Broken water point', bn: 'নলকূপ নষ্ট'},
  shortage: {en: 'Water shortage', bn: 'পানির সংকট'},
  suspected_contamination: {en: 'Water quality concern', bn: 'পানির মান নিয়ে উদ্বেগ'},
  sanitation_hygiene: {en: 'Sanitation / hygiene problem', bn: 'স্যানিটেশন / স্বাস্থ্যবিধির সমস্যা'},
  other: {en: 'Other issue', bn: 'অন্যান্য সমস্যা'},
};
export function reportKindLabel(kind: string | undefined, lang: string = 'en') {
  return reportKindNames[kind as ReportKind]?.[lang === 'bn' ? 'bn' : 'en'] ?? (lang === 'bn' ? 'সমস্যার ধরন অনির্দিষ্ট' : 'Issue category unspecified');
}
