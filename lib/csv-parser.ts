/**
 * CSV Parser for vehicle imports
 * Supports both comma and tab-separated values
 */

export interface CSVParseOptions {
  delimiter?: "," | "\t" | ";";
  hasHeader?: boolean;
}

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

export function parseCSV(content: string, options: CSVParseOptions = {}): ParsedCSV {
  const { delimiter = ",", hasHeader = true } = options;
  const errors: string[] = [];

  try {
    // Split by newlines and filter empty lines
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return { headers: [], rows: [], errors: ["No data found in CSV"] };
    }

    // Parse CSV lines
    const parsed = lines.map((line) => parseCSVLine(line, delimiter));

    let headers: string[] = [];
    let startIdx = 0;

    // Extract headers
    if (hasHeader && parsed.length > 0) {
      headers = parsed[0];
      startIdx = 1;

      // Normalize headers
      headers = headers.map((h) =>
        h
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "_")
          .replace(/[^\w_]/g, "")
      );
    }

    // Parse data rows
    const rows: Record<string, string>[] = [];
    for (let i = startIdx; i < parsed.length; i++) {
      const rowValues = parsed[i];

      if (rowValues.length === 0) {
        continue;
      }

      // Skip rows that are clearly wrong (all empty)
      if (rowValues.every((v) => !v.trim())) {
        continue;
      }

      const row: Record<string, string> = {};

      // Map values to headers
      for (let j = 0; j < headers.length && j < rowValues.length; j++) {
        row[headers[j]] = rowValues[j].trim();
      }

      rows.push(row);
    }

    return { headers, rows, errors };
  } catch (err) {
    return {
      headers: [],
      rows: [],
      errors: [err instanceof Error ? err.message : "Failed to parse CSV"],
    };
  }
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Detect CSV delimiter from sample of content
 */
export function detectDelimiter(content: string): "," | "\t" | ";" {
  const firstLine = content.split("\n")[0];
  if (!firstLine) return ",";

  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;

  if (tabCount > commaCount && tabCount > semicolonCount) {
    return "\t";
  }
  if (semicolonCount > commaCount) {
    return ";";
  }

  return ",";
}

/**
 * Generate CSV template for vehicle import
 */
export function generateCSVTemplate(): string {
  const headers = [
    "year",
    "make",
    "model",
    "trim",
    "price",
    "mileage",
    "vin",
    "stock_number",
    "status",
  ];

  const example = [
    "2024,Tesla,Model 3,Long Range,45000,0,1TSLA00000000001,A12345,available",
    "2023,Toyota,Camry,LE,28000,15000,2T1B6FEV3DC000001,A12346,available",
    "2022,Honda,Civic,EX,22000,32000,1HGEV11222L000001,A12347,sold",
  ];

  return [headers.join(","), ...example].join("\n");
}
