import sanitizeHtml from "sanitize-html";

/**
 * Email HTML is untrusted, attacker-controlled content — this is a
 * classic XSS/tracking vector, not a formality. Two layers of defense:
 *
 *  1. This sanitizer strips scripts, event handlers, styles (CSS can
 *     exfiltrate via background-image url()), and non-http(s)/mailto
 *     link/image schemes, and blocks remote images unless the caller
 *     explicitly allows them (tracking-pixel protection, same idea as
 *     Gmail/Apple Mail's "show images" prompt).
 *  2. The sanitized output is rendered inside a sandboxed <iframe>
 *     without `allow-scripts` or `allow-same-origin` (see
 *     MessageBody.tsx), so even a sanitizer bug can't execute script —
 *     the sandbox blocks that regardless of what slips through.
 */

const ALLOWED_TAGS = [
  "a", "b", "strong", "i", "em", "u", "p", "br", "div", "span", "ul", "ol", "li",
  "table", "thead", "tbody", "tr", "td", "th", "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote", "hr", "img", "font", "center", "small", "sub", "sup",
];

export function containsRemoteImage(html: string): boolean {
  return /<img[^>]+src\s*=\s*["']https?:\/\//i.test(html);
}

export function sanitizeEmailHtml(html: string, { allowRemoteImages }: { allowRemoteImages: boolean }): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "title"],
      img: allowRemoteImages ? ["src", "alt", "width", "height"] : ["alt", "width", "height"],
      td: ["colspan", "rowspan", "align", "valign"],
      th: ["colspan", "rowspan", "align", "valign"],
      table: ["cellpadding", "cellspacing", "border"],
      font: ["color", "size", "face"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: allowRemoteImages ? ["http", "https"] : [] },
    disallowedTagsMode: "discard",
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
  });
}
