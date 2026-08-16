/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ThreeSceneManager } from "@/lib/customer/three-scene-manager";

/* File category types */
export type FileCategory = "image" | "short-doc" | "book";

export type BindingType = "perfect" | "spiral" | "brochure" | "staple" | "none";

/* Paper dimensions in 3D units (height normalized to 3) */
const PAPER_SIZES: Record<string, { w: number; h: number }> = {
  A6: { w: 1.47, h: 2.09 },
  A5: { w: 2.10, h: 2.97 },
  B5: { w: 2.22, h: 3.15 },
  A4: { w: 2.97, h: 4.20 },
  B4: { w: 3.15, h: 4.46 },
  A3: { w: 4.20, h: 5.94 },
  Letter: { w: 3.08, h: 3.98 },
  Legal: { w: 3.08, h: 5.00 },
};

const PAPER_THICKNESS_MAP: Record<string, number> = {
  "80gsm": 0.004,
  "100gsm": 0.005,
  "120gsm": 0.006,
};

const DEFAULT_THICKNESS = 0.004;

const PAPER_COLORS: Record<string, string> = {
  normal: "#f8f6f1",
  cream: "#f5f0e1",
  glossy: "#fafafa",
  matte: "#f0ede6",
};

const SPINE_COLORS: Record<string, string> = {
  perfect: "#1a1a2e",
  spiral: "#b0b0b0",
  staple: "#888888",
  none: "#d4d0c8",
};

const CATEGORY_LABELS: Record<FileCategory, string> = {
  image: "صورة / صفحة واحدة",
  "short-doc": "مستند قصير",
  book: "كتاب / مذكرة",
};

const BINDING_LABELS: Record<string, string> = {
  perfect: "تجليد كمالي",
  spiral: "تجليد سلك",
  brochure: "بروشور مطوي",
  staple: "دبوس",
  none: "أوراق سائبة",
  flat: "ورقة مطبوعة",
};

export interface BookMockup3DProps {
  fileSource: string;
  totalPages: number;
  paperSize?: string;
  paperType?: string;
  binding?: BindingType;
  color?: string;
  orientation?: string;
  duplex?: boolean;
  spineColor?: string;
  category?: FileCategory;
  fileType?: string;
  clearCover?: boolean;
  copies?: number;
  pageWidthMM?: number;
  pageHeightMM?: number;
  paperWeight?: string;
  /** Pre-rendered cover texture data URL (from Web Worker) */
  coverDataUrl?: string | null;
  /** Pre-rendered back page texture data URL (from Web Worker) */
  backDataUrl?: string | null;
  onBindingChange?: (b: BindingType) => void;
  /** Callback to open the 2D page viewer */
  onBrowsePages?: () => void;
}

/* ═══════════════════════════════════════════════════════════════════
   Texture info: stores both the Texture object AND its pixel aspect ratio.
   This is critical for UV alignment.
   ═══════════════════════════════════════════════════════════════════ */
interface TextureInfo {
  texture: import("three").Texture;
  aspectRatio: number; // width/height of the source image
}

/* ==================================================================
   PBR Material Presets — calibrated for realistic print appearance
   ================================================================== */
const PAPER_PBR: Record<string, { roughness: number; metalness: number; envMapIntensity: number; clearcoat: number; clearcoatRoughness: number }> = {
  normal:  { roughness: 0.55, metalness: 0.0, envMapIntensity: 0.15, clearcoat: 0.0, clearcoatRoughness: 0.5 },
  cream:   { roughness: 0.60, metalness: 0.0, envMapIntensity: 0.12, clearcoat: 0.0, clearcoatRoughness: 0.6 },
  glossy:  { roughness: 0.15, metalness: 0.02, envMapIntensity: 0.6, clearcoat: 0.8, clearcoatRoughness: 0.1 },
  matte:   { roughness: 0.75, metalness: 0.0, envMapIntensity: 0.08, clearcoat: 0.0, clearcoatRoughness: 0.8 },
};

/* ==================================================================
   Promise-based texture loader with Ultra-HD settings
   Returns TextureInfo (texture + aspect ratio for UV alignment)
   
   Quality: SRGBColorSpace + Trilinear Mipmap + Max Anisotropy
   ================================================================== */
function loadTextureAsync(
  dataUrl: string,
  THREE: typeof import("three"),
  renderer?: import("three").WebGLRenderer | null,
): Promise<TextureInfo> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const tex = new THREE.Texture(img);
      // ═══ Ultra-HD: SRGBColorSpace + Trilinear Mipmap + Max Anisotropy ═══
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      if (renderer) {
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      }
      tex.needsUpdate = true;
      resolve({
        texture: tex,
        aspectRatio: img.naturalWidth / img.naturalHeight,
      });
    };
    img.onerror = () => {
      reject(new Error("Failed to load cover texture from data URL"));
    };
    img.src = dataUrl;
  });
}

/* ==================================================================
   Procedural Page Edge Texture — canvas-based simulation of visible
   page lines on a book's head/tail edge (top/bottom faces of box).
   ================================================================== */
interface PageEdgeTextureResult {
  texture: import("three").CanvasTexture;
  disposed: boolean;
}

