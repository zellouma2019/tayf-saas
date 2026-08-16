/**
 * Magic Bytes File Type Detector
 * Reads actual binary header of a file to determine its true type,
 * independent of file extension or MIME type.
 */

export type DetectedFileType = "pdf" | "png" | "jpeg" | "webp" | "unknown";

interface MagicBytesResult {
  type: DetectedFileType;
  confidence: "high" | "medium";
  description: string;
}

const MAGIC_SIGNATURES: Array<{
  bytes: number[];
  offset: number;
  type: DetectedFileType;
  description: string;
}> = [
  {
    bytes: [0x25, 0x50, 0x44, 0x46, 0x2D], // %PDF-
    offset: 0,
    type: "pdf",
    description: "PDF Document (%PDF-)",
  },
  {
    bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // ‰PNG\r\n\x1a\n
    offset: 0,
    type: "png",
    description: "PNG Image",
  },
  {
    bytes: [0xFF, 0xD8, 0xFF, 0xE0], // JPEG JFIF
    offset: 0,
    type: "jpeg",
    description: "JPEG Image (JFIF)",
  },
  {
    bytes: [0xFF, 0xD8, 0xFF, 0xE1], // JPEG EXIF
    offset: 0,
    type: "jpeg",
    description: "JPEG Image (EXIF)",
  },
  {
    bytes: [0xFF, 0xD8, 0xFF, 0xDB], // JPEG raw
    offset: 0,
    type: "jpeg",
    description: "JPEG Image (Raw)",
  },
  {
    bytes: [0x52, 0x49, 0x46, 0x46], // RIFF
    offset: 0,
    type: "webp",
    description: "WebP Image (RIFF)",
  },
];

/**
 * Detect file type by reading magic bytes from the beginning of the file.
 * Only reads the first 16 bytes - extremely fast even for large files.
 */
export async function detectFileType(file: File): Promise<MagicBytesResult> {
  // Read only the first 16 bytes - no need to load the entire file
  const header = await readFileHeader(file, 16);

  if (!header || header.length < 4) {
    return {
      type: "unknown",
      confidence: "low",
      description: "Could not read file header",
    };
  }

  for (const sig of MAGIC_SIGNATURES) {
    if (sig.type === "webp") {
      // WebP: RIFF....WEBP at offset 0 (bytes 8-11 = WEBP)
      if (
        header.length >= 12 &&
        header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
        header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50
      ) {
        return { type: "webp", confidence: "high", description: sig.description };
      }
    } else {
      // Standard comparison
      let match = true;
      for (let i = 0; i < sig.bytes.length; i++) {
        const fileOffset = sig.offset + i;
        if (fileOffset >= header.length || header[fileOffset] !== sig.bytes[i]) {
          match = false;
          break;
        }
      }
      if (match) {
        return { type: sig.type, confidence: "high", description: sig.description };
      }
    }
  }

  return {
    type: "unknown",
    confidence: "low",
    description: "Unrecognized file format",
  };
}

/** Read first N bytes from a File as Uint8Array */
function readFileHeader(file: File, bytes: number): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result));
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      // Read only the specified number of bytes - O(1) for any file size
      reader.readAsArrayBuffer(file.slice(0, bytes));
    } catch {
      resolve(null);
    }
  });
}

/**
 * Validate that a file's actual binary content matches its claimed extension.
 * Returns true if the magic bytes confirm the expected type.
 */
export async function validateFileType(
  file: File,
  expectedType: DetectedFileType,
): Promise<{ valid: boolean; actual: MagicBytesResult }> {
  const detected = await detectFileType(file);
  return {
    valid: detected.type === expectedType,
    actual: detected,
  };
}
