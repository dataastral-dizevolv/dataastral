import type { jsPDF } from "jspdf";

import { EVENT_TYPE_COLORS } from "@/lib/theme/event-colors";
import type { EphemerisEvent } from "@/types/dashboard";

import { IRIS_PDF_RGB } from "./iris-brand";

export interface InsightPdfInput {
  dataFormatada: string;
  temaInsight: string;
  previsao: string;
  eventos: EphemerisEvent[];
  fileDate: string;
}

const PAGE = {
  margin: 48,
  footerHeight: 36,
  headerHeight: 108,
} as const;

async function loadImageDataUrl(path: string): Promise<string | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Falha ao ler imagem"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function setFill(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function setDraw(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

function setText(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function drawPageBackground(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  setFill(doc, IRIS_PDF_RGB.bgPrimary);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  setFill(doc, IRIS_PDF_RGB.bgSecondary);
  doc.roundedRect(PAGE.margin - 12, PAGE.margin - 12, pageWidth - PAGE.margin * 2 + 24, pageHeight - PAGE.margin * 2 + 12, 10, 10, "F");
}

function drawHeader(doc: jsPDF, logoDataUrl: string | null, input: InsightPdfInput) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = PAGE.margin;
  const accentBarY = PAGE.margin + 4;

  setFill(doc, IRIS_PDF_RGB.accent);
  doc.roundedRect(left, accentBarY, pageWidth - PAGE.margin * 2, 4, 2, 2, "F");

  const brandY = accentBarY + 22;

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", left, brandY - 6, 28, 28);
  }

  setText(doc, IRIS_PDF_RGB.textPrimary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DATA IRIS", left + (logoDataUrl ? 36 : 0), brandY + 8);

  setText(doc, IRIS_PDF_RGB.textMuted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Insight astrológico personalizado", left + (logoDataUrl ? 36 : 0), brandY + 22);

  setText(doc, IRIS_PDF_RGB.textPrimary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("Insight Diário", left, brandY + 54);

  setText(doc, IRIS_PDF_RGB.textSecondary);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${input.dataFormatada} · ${input.temaInsight}`, left, brandY + 74);

  setDraw(doc, IRIS_PDF_RGB.border);
  doc.setLineWidth(0.75);
  doc.line(left, brandY + 86, pageWidth - PAGE.margin, brandY + 86);

  return brandY + 98;
}

function drawEventBadges(doc: jsPDF, eventos: EphemerisEvent[], startY: number, contentWidth: number) {
  if (eventos.length === 0) {
    return startY;
  }

  const left = PAGE.margin;
  let cursorX = left;
  let cursorY = startY;
  const rowHeight = 22;
  const gap = 8;

  setText(doc, IRIS_PDF_RGB.textMuted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("EVENTOS DO DIA", left, cursorY);
  cursorY += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  for (const evento of eventos) {
    const palette = EVENT_TYPE_COLORS[evento.tipo];
    const label = evento.titulo;
    const badgeWidth = Math.min(contentWidth, doc.getTextWidth(label) + 22);

    if (cursorX + badgeWidth > left + contentWidth) {
      cursorX = left;
      cursorY += rowHeight + 4;
    }

    const rgb = hexToRgb(palette.primary);
    setFill(doc, rgb);
    doc.roundedRect(cursorX, cursorY - 10, badgeWidth, 18, 9, 9, "F");

    setText(doc, IRIS_PDF_RGB.white);
    doc.text(label, cursorX + 11, cursorY + 2, { maxWidth: badgeWidth - 16 });

    cursorX += badgeWidth + gap;
  }

  return cursorY + rowHeight + 8;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function drawFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const footerY = doc.internal.pageSize.getHeight() - PAGE.footerHeight;

  setDraw(doc, IRIS_PDF_RGB.border);
  doc.setLineWidth(0.5);
  doc.line(PAGE.margin, footerY, pageWidth - PAGE.margin, footerY);

  setText(doc, IRIS_PDF_RGB.textMuted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Gerado em Data Iris · datairis.com.br", PAGE.margin, footerY + 16);
  doc.text(`${pageNumber} / ${totalPages}`, pageWidth - PAGE.margin, footerY + 16, { align: "right" });
}

function paginateBody(doc: jsPDF, previsao: string, startY: number, contentWidth: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomLimit = pageHeight - PAGE.footerHeight - 12;
  const lineHeight = 17;
  const paragraphs = previsao.split(/\n+/).map((part) => part.trim()).filter(Boolean);

  setText(doc, IRIS_PDF_RGB.textPrimary);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  let cursorY = startY;

  for (const paragraph of paragraphs.length > 0 ? paragraphs : [previsao]) {
    const lines = doc.splitTextToSize(paragraph, contentWidth) as string[];

    for (const line of lines) {
      if (cursorY + lineHeight > bottomLimit) {
        doc.addPage();
        drawPageBackground(doc);
        cursorY = PAGE.margin + 16;
        setText(doc, IRIS_PDF_RGB.textPrimary);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
      }

      doc.text(line, PAGE.margin, cursorY);
      cursorY += lineHeight;
    }

    cursorY += 8;
  }

  return cursorY;
}

export async function generateInsightPdf(input: InsightPdfInput): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - PAGE.margin * 2;
  const logoDataUrl = await loadImageDataUrl("/brand/iris-mark.png");

  drawPageBackground(doc);
  let bodyStartY = drawHeader(doc, logoDataUrl, input);
  bodyStartY = drawEventBadges(doc, input.eventos, bodyStartY + 8, contentWidth);

  setText(doc, IRIS_PDF_RGB.textMuted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("PREVISÃO", PAGE.margin, bodyStartY + 4);

  paginateBody(doc, input.previsao, bodyStartY + 18, contentWidth);

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    drawFooter(doc, page, totalPages);
  }

  doc.save(`data-iris-insight-${input.fileDate}.pdf`);
}
