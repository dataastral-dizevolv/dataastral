/** RGB tokens for jsPDF — mirrors semantic HSL tokens in `globals.css` (Data Iris light). */
export const IRIS_PDF_RGB = {
  bgPrimary: [240, 246, 252] as const,
  bgSecondary: [255, 255, 255] as const,
  bgTertiary: [235, 243, 251] as const,
  textPrimary: [35, 43, 55] as const,
  textSecondary: [82, 92, 108] as const,
  textMuted: [124, 128, 136] as const,
  accent: [41, 145, 245] as const,
  accentLight: [91, 133, 168] as const,
  border: [212, 222, 234] as const,
  white: [255, 255, 255] as const,
} as const;

export type IrisPdfRgb = (typeof IRIS_PDF_RGB)[keyof typeof IRIS_PDF_RGB];
