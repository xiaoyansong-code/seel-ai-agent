/**
 * Simple Markdown → HTML converter for initializing TipTap editor.
 * Handles the subset of Markdown used in Guidance documents:
 * headings, bold, italic, lists, blockquotes, horizontal rules, paragraphs.
 */
export function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const result: string[] = [];
  let inUl = false;
  let inOl = false;

  function closeLists() {
    if (inUl) { result.push("</ul>"); inUl = false; }
    if (inOl) { result.push("</ol>"); inOl = false; }
  }

  function inlineFormat(text: string): string {
    // Bold + italic
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italic
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
    return text;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    // Empty line
    if (trimmed === "") {
      closeLists();
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      closeLists();
      result.push("<hr>");
      continue;
    }

    // Headings
    const h3Match = trimmed.match(/^### (.+)/);
    if (h3Match) {
      closeLists();
      result.push(`<h3>${inlineFormat(h3Match[1])}</h3>`);
      continue;
    }
    const h2Match = trimmed.match(/^## (.+)/);
    if (h2Match) {
      closeLists();
      result.push(`<h2>${inlineFormat(h2Match[1])}</h2>`);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      closeLists();
      result.push(`<blockquote><p>${inlineFormat(trimmed.slice(2))}</p></blockquote>`);
      continue;
    }

    // Unordered list item
    const ulMatch = trimmed.match(/^[-*] (.+)/);
    if (ulMatch) {
      if (inOl) { result.push("</ol>"); inOl = false; }
      if (!inUl) { result.push("<ul>"); inUl = true; }
      result.push(`<li><p>${inlineFormat(ulMatch[1])}</p></li>`);
      continue;
    }

    // Ordered list item (also handle sub-items with leading spaces)
    const olMatch = trimmed.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (inUl) { result.push("</ul>"); inUl = false; }
      if (!inOl) { result.push("<ol>"); inOl = true; }
      result.push(`<li><p>${inlineFormat(olMatch[1])}</p></li>`);
      continue;
    }

    // Sub-list item (indented with spaces, treat as nested UL item within current list)
    const subUlMatch = trimmed.match(/^\s+[-*] (.+)/);
    if (subUlMatch) {
      // Keep in current list context, just add as list item
      if (!inUl && !inOl) { result.push("<ul>"); inUl = true; }
      result.push(`<li><p>${inlineFormat(subUlMatch[1])}</p></li>`);
      continue;
    }

    // Regular paragraph
    closeLists();
    result.push(`<p>${inlineFormat(trimmed)}</p>`);
  }

  closeLists();
  return result.join("\n");
}
