/**
 * Arabic text support for jsPDF
 *
 * Handles:
 * 1. Arabic character shaping (connected forms) via arabic-reshaper
 * 2. Simple RTL reversal for correct visual order in jsPDF
 * 3. Arabic font (Amiri) registration with jsPDF
 *
 * IMPORTANT: We do NOT use bidi-js after reshaping because:
 * - arabic-reshaper converts characters to Unicode Presentation Forms (FB50-FDFF, FE70-FEFF)
 * - These presentation forms are already shaped for visual rendering
 * - Applying bidi reordering on top corrupts the text (produces garbled characters)
 * - Instead, we simply reverse the reshaped string for RTL display in jsPDF
 */

import jsPDF from "jspdf";
import ArabicReshaperModule from "arabic-reshaper";
// Handle ESM/CJS interop: Next.js ESM may wrap the default export
const ArabicReshaper = (ArabicReshaperModule as any)?.default || ArabicReshaperModule;

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
 * Split text into alternating RTL/LTR segments.
 * Each segment: { text, isRtl }
 */
interface TextSegment {
  text: string;
  isRtl: boolean;
}

function splitRtlLtr(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let current = "";
  let currentIsRtl: boolean | null = null;

  for (const char of text) {
    const isRtl = RTL_CHAR_RE.test(char);
    if (currentIsRtl === null) {
      currentIsRtl = isRtl;
      current = char;
    } else if (isRtl === currentIsRtl) {
      current += char;
    } else {
      segments.push({ text: current, isRtl: currentIsRtl! });
      currentIsRtl = isRtl;
      current = char;
    }
  }
  if (current) {
    segments.push({ text: current, isRtl: currentIsRtl! });
  }
  return segments;
}

/**
 * Process text for correct Arabic rendering in jsPDF (right-aligned).
 *
 * Strategy:
 * - Split text into RTL and LTR segments
 * - Reshape Arabic segments (connect letters)
 * - Reverse RTL segment characters (for visual RTL in jsPDF)
 * - Keep LTR segment characters as-is
 * - Reverse the ORDER of segments (so RTL segments appear rightmost)
 * - Do NOT use bidi-js on reshaped text (it corrupts presentation forms)
 *
 * After calling this, pass the result to doc.text() with align: "right"
 */
export function ar(text: string): string {
  if (!text) return text;
  if (!hasArabic(text)) return text;

  const segments = splitRtlLtr(text);

  // Reshape Arabic segments and reverse RTL character order
  const processed = segments.map((seg) => {
    if (seg.isRtl) {
      const reshaped = reshapeArabic(seg.text);
      return [...reshaped].reverse().join("");
    }
    return seg.text; // LTR stays as-is
  });

  // Reverse segment order so RTL comes first (= rightmost in display)
  processed.reverse();
  return processed.join("");
}

/**
 * Reshape Arabic text WITHOUT reversing — for cases where text
 * must flow left-to-right (e.g., table cells, mixed inline text).
 * Only applies arabic-reshaper to connect letters; no RTL reversal.
 */
export function arLTR(text: string): string {
  if (!text) return text;
  if (!hasArabic(text)) return text;
  return reshapeArabic(text);
}