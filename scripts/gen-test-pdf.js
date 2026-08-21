const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

(async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  
  // 10 pages, each with dense rectangles
  for (let p = 0; p < 10; p++) {
    const page = doc.addPage([595.28, 841.89]);
    // Draw many colored rectangles
    for (let y = 0; y < 840; y += 3) {
      for (let x = 0; x < 595; x += 3) {
        const v = ((x * 7 + y * 13 + p * 3) % 256) / 256;
        page.drawRectangle({ x, y, width: 3, height: 3, color: rgb(v, 0.9 - v * 0.5, v * 0.7) });
      }
    }
  }
  
  const pdfBytes = await doc.save();
  fs.writeFileSync('/home/z/my-project/scripts/test-4mb.pdf', pdfBytes);
  console.log('Created PDF: ' + (pdfBytes.length / 1024 / 1024).toFixed(2) + ' MB, Pages: 10');
})();
