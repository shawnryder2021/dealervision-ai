import jsPDF from "jspdf";
import type { Vehicle, Dealership } from "@/lib/types";

// Letter size in pt: 612 × 792
const W = 612;
const H = 792;

function header(doc: jsPDF, dealership: Dealership) {
  const primary = dealership.brand_colors?.primary || "#0f172a";
  doc.setFillColor(primary);
  doc.rect(0, 0, W, 60, "F");
  doc.setTextColor("#ffffff");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(dealership.name, 36, 38);
  if (dealership.tagline) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(dealership.tagline, 36, 52);
  }
  doc.setTextColor("#000000");
}

function footer(doc: jsPDF, dealership: Dealership) {
  const c = dealership.contact ?? {};
  doc.setFontSize(8);
  doc.setTextColor("#666666");
  const line = [c.phone, c.website?.replace(/^https?:\/\//, ""), c.address].filter(Boolean).join("  ·  ");
  doc.text(line || dealership.name, W / 2, H - 24, { align: "center" });
  doc.setTextColor("#000000");
}

export function buildWindowSticker(vehicle: Vehicle, dealership: Dealership): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
  header(doc, dealership);

  // Title
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  const title = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");
  doc.text(title, 36, 110);

  // Photo placeholder box
  doc.setDrawColor("#cccccc");
  doc.rect(36, 130, W - 72, 200);
  if (vehicle.photos?.[0]) {
    try {
      doc.addImage(vehicle.photos[0], "JPEG", 36, 130, W - 72, 200);
    } catch {
      doc.setFontSize(10);
      doc.setTextColor("#999999");
      doc.text("(photo not embedded — view online)", W / 2, 230, { align: "center" });
      doc.setTextColor("#000000");
    }
  }

  // Price box
  if (vehicle.price) {
    const priceY = 360;
    doc.setFillColor("#f5f5f5");
    doc.rect(36, priceY, W - 72, 60, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("MANUFACTURER'S SUGGESTED RETAIL PRICE", 50, priceY + 22);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text(`$${vehicle.price.toLocaleString()}`, W - 50, priceY + 40, { align: "right" });
  }

  // Specs
  let y = 450;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Vehicle Information", 36, y);
  y += 6;
  doc.setDrawColor("#cccccc");
  doc.line(36, y, W - 36, y);
  y += 18;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const rows: [string, string | undefined][] = [
    ["VIN", vehicle.vin || undefined],
    ["Stock #", vehicle.stock_number || undefined],
    ["Year", vehicle.year ? String(vehicle.year) : undefined],
    ["Make", vehicle.make || undefined],
    ["Model", vehicle.model || undefined],
    ["Trim", vehicle.trim || undefined],
    ["Mileage", vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : undefined],
  ];
  for (const [k, v] of rows) {
    if (!v) continue;
    doc.setFont("helvetica", "bold");
    doc.text(`${k}:`, 36, y);
    doc.setFont("helvetica", "normal");
    doc.text(v, 140, y);
    y += 16;
  }

  // Tags / highlights
  if (vehicle.tags?.length) {
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Highlights", 36, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.text(vehicle.tags.join(" · "), 36, y, { maxWidth: W - 72 });
  }

  // Footer disclaimer
  doc.setFontSize(8);
  doc.setTextColor("#999999");
  doc.text(
    "Plus tax, title, license, and dealer fees. Subject to prior sale. Dealer not responsible for typographical errors.",
    36,
    H - 50,
    { maxWidth: W - 72 }
  );
  doc.setTextColor("#000000");

  footer(doc, dealership);
  return doc;
}

export function buildBuyersGuide(vehicle: Vehicle, dealership: Dealership): jsPDF {
  // FTC Used Vehicle Buyers Guide template (simplified, NOT the official template — for dealer reference only)
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
  header(doc, dealership);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("BUYERS GUIDE", W / 2, 100, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("(IMPORTANT: Spoken promises are difficult to enforce. Ask the dealer to put all promises in writing. Keep this form.)", W / 2, 116, { align: "center", maxWidth: W - 72 });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const title = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");
  doc.text(`VEHICLE: ${title}`, 36, 152);
  if (vehicle.vin) doc.text(`VIN: ${vehicle.vin}`, 36, 170);
  if (vehicle.stock_number) doc.text(`STOCK #: ${vehicle.stock_number}`, 300, 170);

  // Warranty section
  let y = 200;
  doc.setFontSize(13);
  doc.text("WARRANTIES FOR THIS VEHICLE:", 36, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  // AS IS box
  doc.rect(36, y, 14, 14);
  doc.setFont("helvetica", "bold");
  doc.text("AS IS — NO DEALER WARRANTY", 56, y + 11);
  doc.setFont("helvetica", "normal");
  y += 18;
  doc.text(
    "THE DEALER DOES NOT PROVIDE A WARRANTY FOR ANY REPAIRS AFTER SALE.",
    56,
    y,
    { maxWidth: W - 92 }
  );
  y += 30;

  // DEALER WARRANTY box
  doc.rect(36, y, 14, 14);
  doc.setFont("helvetica", "bold");
  doc.text("DEALER WARRANTY", 56, y + 11);
  doc.setFont("helvetica", "normal");
  y += 18;
  doc.text("FULL ____  LIMITED ____  WARRANTY. The dealer will pay ___% of the labor and ___% of the parts for the covered systems that fail during the warranty period.", 56, y, { maxWidth: W - 92 });
  y += 60;

  doc.setFont("helvetica", "bold");
  doc.text("SYSTEMS COVERED:", 56, y);
  doc.setFont("helvetica", "normal");
  y += 14;
  doc.text("___________________________________", 56, y);
  y += 16;
  doc.setFont("helvetica", "bold");
  doc.text("DURATION:", 56, y);
  doc.setFont("helvetica", "normal");
  y += 14;
  doc.text("___________________________________", 56, y);

  // Disclaimer
  y += 40;
  doc.setFontSize(9);
  doc.text(
    "ASK THE DEALER FOR A COPY OF ANY WARRANTY DOCUMENTS. SERVICE CONTRACTS may be available, which provide additional protection at extra cost.",
    36,
    y,
    { maxWidth: W - 72 }
  );

  footer(doc, dealership);
  return doc;
}
