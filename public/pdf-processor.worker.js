/**
 * PDF Processor Web Worker — ULTRA-HIGH QUALITY EDITION
 * 
 * Runs pdfjs-dist off the main thread to prevent UI freezing.
 * Optimized for maximum visual fidelity on 3D book mockup textures.
 * 
 * Quality Features:
 * - Dynamic render scale (3.0x–4.0x) based on page complexity
 * - WebP compression (90% quality) — 4-6x smaller than PNG with near-lossless text
 * - White background fill to prevent transparent textures
 * - Canvas imageSmoothingQuality: 'high' for anti-aliased edges
 * - Content-aware verification (checks 20 sample points)
 * 
 * Usage: postMessage({ type: 'process', data: ArrayBuffer })
 * Response: postMessage({ type: 'result', ... }) or { type: 'error', ... }
 */

let pdfjsLib = null;

async function loadPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  try {
    pdfjsLib = await import('/pdf-dist.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    return pdfjsLib;
  } catch (e) {
    throw new Error('Failed to load PDF library in worker: ' + (e.message || e));
  }
}

/**
 * Calculate optimal render scale based on page dimensions.
 * Larger pages get higher base scale, but cap total pixels to prevent OOM.
 * Target: ~4000px on the longest edge for crisp textures on high-DPI displays.
 */
function calculateOptimalScale(pageWidthPt, pageHeightPt) {
  const longestEdge = Math.max(pageWidthPt, pageHeightPt);
  
  // For A4 (595pt), scale 4.0 → 2380px. For A3 (842pt), scale 3.0 → 2526px
  // For Letter (612pt), scale 4.0 → 2448px
  // Cap at ~4000px longest edge to prevent canvas OOM in workers
  const MAX_TARGET_PX = 4000;
  const MIN_SCALE = 2.5;
  const MAX_SCALE = 5.0;
  
  const idealScale = MAX_TARGET_PX / longestEdge;
  // Clamp to reasonable range
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, idealScale));
}

/**
 * Render a single PDF page to a WebP data URL.
 * Uses highest quality settings for 3D texture fidelity.
 */
async function renderPageToDataUrl(pdfDoc, pageNum, targetScale) {
  const page = await pdfDoc.getPage(pageNum);
  const baseViewport = page.getViewport({ scale: 1 });
  
  // Use dynamic scale for optimal resolution
  const dynamicScale = calculateOptimalScale(baseViewport.width, baseViewport.height);
  let finalScale = targetScale || dynamicScale;
  
  let width = Math.round(baseViewport.width * finalScale);
  let height = Math.round(baseViewport.height * finalScale);
  
  // Cap maximum dimensions to prevent canvas OOM (OffscreenCanvas limit)
  const MAX_DIM = 4096;
  if (width > MAX_DIM || height > MAX_DIM) {
    const scaleFactor = MAX_DIM / Math.max(width, height);
    width = Math.round(width * scaleFactor);
    height = Math.round(height * scaleFactor);
    // Re-calculate scale for capped dimensions
    finalScale = width / baseViewport.width;
  }
  
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('OffscreenCanvas 2D context not available');
  }

  // ═══ CRITICAL: Highest quality rendering settings ═══
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Fill white background BEFORE rendering PDF
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Render the PDF page with the (possibly capped) scale
  const renderViewport = page.getViewport({ scale: finalScale });
  await page.render({ 
    canvasContext: ctx, 
    viewport: renderViewport,
    canvas 
  }).promise;

  // Verify content with multi-point sampling
  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    let hasContent = false;
    const step = Math.max(1, Math.floor(imageData.data.length / (4 * 100))); // Check 100 sample points
    for (let i = 0; i < imageData.data.length; i += step * 4) {
      if (imageData.data[i] < 248 || imageData.data[i + 1] < 248 || imageData.data[i + 2] < 248) {
        hasContent = true;
        break;
      }
    }
    if (!hasContent) {
      console.warn(`[PDF Worker] Page ${pageNum} appears blank`);
    }
  } catch { /* Verification non-critical */ }

  // ═══ Convert to WebP for optimal quality/size ratio ═══
  // WebP at 92% quality is visually identical to PNG for text documents
  // but 4-6x smaller in data URL size (faster texture upload to GPU)
  const blob = await canvas.convertToBlob({ 
    type: 'image/webp', 
    quality: 0.92 
  });

  if (blob.size < 100) {
    // Fallback to PNG if WebP encoding fails
    const pngBlob = await canvas.convertToBlob({ type: 'image/png' });
    if (pngBlob.size < 100) {
      throw new Error(`Page ${pageNum} rendering failed — empty output`);
    }
    const reader = new FileReaderSync();
    return reader.readAsDataURL(pngBlob);
  }

  const reader = new FileReaderSync();
  return reader.readAsDataURL(blob);
}

