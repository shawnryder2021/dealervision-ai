/**
 * Normalize LLM-generated copy into clean, ready-to-paste plain text.
 *
 * Models occasionally ignore "no markdown" instructions and emit **bold**,
 * headers, bullet markers, a leading "Caption:" label, or wrap the whole
 * thing in quotes. In a social post / listing those render as literal junk,
 * so we strip them defensively. Emoji and #hashtags are preserved.
 */
export function cleanGeneratedText(input: string): string {
  let s = (input ?? "").trim();
  if (!s) return s;

  // If the model emitted literal "\n" escapes with no real newlines, convert them.
  if (s.includes("\\n") && !s.includes("\n")) {
    s = s.replace(/\\n/g, "\n");
  }

  // Drop a leading label like "Caption:", "Post:", "Here's your caption:", "Instagram:".
  s = s.replace(
    /^\s*(?:caption|social (?:post|caption)|post|here(?:'s| is)[^:\n]*|instagram|facebook|x|twitter)\s*:\s*/i,
    ""
  );

  // Unwrap surrounding quotes if the entire caption is quoted.
  const pairs: [string, string][] = [['"', '"'], ["'", "'"], ["“", "”"]];
  for (const [open, close] of pairs) {
    if (s.startsWith(open) && s.endsWith(close) && s.length > 1) {
      const inner = s.slice(1, -1);
      // Only unwrap if there isn't an unmatched quote inside (avoid mangling dialogue).
      if (!inner.includes(open)) s = inner.trim();
      break;
    }
  }

  // Strip markdown emphasis: **bold**, __bold__, *italic*, _italic_.
  s = s.replace(/\*\*(.+?)\*\*/g, "$1");
  s = s.replace(/__(.+?)__/g, "$1");
  s = s.replace(/(^|[\s(])\*(\S(?:.*?\S)?)\*(?=[\s).,!?]|$)/g, "$1$2");
  s = s.replace(/(^|[\s(])_(\S(?:.*?\S)?)_(?=[\s).,!?]|$)/g, "$1$2");

  // Remove markdown header markers (## Heading -> Heading). Requires a space so #hashtags survive.
  s = s.replace(/^#{1,6}[ \t]+/gm, "");

  // Remove leading bullet markers ("- ", "* ") at the start of a line.
  s = s.replace(/^[ \t]*[-*][ \t]+/gm, "");

  // Collapse 3+ blank lines down to a single blank line.
  s = s.replace(/\n{3,}/g, "\n\n");

  return s.trim();
}