function createPageEdgeTexture(
  THREE: typeof import("three"),
  thickness: number,
  sheets: number,
  paperColor: string,
): PageEdgeTextureResult {
  const canvas = document.createElement("canvas");
  const texWidth = 64;
  const lineCount = Math.min(200, Math.max(80, sheets));
  const texHeight = lineCount;
  canvas.width = texWidth;
  canvas.height = texHeight;
  const ctx = canvas.getContext("2d")!;

  // Draw paper color as background
  ctx.fillStyle = paperColor;
  ctx.fillRect(0, 0, texWidth, texHeight);

  // Two alternating base colors for subtle page banding
  const baseR = 232, baseG = 229, baseB = 224;   // #e8e5e0
  const altR  = 240, altG  = 237, altB  = 232;   // #f0ede8

  // Draw individual page lines with ±5% random brightness variation
  for (let i = 0; i < lineCount; i++) {
    const isEven = i % 2 === 0;
    const r = isEven ? baseR : altR;
    const g = isEven ? baseG : altG;
    const b = isEven ? baseB : altB;

    // ±5% brightness variation per line for realism
    const variation = 0.95 + Math.random() * 0.10; // range [0.95, 1.05]
    const cr = Math.min(255, Math.round(r * variation));
    const cg = Math.min(255, Math.round(g * variation));
    const cb = Math.min(255, Math.round(b * variation));

    ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
    ctx.fillRect(0, i, texWidth, 1);
  }

  // Subtle dark line at top (head edge shadow) — gradient fade
  const gradTop = ctx.createLinearGradient(0, 0, 0, 3);
  gradTop.addColorStop(0, "rgba(0,0,0,0.12)");
  gradTop.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradTop;
  ctx.fillRect(0, 0, texWidth, 3);

  // Subtle dark line at bottom (tail edge shadow) — gradient fade
  const gradBottom = ctx.createLinearGradient(0, texHeight - 3, 0, texHeight);
  gradBottom.addColorStop(0, "rgba(0,0,0,0)");
  gradBottom.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = gradBottom;
  ctx.fillRect(0, texHeight - 3, texWidth, 3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  return { texture, disposed: false };
}

/* ==================================================================
   Main Component
   ================================================================== */
export function BookMockup3D({
  fileSource,
  totalPages,
  paperSize = "A5",
  paperType = "normal",
  binding = "perfect",
  duplex = true,
  spineColor: spineColorProp,
  category = "book",
  fileType = "pdf",
  clearCover = false,
  copies = 1,
  pageWidthMM,
  pageHeightMM,
  paperWeight = "80gsm",
  coverDataUrl,
  backDataUrl,
  onBrowsePages,
}: BookMockup3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<ThreeSceneManager | null>(null);
  const bookGroupRef = useRef<import("three").Group | null>(null);
  const loadedFileRef = useRef("");

  /* ─── Material refs for INSTANT hot-swapping without rebuild ─── */
  const coverFrontMatRef = useRef<import("three").MeshStandardMaterial | null>(null);
  const coverBackMatRef = useRef<import("three").MeshStandardMaterial | null>(null);
  const spineMatRef = useRef<import("three").MeshStandardMaterial | null>(null);
  const edgeMatRef = useRef<import("three").MeshStandardMaterial | null>(null);
  const clearCoverMeshRef = useRef<import("three").Mesh | null>(null);
  const loadedCoverUrlRef = useRef<string | null>(null);
  const loadedBackUrlRef = useRef<string | null>(null);

  /* ─── Track the ACTUAL geometry dimensions used at build time ─── */
  const geoDimsRef = useRef({ w: 2.1, h: 3.0, thickness: 0.1 });

  const [status, setStatus] = useState<"loading" | "cover-loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const isPdfMultiPage = fileType === "pdf" && totalPages > 1;
  const [showClearCover, setShowClearCover] = useState(clearCover);

  /* ═══════════════════════════════════════════════════════════════════
     getDimensions — compute 3D geometry dimensions.
     KEY FIX: Uses textureAspectRatio when available to guarantee
     the geometry face matches the texture pixel-for-pixel.
     Falls back to pageWidthMM/pageHeightMM, then PAPER_SIZES.
     ═══════════════════════════════════════════════════════════════════ */
  const getDimensions = useCallback((
    textureAspectRatio?: number | null,
  ) => {
    const sheetThickness = PAPER_THICKNESS_MAP[paperWeight] || DEFAULT_THICKNESS;
    let w: number;
    let h = 3.0;

    // Priority 1: Texture's actual pixel aspect ratio (100% accurate UV mapping)
    if (textureAspectRatio && textureAspectRatio > 0) {
      w = h * textureAspectRatio;
    }
    // Priority 2: Document's measured dimensions in mm
    else if (pageWidthMM && pageHeightMM && pageWidthMM > 0 && pageHeightMM > 0) {
      const ar = pageWidthMM / pageHeightMM;
      w = h * ar;
    }
    // Priority 3: Standard paper size lookup
    else {
      const ps = PAPER_SIZES[paperSize] || PAPER_SIZES["A5"];
      const scale = 3.0 / ps.h;
      w = ps.w * scale;
    }

    const sheets = Math.ceil(totalPages / (duplex ? 2 : 1));
    const thickness = Math.max(0.02, Math.min(0.7, sheets * sheetThickness + 0.02));
    const paperColor = PAPER_COLORS[paperType] || PAPER_COLORS.normal;
    const spColor = spineColorProp || SPINE_COLORS[binding] || "#1a1a2e";
    return { w, h, thickness, paperColor, spColor, sheets, sheetThickness };
  }, [paperSize, paperType, totalPages, duplex, binding, spineColorProp, pageWidthMM, pageHeightMM, paperWeight]);

  /* Load image texture from URL (for image files) */
  const loadImageTextureFromUrl = useCallback(
    async (url: string, THREE: typeof import("three")): Promise<TextureInfo> => {
      const texLoader = new THREE.TextureLoader();
      return new Promise((resolve, reject) => {
        texLoader.load(url, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          if (managerRef.current) {
            tex.anisotropy = managerRef.current.getRenderer().capabilities.getMaxAnisotropy();
          }
          tex.needsUpdate = true;
          // Get the actual image aspect ratio from the source
          const img = tex.image as HTMLImageElement;
          const ar = img?.naturalWidth ? img.naturalWidth / img.naturalHeight : 1;
          resolve({ texture: tex, aspectRatio: ar });
        }, undefined, reject);
      });
    },
    [],
  );

  /* ═══════════════════════════════════════════════════════════════════
     buildMeshGroup — builds geometry with COLORED materials (no textures).
     Textures are applied LATER by the applyCoverTextures effect.
     This ensures the mesh is always visible immediately.
     
     CRITICAL FIX: frontTexInfo and backTexInfo carry aspectRatio
     so geometry dimensions match the texture pixel-perfectly.
     ═══════════════════════════════════════════════════════════════════ */
  const buildMeshGroup = useCallback(async (
    frontTexInfo?: TextureInfo | null,
    backTexInfo?: TextureInfo | null,
  ) => {
    const THREE = await import("three");

    // Determine the best aspect ratio for geometry from texture data
    const texAR = frontTexInfo?.aspectRatio || backTexInfo?.aspectRatio || null;
    const { w, h, thickness, paperColor, spColor, sheets } = getDimensions(texAR);

    // Store for later reference (clear cover positioning, etc.)
    geoDimsRef.current = { w, h, thickness };

    const group = new THREE.Group();
    const paperC = new THREE.Color(paperColor);
    const spineC = new THREE.Color(spColor);

    // Get environment map from scene manager for realistic reflections
    const envMap = managerRef.current?.getEnvMap() || null;
    const pbr = PAPER_PBR[paperType] || PAPER_PBR.normal;

    // Load textures for images (from server URL)
    let imageTexInfo: TextureInfo | null = null;
    if (fileType === "image") {
      try {
        const url = `/api/file-preview?file=${encodeURIComponent(fileSource)}`;
        imageTexInfo = await loadImageTextureFromUrl(url, THREE);
        managerRef.current?.trackTexture(imageTexInfo.texture);
      } catch (imgErr) {
        console.warn("[BookMockup3D] Failed to load image texture:", imgErr);
      }
    }

    // Use provided textures or fall back to colored materials
    const activeFrontTexInfo = fileType === "image" ? imageTexInfo : (frontTexInfo ?? null);
    const activeBackTexInfo = fileType === "image" ? null : (backTexInfo ?? null);

    // ═══ Cover Front Material — PBR calibrated for print paper ═══
    const coverFrontMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: pbr.roughness,
      metalness: pbr.metalness,
      envMap: envMap || undefined,
      envMapIntensity: activeFrontTexInfo ? 0.3 : pbr.envMapIntensity,
      ...(activeFrontTexInfo ? { map: activeFrontTexInfo.texture } : {}),
    });
    coverFrontMatRef.current = coverFrontMat;

    const whiteBackMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      roughness: 0.85,
      envMap: envMap || undefined,
      envMapIntensity: 0.05,
    });

    // ═══ Cover Back Material — same PBR calibration ═══
    const coverBackMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: pbr.roughness,
      metalness: pbr.metalness,
      envMap: envMap || undefined,
      envMapIntensity: activeBackTexInfo ? 0.3 : pbr.envMapIntensity,
      ...(activeBackTexInfo ? { map: activeBackTexInfo.texture } : {}),
    });
    coverBackMatRef.current = coverBackMat;

    // ═══ Spine Material — leather-like for perfect binding, metallic for spiral ═══
    const isSpiral = binding === "spiral";
    const spineMat = new THREE.MeshStandardMaterial({
      color: spineC,
      roughness: isSpiral ? 0.2 : 0.5,
      metalness: isSpiral ? 0.85 : 0.15,
      envMap: envMap || undefined,
      envMapIntensity: isSpiral ? 0.8 : 0.3,
    });
    spineMatRef.current = spineMat;

    // ═══ Page Edge Material — realistic paper stack appearance ═══
    const edgeMat = new THREE.MeshStandardMaterial({
      color: paperC,
      roughness: 0.9,
      metalness: 0.0,
      envMap: envMap || undefined,
      envMapIntensity: 0.05,
    });
    edgeMatRef.current = edgeMat;

    /* === Path 1: Flat printed sheet (image / single page) === */
    if (category === "image") {
      const sheetThickness = 0.008;
      const geo = new THREE.BoxGeometry(w, h, sheetThickness);
      const mats = [edgeMat, edgeMat, edgeMat, edgeMat, coverFrontMat, whiteBackMat];
      const mesh = new THREE.Mesh(geo, mats);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      group.rotation.y = -0.3;
      group.rotation.x = 0.05;
      group.position.y = h / 2 - 0.5;
      return group;
    }

    /* === Path 2: Stacked sheets with staple (2-10 pages) === */
    if (category === "short-doc") {
      const sheetCount = Math.min(6, Math.max(2, Math.ceil(totalPages / 3)));
      const innerPaperMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, roughness: 0.85, metalness: 0.0, 
        envMap: envMap || undefined, envMapIntensity: 0.05,
      });

      for (let i = 0; i < sheetCount; i++) {
        const isTop = i === 0;
        const isBottom = i === sheetCount - 1;
        const sheetGeo = new THREE.BoxGeometry(w, h, 0.005);
        const sheetMat = isTop
          ? coverFrontMat
          : isBottom && activeBackTexInfo
            ? coverBackMat
            : innerPaperMat;
        const sheet = new THREE.Mesh(sheetGeo, sheetMat);
        sheet.position.z = (i - sheetCount / 2) * 0.012;
        sheet.position.x = (Math.random() - 0.5) * 0.02;
        sheet.position.y = (Math.random() - 0.5) * 0.015;
        sheet.rotation.z = (Math.random() - 0.5) * 0.008;
        sheet.castShadow = isTop;
        sheet.receiveShadow = true;
        group.add(sheet);
      }

      // Staples
      const stapleMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#999999"), roughness: 0.3, metalness: 0.9,
      });
      const buildStaple = (xPos: number, yPos: number) => {
        const sg = new THREE.Group();
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.006, 0.018), stapleMat);
        bar.castShadow = true;
        sg.add(bar);
        const armGeo = new THREE.BoxGeometry(0.006, 0.02, 0.018);
        const arm1 = new THREE.Mesh(armGeo, stapleMat);
        arm1.position.set(0.017, -0.01, 0); arm1.rotation.z = -0.15;
        sg.add(arm1);
        const arm2 = new THREE.Mesh(armGeo, stapleMat);
        arm2.position.set(-0.017, -0.01, 0); arm2.rotation.z = 0.15;
        sg.add(arm2);
        sg.position.set(xPos, yPos, (sheetCount / 2) * 0.012 + 0.01);
        return sg;
      };
      group.add(buildStaple(-w * 0.35, h * 0.4));
      if (totalPages > 4) group.add(buildStaple(-w * 0.35, -h * 0.4));

      group.rotation.y = -0.3;
      group.rotation.x = 0.05;
      group.position.y = h / 2 - 0.5;
      return group;
    }

    /* === Path 3: Full book/notebook (>10 pages) === */
    if (binding === "perfect") {
      const geo = new THREE.BoxGeometry(w, h, thickness);

      // Create procedural page edge texture for top/bottom faces
      const { texture: pageEdgeTex } = createPageEdgeTexture(THREE, thickness, sheets, paperColor);
      managerRef.current?.trackTexture(pageEdgeTex);

      const edgeTopMat = new THREE.MeshStandardMaterial({
        color: paperC,
        roughness: 0.9,
        metalness: 0.0,
        envMap: envMap || undefined,
        envMapIntensity: 0.05,
        map: pageEdgeTex,
      });
      const edgeBottomMat = new THREE.MeshStandardMaterial({
        color: paperC,
        roughness: 0.9,
        metalness: 0.0,
        envMap: envMap || undefined,
        envMapIntensity: 0.05,
        map: pageEdgeTex,
      });

      // Material order: +X (spine), -X (spine), +Y (top/head), -Y (bottom/tail), +Z (front cover), -Z (back cover)
      const mats = [spineMat, spineMat, edgeTopMat, edgeBottomMat, coverFrontMat, coverBackMat];
      const mesh = new THREE.Mesh(geo, mats);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      // ═══ Head/Tail Bands — colored cloth strips at spine top/bottom ═══
      if (thickness > 0.06) {
        const bandColors = [0x8b1a1a, 0x1a3a5c, 0x2d5a3d, 0x5c3a1a]; // maroon, navy, forest, brown
        const bandColor = bandColors[Math.floor(Math.random() * bandColors.length)];
        const bandMat = new THREE.MeshStandardMaterial({ color: bandColor, roughness: 0.8, metalness: 0.0 });
        const bandGeo = new THREE.BoxGeometry(thickness + 0.01, 0.03, 0.015);
        const headBand = new THREE.Mesh(bandGeo, bandMat);
        headBand.position.set(0, h / 2 + 0.001, 0);
        group.add(headBand);
        const tailBand = new THREE.Mesh(bandGeo, bandMat);
        tailBand.position.set(0, -h / 2 - 0.001, 0);
        group.add(tailBand);
      }

      // ═══ Spine Groove Lines — subtle indentations where cover meets spine ═══
      if (thickness > 0.05) {
        const grooveMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, metalness: 0.0 });
        const grooveGeo = new THREE.BoxGeometry(thickness * 0.4, h * 0.92, 0.003);
        const frontGroove = new THREE.Mesh(grooveGeo, grooveMat);
        frontGroove.position.set(0, 0, thickness / 2 + 0.001);
        group.add(frontGroove);
        const backGroove = new THREE.Mesh(grooveGeo, grooveMat);
        backGroove.position.set(0, 0, -thickness / 2 - 0.001);
        group.add(backGroove);
      }

      if (thickness > 0.08) {
        const pgGeo = new THREE.BoxGeometry(w - 0.02, h - 0.04, thickness * 0.9);
        const pgMat = new THREE.MeshStandardMaterial({
          color: 0xfffef8, roughness: 0.95, metalness: 0.0,
          envMap: envMap || undefined, envMapIntensity: 0.02,
          polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
        });
        const pg = new THREE.Mesh(pgGeo, pgMat);
        pg.position.z = -0.003;
        group.add(pg);
      }

      // Glass/Plastic clear cover (MeshPhysicalMaterial with transmission)
      if (showClearCover) {
        const clearCoverMat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          roughness: 0.1,
          metalness: 0.0,
          transmission: 0.85,
          thickness: 0.01,
          transparent: true,
          opacity: 1.0,
          ior: 1.5,
          side: THREE.DoubleSide,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        });
        const clearGeo = new THREE.PlaneGeometry(w + 0.06, h + 0.06);
        const clearMesh = new THREE.Mesh(clearGeo, clearCoverMat);
        clearMesh.position.z = thickness / 2 + 0.006;
        clearCoverMeshRef.current = clearMesh;
        group.add(clearMesh);
      }
    }

    else if (binding === "spiral") {
      const bodyGeo = new THREE.BoxGeometry(w, h, thickness);

      // Create procedural page edge texture for top/bottom faces
      const { texture: spiralEdgeTex } = createPageEdgeTexture(THREE, thickness, sheets, paperColor);
      managerRef.current?.trackTexture(spiralEdgeTex);

      const edgeTopMat = new THREE.MeshStandardMaterial({
        color: paperC,
        roughness: 0.9,
        metalness: 0.0,
        envMap: envMap || undefined,
        envMapIntensity: 0.05,
        map: spiralEdgeTex,
      });
      const edgeBottomMat = new THREE.MeshStandardMaterial({
        color: paperC,
        roughness: 0.9,
        metalness: 0.0,
        envMap: envMap || undefined,
        envMapIntensity: 0.05,
        map: spiralEdgeTex,
      });

      // Material order: +X (fore-edge), -X (spine-side), +Y (top/head), -Y (bottom/tail), +Z (front), -Z (back)
      const mats = [edgeMat, edgeMat, edgeTopMat, edgeBottomMat, coverFrontMat, coverBackMat];
      const body = new THREE.Mesh(bodyGeo, mats);
      body.castShadow = true;
      group.add(body);

      // ═══ Spiral Hole Marks — punched holes visible on paper edge ═══
      const loopCount = Math.max(4, Math.round(h / 0.015));
      const holeMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.95, metalness: 0.0 });
      const holeGeo = new THREE.CylinderGeometry(0.012, 0.012, thickness + 0.004, 8);
      holeGeo.rotateX(Math.PI / 2);
      for (let hi = 0; hi < loopCount; hi++) {
        const t = (hi + 0.5) / loopCount;
        const yPos = h * (0.5 - t);
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.set(-w / 2, yPos, 0);
        group.add(hole);
      }

      const wireRadius = thickness * 0.6 + 0.03;
      const wireTube = 0.015;
      const wireMat = new THREE.MeshStandardMaterial({ color: spineC, roughness: 0.2, metalness: 0.8 });
      spineMatRef.current = wireMat;

      for (let i = 0; i < loopCount; i++) {
        const t = (i + 0.5) / loopCount;
        const yPos = h * (0.5 - t);
        const torusGeo = new THREE.TorusGeometry(Math.max(0.01, wireRadius), Math.max(0.005, wireTube), 8, 16, Math.PI);
        const torus = new THREE.Mesh(torusGeo, wireMat);
        torus.position.set(-w / 2, yPos, 0);
        torus.rotation.z = Math.PI / 2;
        torus.castShadow = true;
        group.add(torus);
      }

      const rodGeo = new THREE.CylinderGeometry(0.012, 0.012, h + 0.1, 8);
      const rod = new THREE.Mesh(rodGeo, wireMat);
      rod.position.set(-w / 2 - wireRadius, 0, 0);
      rod.castShadow = true;
      group.add(rod);

      // Glass/Plastic clear cover for spiral
      if (showClearCover) {
        const clearCoverMat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          roughness: 0.1,
          metalness: 0.0,
          transmission: 0.85,
          thickness: 0.01,
          transparent: true,
          opacity: 1.0,
          ior: 1.5,
          side: THREE.DoubleSide,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        });
        const clearGeo = new THREE.PlaneGeometry(w + 0.06, h + 0.06);
        const clearMesh = new THREE.Mesh(clearGeo, clearCoverMat);
        clearMesh.position.z = thickness / 2 + 0.006;
        clearCoverMeshRef.current = clearMesh;
        group.add(clearMesh);
      }
    }

    else if (binding === "brochure") {
      const halfW = w / 2;
      const foldAngle = -0.15;
      const rightGeo = new THREE.BoxGeometry(halfW, h, 0.01);
      const rightMesh = new THREE.Mesh(rightGeo, coverFrontMat);
      rightMesh.position.x = halfW / 2;
      rightMesh.castShadow = true;
      rightMesh.receiveShadow = true;
      group.add(rightMesh);
      const leftGeo = new THREE.BoxGeometry(halfW, h, 0.01);
      const leftMesh = new THREE.Mesh(leftGeo, coverBackMat);
      leftMesh.position.x = -halfW / 2;
      leftMesh.rotation.y = foldAngle;
      leftMesh.castShadow = true;
      leftMesh.receiveShadow = true;
      group.add(leftMesh);

      // ═══ Enhanced Fold Crease — visible indentation with shadow ═══
      const foldCreaseMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.6, metalness: 0.0 });
      const foldCreaseGeo = new THREE.BoxGeometry(0.008, h, 0.012);
      const foldCrease = new THREE.Mesh(foldCreaseGeo, foldCreaseMat);
      foldCrease.rotation.x = Math.PI / 2;
      foldCrease.position.z = 0.006;
      group.add(foldCrease);

      // Fold shadow strip for depth
      const foldShadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.08 });
      const foldShadowGeo = new THREE.PlaneGeometry(0.06, h);
      const foldShadow = new THREE.Mesh(foldShadowGeo, foldShadowMat);
      foldShadow.position.set(0.03, 0, 0.007);
      group.add(foldShadow);
    }

    else {
      // Loose sheets / staple
      const sheetCount = Math.min(6, Math.max(2, Math.ceil(totalPages / 4)));
      for (let i = 0; i < sheetCount; i++) {
        const sheetGeo = new THREE.BoxGeometry(w, h, 0.005);
        const isTop = i === 0;
        const sheetMat = isTop
          ? coverFrontMat
          : new THREE.MeshStandardMaterial({ 
              color: paperC, roughness: 0.85, metalness: 0.0,
              envMap: envMap || undefined, envMapIntensity: 0.05,
            });
        const sheet = new THREE.Mesh(sheetGeo, sheetMat);
        sheet.position.z = (i - sheetCount / 2) * 0.012;
        sheet.position.x = (Math.random() - 0.5) * 0.03;
        sheet.position.y = (Math.random() - 0.5) * 0.02;
        sheet.rotation.z = (Math.random() - 0.5) * 0.01;
        sheet.castShadow = isTop;
        sheet.receiveShadow = true;
        group.add(sheet);
      }
      if (binding === "staple") {
        const stapleGeo = new THREE.TorusGeometry(0.025, 0.004, 4, 12, Math.PI);
        const sMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#999999"), roughness: 0.3, metalness: 0.9 });
        const s1 = new THREE.Mesh(stapleGeo, sMat);
        s1.position.set(w * 0.15, h * 0.4, 0.02);
        s1.rotation.x = -Math.PI / 2;
        group.add(s1);
        const s2 = new THREE.Mesh(stapleGeo, sMat);
        s2.position.set(w * 0.15, -h * 0.4, 0.02);
        s2.rotation.x = -Math.PI / 2;
        group.add(s2);
      }
    }

    group.rotation.y = -0.3;
    group.rotation.x = 0.05;
    group.position.y = h / 2 - 0.5;

    /* Visual multi-stacking for copies */
    if (copies > 1) {
      const stackGroup = new THREE.Group();
      const visualCount = Math.min(copies, 5);
      stackGroup.add(group);
      for (let i = 1; i < visualCount; i++) {
        const clone = group.clone();
        clone.position.y = i * 0.12;
        clone.position.x = Math.sin(i * 1.7) * 0.03;
        clone.position.z = Math.cos(i * 2.3) * 0.02;
        clone.rotation.z = i * 0.005;
        stackGroup.add(clone);
      }
      stackGroup.position.y = -(visualCount - 1) * 0.06;
      return stackGroup;
    }

    return group;
  // NOTE: showClearCover is intentionally NOT in deps — it uses instant update effect instead
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binding, category, getDimensions, totalPages, copies, fileType, fileSource, loadImageTextureFromUrl]);

  /* ═══════════════════════════════════════════════════════════════════
     STRICT SEQUENTIAL PIPELINE — Scene init depends on fileSource + coverDataUrl/backDataUrl.
     1. Init scene manager
     2. Load cover/back textures (if available)
     3. Build mesh WITH textures (using texture aspect ratio for UV alignment)
     4. Only then show the mesh
     ════════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !fileSource) return;
    if (loadedFileRef.current === fileSource && loadedCoverUrlRef.current === coverDataUrl && loadedBackUrlRef.current === backDataUrl) return;
    let destroyed = false;
    (async () => {
      try {
        setStatus("loading");
        const manager = new ThreeSceneManager({ container });
        await manager.init({
          container, backgroundColor: 0xf5f5f4, fov: category === "image" ? 35 : 40, shadows: true,
        });
        if (destroyed) { manager.destroy(); return; }
        managerRef.current = manager;
        manager.addDefaultLighting();
        manager.addGroundAndShadow();

        // ═══ STEP 2: Load cover/back textures BEFORE building the mesh ═══
        const renderer = manager.getRenderer();
        let frontTexInfo: TextureInfo | null = null;
        let backTexInfo: TextureInfo | null = null;
        if (coverDataUrl) {
          try {
            const THREE = await import("three");
            frontTexInfo = await loadTextureAsync(coverDataUrl, THREE, renderer);
            if (destroyed) { frontTexInfo.texture.dispose(); frontTexInfo = null; }
            else { manager.trackTexture(frontTexInfo.texture); }
          } catch (texErr) { console.error("[BookMockup3D] Cover texture load FAILED:", texErr); }
        }
        if (!destroyed && backDataUrl) {
          try {
            const THREE = await import("three");
            backTexInfo = await loadTextureAsync(backDataUrl, THREE, renderer);
            if (destroyed) { backTexInfo.texture.dispose(); backTexInfo = null; }
            else { manager.trackTexture(backTexInfo.texture); }
          } catch (texErr) { console.error("[BookMockup3D] Back texture load FAILED:", texErr); }
        }
        if (destroyed) { manager.destroy(); return; }

        // ═══ STEP 3: Build the 3D model WITH the loaded textures (aspect-ratio-aligned) ═══
        loadedCoverUrlRef.current = coverDataUrl || null;
        loadedBackUrlRef.current = backDataUrl || null;
        const meshGroup = await buildMeshGroup(frontTexInfo, backTexInfo);
        if (destroyed) { manager.destroy(); return; }
        bookGroupRef.current = meshGroup;
        manager.getScene().add(meshGroup);
        manager.startRenderLoop();
        loadedFileRef.current = fileSource;
        setStatus("ready");
      } catch (err) {
        if (!destroyed) {
          console.error("[BookMockup3D] Init error:", err);
          setStatus("error");
          setErrorMsg((err as Error).message || "Failed to load preview");
        }
      }
    })();
    return () => {
      destroyed = true;
      if (managerRef.current) { managerRef.current.destroy(); managerRef.current = null; }
      bookGroupRef.current = null;
      spineMatRef.current = null;
      coverFrontMatRef.current = null;
      coverBackMatRef.current = null;
      edgeMatRef.current = null;
      clearCoverMeshRef.current = null;
      loadedFileRef.current = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileSource, coverDataUrl, backDataUrl]);

  /* ═══════════════════════════════════════════════════════════════════
     Rebuild the 3D model ONLY when STRUCTURAL settings change.
     These changes require geometry rebuild (cannot be done via material updates).
     
     REMOVED from deps: showClearCover, paperType, spineColor, paperWeight
     → These are handled by instant material update effects below (<50ms)
     ════════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const manager = managerRef.current;
    if (status !== "ready" || !manager || !bookGroupRef.current) return;

    const rebuild = async () => {
      const scene = manager.getScene();
      const oldGroup = bookGroupRef.current!;
      const THREE = manager.getThree();

      scene.remove(oldGroup);
      oldGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => { m?.dispose?.(); });
        }
      });

      // Preserve current textures (they have correct aspect ratio)
      const currentFrontTex = coverFrontMatRef.current?.map || null;
      const currentBackTex = coverBackMatRef.current?.map || null;

      // Build TextureInfo from preserved textures for aspect ratio alignment
      let frontInfo: TextureInfo | null = null;
      let backInfo: TextureInfo | null = null;
      if (currentFrontTex) {
        const img = currentFrontTex.image as HTMLImageElement | HTMLCanvasElement;
        const ar = img?.width && img?.height ? img.width / img.height : null;
        if (ar) frontInfo = { texture: currentFrontTex, aspectRatio: ar };
      }
      if (currentBackTex) {
        const img = currentBackTex.image as HTMLImageElement | HTMLCanvasElement;
        const ar = img?.width && img?.height ? img.width / img.height : null;
        if (ar) backInfo = { texture: currentBackTex, aspectRatio: ar };
      }

      const newGroup = await buildMeshGroup(frontInfo, backInfo);
      bookGroupRef.current = newGroup;
      scene.add(newGroup);
      manager.markDirty();
      manager.setAutoRotate(true);
    };
    rebuild();
  // Only structural changes trigger rebuild — NOT visual/material changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binding, totalPages, duplex, paperSize, category, buildMeshGroup]);

  /* ═══════════════════════════════════════════════════════════════════
     INSTANT MATERIAL UPDATES — No rebuild, <50ms feedback.
     These effects only change material properties, not geometry.
     ═══════════════════════════════════════════════════════════════════ */

  // ─── Spine color — instant update (<16ms) ───
  useEffect(() => {
    const mat = spineMatRef.current;
    if (!mat || status !== "ready") return;
    const color = spineColorProp || SPINE_COLORS[binding] || "#1a1a2e";
    mat.color.setStyle(color);
    mat.needsUpdate = true;
    managerRef.current?.markDirty();
  }, [spineColorProp, binding, status]);

  // ─── Paper type / edge color — instant update (<16ms) ───
  useEffect(() => {
    const mat = edgeMatRef.current;
    if (!mat || status !== "ready") return;
    const paperColor = PAPER_COLORS[paperType] || PAPER_COLORS.normal;
    mat.color.setStyle(paperColor);
    mat.needsUpdate = true;
    managerRef.current?.markDirty();
  }, [paperType, status]);

  // ─── Clear cover — instant add/remove without full rebuild (<16ms) ───
  useEffect(() => {
    if (status !== "ready" || !managerRef.current || !bookGroupRef.current) return;
    const group = bookGroupRef.current;
    const { w, h, thickness } = geoDimsRef.current;

    if (showClearCover && !clearCoverMeshRef.current) {
      // Add clear cover mesh instantly
      (async () => {
        const THREE = await import("three");
        const clearCoverMat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          roughness: 0.1,
          metalness: 0.0,
          transmission: 0.85,
          thickness: 0.01,
          transparent: true,
          opacity: 1.0,
          ior: 1.5,
          side: THREE.DoubleSide,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        });
        const clearGeo = new THREE.PlaneGeometry(w + 0.06, h + 0.06);
        const clearMesh = new THREE.Mesh(clearGeo, clearCoverMat);
        clearMesh.position.z = thickness / 2 + 0.006;
        clearCoverMeshRef.current = clearMesh;
        group.add(clearMesh);
        managerRef.current?.markDirty();
      })();
    } else if (!showClearCover && clearCoverMeshRef.current) {
      // Remove clear cover instantly
      group.remove(clearCoverMeshRef.current);
      clearCoverMeshRef.current.geometry?.dispose();
      (clearCoverMeshRef.current.material as import("three").Material)?.dispose();
      clearCoverMeshRef.current = null;
      managerRef.current?.markDirty();
    }
  }, [showClearCover, status]);

  // ─── Sync clearCover prop to local state ───
  useEffect(() => {
    setShowClearCover(clearCover);
  }, [clearCover]);

  const toggleAutoRotate = () => {
    const mgr = managerRef.current;
    if (mgr) {
      const ctrl = mgr.getControls();
      ctrl.autoRotate = !ctrl.autoRotate;
    }
  };

  const resetCamera = () => {
    managerRef.current?.resetCamera();
  };

  const toggleClearCover = () => { setShowClearCover((prev) => !prev); };

  const categoryLabel = CATEGORY_LABELS[category] || "مستند";
  const bindingDesc = category === "image"
    ? "ورقة مطبوعة"
    : category === "short-doc"
      ? `أوراق مدموطة (${totalPages} صفحة)`
      : (BINDING_LABELS[binding] || binding);

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl border bg-card overflow-hidden shadow-sm">
        <div
          ref={containerRef}
          className="w-full bg-gradient-to-b from-stone-100 to-stone-200 dark:from-stone-900 dark:to-stone-950"
          style={{ height: "min(480px, 70vw)" }}
        />

        {(status === "loading" || status === "cover-loading") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm z-10">
            <div className="w-14 h-14 rounded-full border-4 border-muted border-t-amber-500 animate-spin mb-4" />
            <p className="text-sm font-medium text-muted-foreground">
              {status === "cover-loading"
                ? "جارٍ تطبيق غلاف المستند على المجسم..."
                : "جارٍ بناء المجسم ثلاثي الأبعاد..."
              }
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {status === "cover-loading"
                ? "سيظهر الغلاف فوراً بعد الاكتمال"
                : category === "image"
                  ? "يتم تحميل الصورة"
                  : category === "short-doc"
                    ? "يتم تجهيز الأوراق"
                    : "يتم استخراج الغلاف وتجهيز المشهد"
              }
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm z-10">
            <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-3">
              <svg className="h-7 w-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">فشل تحميل المعاينة</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs text-center px-4">{errorMsg}</p>
            <button
              onClick={() => {
                setStatus("loading");
                setErrorMsg("");
                loadedFileRef.current = "";
                loadedCoverUrlRef.current = null;
                loadedBackUrlRef.current = null;
              }}
              className="mt-3 px-4 py-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 text-xs font-medium hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-all border border-rose-200 dark:border-rose-800"
            >
              إعادة محاولة
            </button>
          </div>
        )}

        <div className="absolute bottom-0 inset-x-0 px-4 py-2.5 bg-gradient-to-t from-black/50 to-transparent text-white/90 text-[10px] flex items-center justify-between z-10">
          <span className="flex items-center gap-1.5">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" /><path d="M12 8v8M8 12h8" /></svg>
            مرّر للتدوير 360°
          </span>
          <span>{totalPages} صفحة • {paperSize} • {categoryLabel} • {bindingDesc}</span>
        </div>
      </div>

      {status === "ready" && (
        <>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button onClick={toggleAutoRotate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
              تدوير تلقائي
            </button>
            <button onClick={resetCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
              إعادة تعيين
            </button>
            {isPdfMultiPage && (
              <button
                onClick={() => onBrowsePages?.()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                تصفح الصفحات
              </button>
            )}

            {category === "book" && (
              <button
                onClick={toggleClearCover}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${showClearCover ? "bg-sky-100 dark:bg-sky-900/30 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M12 6v12" /></svg>
                غلاف بلاستيكي
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