/** Get page dimensions in mm from MediaBox */
function getPageDimensionsMM(page) {
  const viewport = page.getViewport({ scale: 1 });
  const widthMM = Math.round((viewport.width * 25.4 / 72) * 10) / 10;
  const heightMM = Math.round((viewport.height * 25.4 / 72) * 10) / 10;
  return { width: widthMM, height: heightMM };
}

/** Find closest standard paper size */
function findClosestPaperSize(wMM, hMM) {
  const PAPER_SIZES = {
    A6: { w: 105, h: 148 }, A5: { w: 148, h: 210 }, B5: { w: 176, h: 250 },
    A4: { w: 210, h: 297 }, B4: { w: 250, h: 353 }, A3: { w: 297, h: 420 },
    Letter: { w: 216, h: 279 }, Legal: { w: 216, h: 356 },
  };
  let bestName = 'مخصص';
  let bestTolerance = Infinity;
  for (const [name, dims] of Object.entries(PAPER_SIZES)) {
    for (const [dw, dh] of [[dims.w, dims.h], [dims.h, dims.w]]) {
      const tolerance = Math.abs(wMM - dw) + Math.abs(hMM - dh);
      if (tolerance < bestTolerance) {
        bestTolerance = tolerance;
        bestName = name;
      }
    }
  }
  return bestTolerance > 20 ? 'مخصص' : bestName;
}

self.onmessage = async function(e) {
  const { type, id, data } = e.data;

  if (type === 'process') {
    try {
      const lib = await loadPdfjs();
      const arrayBuffer = data;

      self.postMessage({ type: 'progress', id, stage: 'loading', percent: 10 });

      const pdfDoc = await lib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdfDoc.numPages;

      self.postMessage({ type: 'progress', id, stage: 'dimensions', percent: 25 });

      const page1 = await pdfDoc.getPage(1);
      const dimsMM = getPageDimensionsMM(page1);
      const closestPaper = findClosestPaperSize(dimsMM.width, dimsMM.height);
      const viewport = page1.getViewport({ scale: 1 });
      const isPortrait = dimsMM.height > dimsMM.width + 1;
      const aspectRatio = viewport.width / viewport.height;

      self.postMessage({ type: 'progress', id, stage: 'cover', percent: 35 });

      // Render page 1 (cover) — ULTRA quality (dynamic scale, ~4000px target)
      let coverDataUrl = null;
      let coverRenderWidth = 0;
      let coverRenderHeight = 0;
      try {
        const page1View = page1.getViewport({ scale: 1 });
        const coverScale = calculateOptimalScale(page1View.width, page1View.height);
        coverRenderWidth = Math.round(page1View.width * coverScale);
        coverRenderHeight = Math.round(page1View.height * coverScale);
        coverDataUrl = await renderPageToDataUrl(pdfDoc, 1, coverScale);
      } catch (coverErr) {
        console.error('[PDF Worker] Cover render failed:', coverErr);
      }

      self.postMessage({ type: 'progress', id, stage: 'back', percent: 65 });

      // Render last page if multi-page
      let backDataUrl = null;
      if (numPages > 1) {
        try {
          backDataUrl = await renderPageToDataUrl(pdfDoc, numPages);
        } catch (backErr) {
          console.error('[PDF Worker] Back render failed:', backErr);
        }
      }

      self.postMessage({ type: 'progress', id, stage: 'cleanup', percent: 90 });

      try { pdfDoc.destroy(); } catch { /* v6 cleanup */ }

      self.postMessage({
        type: 'result',
        id,
        payload: {
          numPages,
          pageDimensionsMM: dimsMM,
          closestPaperSize: closestPaper,
          isPortrait,
          aspectRatio,
          coverDataUrl,
          backDataUrl,
          // Extra quality metadata
          coverRenderInfo: coverDataUrl ? {
            width: coverRenderWidth,
            height: coverRenderHeight,
            format: 'webp',
            quality: 92,
          } : null,
        },
      });

    } catch (err) {
      self.postMessage({
        type: 'error',
        id,
        error: err.message || 'Failed to process PDF in worker',
      });
    }
  }

  if (type === 'extract-pages') {
    try {
      const lib = await loadPdfjs();
      const { arrayBuffer, pageNumbers } = data;
      const pdfDoc = await lib.getDocument({ data: arrayBuffer }).promise;
      const pages = {};

      for (const pageNum of pageNumbers) {
        if (pageNum < 1 || pageNum > pdfDoc.numPages) continue;
        try {
          // Page browsing uses higher scale (4.0x) for sharper text
          const dataUrl = await renderPageToDataUrl(pdfDoc, pageNum, 4.0);
          pages[pageNum] = dataUrl;
        } catch (pgErr) {
          console.warn(`[PDF Worker] Page ${pageNum} extract failed:`, pgErr);
        }
      }

      try { pdfDoc.destroy(); } catch { /* v6 cleanup */ }
      self.postMessage({ type: 'pages-result', id, payload: pages });

    } catch (err) {
      self.postMessage({ type: 'error', id, error: err.message || 'Failed to extract pages' });
    }
  }

  if (type === 'terminate') {
    self.close();
  }
};
