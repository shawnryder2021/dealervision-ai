/**
 * Server-side image compositing — overlays the dealership logo directly
 * onto the top-left corner of an AI-generated image (no white plate).
 *
 * Uses sharp (native deps, bundled with Next.js for Image optimization).
 */

import sharp from "sharp";

interface CompositeOptions {
  /** URL of the AI-generated base image */
  baseImageUrl: string;
  /** URL of the dealership logo */
  logoUrl: string;
  /**
   * Logo width as a fraction of the base image width.
   * Default 0.30 (30%) — covers a good chunk of the top-left.
   */
  logoWidthFraction?: number;
  /**
   * Distance from the top-left corner as a fraction of base image width.
   * Default 0.02 (2%).
   */
  marginFraction?: number;
}

/**
 * Fetches the base image and logo, resizes the logo to logoWidthFraction of
 * the image width, and composites it directly onto the top-left corner.
 * No white background plate — the logo sits directly on the image.
 */
export async function compositeLogoOntoImage(opts: CompositeOptions): Promise<Buffer> {
  const {
    baseImageUrl,
    logoUrl,
    logoWidthFraction = 0.30,
    marginFraction = 0.02,
  } = opts;

  console.log(`[compositor] starting composite: baseUrl=${baseImageUrl}, logoUrl=${logoUrl}`);

  // Fetch both images in parallel
  const [baseRes, logoRes] = await Promise.all([
    fetch(baseImageUrl).catch((e) => { throw new Error(`Failed to fetch base image: ${e.message}`); }),
    fetch(logoUrl).catch((e) => { throw new Error(`Failed to fetch logo: ${e.message}`); }),
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
  console.log(`[compositor] base image: ${baseWidth}×${baseHeight}, format=${baseMeta.format}`);

  // Calculate logo target size
  const logoTargetWidth = Math.round(baseWidth * logoWidthFraction);
  const margin = Math.round(baseWidth * marginFraction);
  console.log(`[compositor] logo target width=${logoTargetWidth}px, margin=${margin}px`);

  // Resize logo, preserving aspect ratio, with transparency support
  const resizedLogo = await sharp(Buffer.from(logoBuf))
    .resize({ width: logoTargetWidth, withoutEnlargement: false })
    .png()
    .toBuffer({ resolveWithObject: true });

  const logoHeight = resizedLogo.info.height;
  console.log(`[compositor] resized logo: ${logoTargetWidth}×${logoHeight}`);
  console.log(`[compositor] placing logo at (${margin}, ${margin})`);

  try {
    const result = await base
      .composite([
        {
          input: resizedLogo.data,
          left: margin,
          top: margin,
          blend: "over",
        },
      ])
      .png()
      .toBuffer();

    console.log(`[compositor] composite succeeded, result size: ${result.length} bytes`);
    return result;
  } catch (e) {
    console.error("[compositor] composite operation failed:", e instanceof Error ? e.message : String(e));
    throw e;
  }
}
