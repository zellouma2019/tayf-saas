/**
 * Arabic text support for jsPDF
 *
 * Handles:
 * 1. Arabic character shaping (connected forms) via arabic-reshaper
 * 2. BiDi reordering for correct RTL visual order via bidi-js
 * 3. Arabic font (Amiri) registration with jsPDF
 *
 * Usage:
 *   import { initArabicPdf, ar } from '@/lib/pdf-arabic';
 *   await initArabicPdf(doc);
 *   doc.text(ar('بسم الله'), x, y, { align: 'right' });
 */

import jsPDF from "jspdf";
import ArabicReshaper from "arabic-reshaper";
import bidiFactory from "bidi-js";

// ─── Font registration ───────────────────────────────────────────────

const FONT_REGULAR = "Amiri";
const FONT_BOLD = "Amiri-Bold";

/** Cache base64 font data so we only fetch from the network once */
let fontCache: { regular?: string; bold?: string } | null = null;

/**
 * Fetch and cache Amiri font base64 data.
 */
async function ensureFontsLoaded(): Promise<{ regular: string; bold: string }> {
  if (fontCache?.regular && fontCache?.bold) return fontCache;

  const [regularBuf, boldBuf] = await Promise.all([
    fetch(`/fonts/Amiri-Regular.ttf`).then((r) => {
      if (!r.ok) throw new Error("Failed to fetch Amiri-Regular.ttf");
      return r.arrayBuffer();
    }),
    fetch(`/fonts/Amiri-Bold.ttf`).then((r) => {
      if (!r.ok) throw new Error("Failed to fetch Amiri-Bold.ttf");
      return r.arrayBuffer();
    }),
  ]);

  fontCache = {
    regular: arrayBufferToBase64(regularBuf),
    bold: arrayBufferToBase64(boldBuf),
  };
  return fontCache;
}

/**
 * Register Amiri Regular + Bold fonts into the given jsPDF document.
 * Font data is fetched once and cached; registration is per-document.
 */
export async function initArabicPdf(doc: jsPDF): Promise<void> {
  const fonts = await ensureFontsLoaded();

  doc.addFileToVFS("Amiri-Regular.ttf", fonts.regular);
  doc.addFont("Amiri-Regular.ttf", FONT_REGULAR, "normal");

  doc.addFileToVFS("Amiri-Bold.ttf", fonts.bold);
  doc.addFont("Amiri-Bold.ttf", FONT_BOLD, "bold");
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Use btoa when available (browser), fall back to Buffer (node)
  if (typeof btoa === "function") {
    return btoa(binary);
  }
  return Buffer.from(binary, "binary").toString("base64");
}

// ─── Font name getters for jsPDF ─────────────────────────────────────

/** Use as: doc.setFont(arFont(), style) */
export function arFont(bold = false): string {
  return bold ? FONT_BOLD : FONT_REGULAR;
}

// ─── Arabic text processing ──────────────────────────────────────────

/** Regex to detect Arabic characters (including reshaped/presentation forms) */
const ARABIC_CHAR_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/** Regex to detect any RTL character (Arabic, Hebrew) */
const RTL_CHAR_RE = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;

/**
 * Check if a string contains any Arabic/RTL characters.
 */
export function hasArabic(text: string): boolean {
  return RTL_CHAR_RE.test(text);
}

/**
 * Reshape Arabic characters into their proper connected forms.
 * This is the core step — without it, Arabic appears as isolated letters.
 */
function reshapeArabic(text: string): string {
  try {
    return (ArabicReshaper as unknown as { convertArabic: (t: string) => string }).convertArabic(text);
  } catch {
    return text;
  }
}

/**
 * Apply bidi visual reordering so the string renders correctly
 * when drawn left-to-right by jsPDF.
 *
 * We compute the visual order indices and build a new string
 * in that order.  Numbers remain LTR while Arabic runs become RTL.
 */
function bidiReorder(text: string): string {
  try {
    const bidi = bidiFactory();
    // Arabic-resize may add ZWJ / presentation forms that bidi-js
    // doesn't classify well, so we guard against empty results.
    const levels = bidi.getEmbeddingLevels(text, "rtl");
    if (!levels || !levels.levels) return text;

    const indices = bidi.getReorderedIndices(text, levels);
    if (!indices || indices.length === 0) return text;

    let result = "";
    for (const idx of indices) {
      result += text[idx];
    }
    return result;
  } catch {
    // Fallback: simple reverse for pure Arabic
    if (RTL_CHAR_RE.test(text) && !/[0-9a-zA-Z]/.test(text)) {
      return [...text].reverse().join("");
    }
    return text;
  }
}

/**
 * Process text for correct Arabic rendering in jsPDF.
 *
 * - Non-Arabic text (Latin, numbers, etc.) is returned as-is.
 * - Arabic text is reshaped (connected forms) and bidi-reordered.
 *
 * After calling this, pass the result to doc.text() with align: "right"
 * for RTL paragraphs.
 */
export function ar(text: string): string {
  if (!text) return text;
  if (!hasArabic(text)) return text;
  return bidiReorder(reshapeArabic(text));
}