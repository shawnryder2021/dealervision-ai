/**
 * Server-side image compositing — overlays the dealership logo onto a
 * clean rounded plate in the top-left of an AI-generated image.
 *
 * This guarantees the dealership's actual logo file is used (pixel-perfect)
 * regardless of whether the AI model honored image_input or not. It also
 * eliminates the duplicate-watermark failure mode entirely because the AI
 * generates an image with NO branding and we composite the logo afterward.
 *
 * Uses sharp (native deps, bundled with Next.js for Image optimization).
 */

import sharp from "sharp";

interface CompositeOptions {
  /** URL of the AI-generated base image */
  baseImageUrl: string;
  /** URL of the dealership logo */
  logoUrl: string;
  /** Width of the plate as a fraction of the base image width. Default 0.22 (22%). */
  plateWidthFraction?: number;
  /** Distance of the plate from the top-left corner, as fraction of base width. Default 0.025. */
  marginFraction?: number;
  /** Padding inside the plate around the logo, as fraction of plate width. Default 0.12. */
  paddingFraction?: number;
}

/**
 * Fetches the base image and logo, composites a white rounded plate
 * with the logo onto the top-left, and returns the result as a Buffer.
 */
export async function compositeLogoOntoImage(opts: CompositeOptions): Promise<Buffer> {
  const {
    baseImageUrl,
    logoUrl,
    plateWidthFraction = 0.22,
    marginFraction = 0.025,
    paddingFraction = 0.12,
  } = opts;

  console.log(`[compositor] starting composite: baseUrl=${baseImageUrl}, logoUrl=${logoUrl}`);

  // Fetch both images in parallel
  console.log("[compositor] fetching base image and logo...");
  const [baseRes, logoRes] = await Promise.all([
    fetch(baseImageUrl).catch((e) => {
      throw new Error(`Failed to fetch base image: ${e.message}`);
    }),
    fetch(logoUrl).catch((e) => {
      throw new Error(`Failed to fetch logo: ${e.message}`);
    }),
  ]);

  if (!baseRes.ok) throw new Error(`Failed to fetch base image: ${baseRes.status} ${baseRes.statusText}`);
  if (!logoRes.ok) throw new Error(`Failed to fetch logo: ${logoRes.status} ${logoRes.statusText}`);

  const [baseBuf, logoBuf] = await Promise.all([
    baseRes.arrayBuffer(),
    logoRes.arrayBuffer(),
  ]);
  console.log(`[compositor] fetched: baseImage=${baseBuf.byteLength} bytes, logo=${logoBuf.byteLength} bytes`);

  const base = sharp(Buffer.from(baseBuf));
  const baseMeta = await base.metadata();
  const baseWidth = baseMeta.width ?? 1024;
  const baseHeight = baseMeta.height ?? 1024;
  console.log(`[compositor] base image dimensions: ${baseWidth}×${baseHeight}, format=${baseMeta.format}`);

  // Plate dimensions
  const plateWidth = Math.round(baseWidth * plateWidthFraction);
  const padding = Math.round(plateWidth * paddingFraction);
  const margin = Math.round(baseWidth * marginFraction);
  console.log(`[compositor] plate calculations: plateWidth=${plateWidth}, padding=${padding}, margin=${margin}`);

  // Resize logo to fit inside plate (minus padding on both sides), preserve aspect ratio
  const logoTargetWidth = plateWidth - padding * 2;
  console.log(`[compositor] resizing logo to targetWidth=${logoTargetWidth}...`);
  const resizedLogoMeta = await sharp(Buffer.from(logoBuf))
    .resize({ width: logoTargetWidth, withoutEnlargement: false })
    .png()
    .toBuffer({ resolveWithObject: true });
  const logoHeight = resizedLogoMeta.info.height;
  const plateHeight = logoHeight + padding * 2;
  console.log(`[compositor] resized logo: ${logoTargetWidth}×${logoHeight}, plate will be ${plateWidth}×${plateHeight}`);

  // Build a white rounded-corner plate with a soft drop shadow as SVG
  const cornerRadius = Math.round(plateWidth * 0.06);
  const shadowOffset = Math.round(plateWidth * 0.02);
  const shadowBlur = Math.round(plateWidth * 0.03);
  const plateSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${plateWidth + shadowOffset * 2}" height="${plateHeight + shadowOffset * 2}" viewBox="0 0 ${plateWidth + shadowOffset * 2} ${plateHeight + shadowOffset * 2}">
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${shadowBlur}"/>
      <feOffset dx="0" dy="${shadowOffset}" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="offsetblur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect x="${shadowOffset}" y="${shadowOffset}" width="${plateWidth}" height="${plateHeight}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#ffffff" filter="url(#shadow)"/>
</svg>`;
  const plateBuf = Buffer.from(plateSvg, "utf8");
  const platePng = await sharp(plateBuf, { density: 300 })
    .resize({ width: plateWidth + shadowOffset * 2, height: plateHeight + shadowOffset * 2 })
    .png()
    .toBuffer();

  // Composite: base image → white plate at (margin, margin) → logo centered inside plate
  const compositeX = margin;
  const compositeY = margin;
  const logoX = compositeX + padding;
  const logoY = compositeY + padding;
  console.log(`[compositor] compositing: plate at (${compositeX}, ${compositeY}), logo at (${logoX}, ${logoY})`);

  try {
    const result = await base
      .composite([
        { input: platePng, left: compositeX, top: compositeY },
        { input: resizedLogoMeta.data, left: logoX, top: logoY },
      ])
      .png()
      .toBuffer();
    console.log(`[compositor] composite succeeded, result size: ${result.length} bytes`);
    return result;
  } catch (e) {
    console.error(
      "[compositor] composite operation failed:",
      e instanceof Error ? e.message : String(e),
    );
    throw e;
  }
}
