/**
 * Breaks a journal line into short rows for the 1080×1920 share card. SVG text
 * does not wrap on its own, and a single 70-character line would run off the
 * card, so the card asks for wrapped lines instead.
 */
export const CARD_LINE_WIDTH = 46;

export function wrapCardLine(text: string, maxChars = CARD_LINE_WIDTH, maxLines = 3): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (current === '') {
      // A single very long word is hard-cut rather than left to overflow.
      current = word.slice(0, maxChars);
      continue;
    }

    if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`;
      continue;
    }

    lines.push(current);
    current = word.slice(0, maxChars);

    if (lines.length === maxLines) break;
  }

  if (lines.length < maxLines && current) lines.push(current);

  // Anything that did not fit gets an ellipsis on the last visible line.
  const shown = lines.join(' ');
  if (shown.length < text.trim().length && lines.length > 0) {
    const last = lines.length - 1;
    const line = lines[last];
    lines[last] = line.length >= maxChars ? `${line.slice(0, maxChars - 1)}…` : `${line}…`;
  }

  return lines.slice(0, maxLines);
}
