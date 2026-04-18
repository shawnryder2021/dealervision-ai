/**
 * PDF Export utility
 * Exports a generated asset image as a print-ready PDF with correct page dimensions.
 */

const ASPECT_TO_INCHES: Record<string, { w: number; h: number }> = {
  "1:1":  { w: 8, h: 8 },
  "4:5":  { w: 8, h: 10 },
  "9:16": { w: 4.5, h: 8 },
  "16:9": { w: 11, h: 6.19 },
  "3:4":  { w: 8.5, h: 11 },     // Letter portrait (print-flyer)
  "2:3":  { w: 11, h: 17 },      // Tabloid portrait (print-poster)
  "21:9": { w: 14, h: 6 },       // wide banner
  "4:3":  { w: 8, h: 6 },
};

/**
 * Export an image URL as a PDF download.
 * The image is fetched via the download-proxy (to handle CORS) then embedded.
 *
 * @param imageUrl  - The asset image URL
 * @param aspectRatio - e.g. "3:4", "16:9"
 * @param filename  - Suggested filename without extension
 */
export async function exportAsPDF(
  imageUrl: string,
  aspectRatio: string | null,
  filename: string
): Promise<void> {
  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import("jspdf");

  const dims = ASPECT_TO_INCHES[aspectRatio ?? ""] ?? { w: 8.5, h: 11 };
  const orientation: "p" | "l" = dims.w > dims.h ? "l" : "p";
  const shortW = Math.min(dims.w, dims.h);
  const shortH = Math.max(dims.w, dims.h);
  const pdfW = orientation === "p" ? shortW : shortH;
  const pdfH = orientation === "p" ? shortH : shortW;

  const doc = new jsPDF({
    orientation,
    unit: "in",
    format: [pdfW, pdfH],
  });

  // Fetch the image via the proxy (handles cross-origin)
  const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(imageUrl)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error("Failed to fetch image for PDF export");

  const blob = await response.blob();
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const imgType = blob.type.includes("png") ? "PNG" : "JPEG";
  doc.addImage(dataUrl, imgType, 0, 0, pdfW, pdfH, undefined, "FAST");
  doc.save(`${filename.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
