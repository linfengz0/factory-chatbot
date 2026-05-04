import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Render markdown to HTML, injecting clickable factory-name spans
 * for patterns like "FA17523846 - FACTORY NAME" or standalone factory IDs.
 */
export function renderMarkdown(markdown: string): string {
  // First pass: markdown -> HTML via marked
  const rawHtml = marked.parse(markdown, { async: false }) as string;

  // Second pass: sanitize
  const clean = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'code', 'pre', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'span', 'div', 'hr', 'img',
    ],
    ALLOWED_ATTR: ['href', 'target', 'class', 'data-factory', 'src', 'alt'],
  });

  // Third pass: find factory ID patterns and wrap in clickable spans
  // Pattern: optional code prefix (2-6 uppercase letters/numbers) followed by factory name
  return injectFactoryLinks(clean);
}

const FACTORY_PATTERNS = [
  // FA17523846 - LAI FAT FASHION LTD (ID followed by name with dash)
  /(FA\d{5,})\s*(?:[-–—]\s*([A-Z][A-Za-z\s&.'’]+?(?:\s*(?:Ltd|LTD|Limited|Inc|Corp|Co|Company|GmbH|SA|SAS|SRL|PLC|Group|International|Enterprise|Industries|Fashion|Apparel|Garment|Textile|Clothing)\.?)))/gi,
  // TH001 - Tusuka Denim Ltd.
  /(TH\d{3,})\s*(?:[-–—]\s*([A-Z][A-Za-z\s&.'’]+?(?:\s*(?:Ltd|LTD|Limited|Inc|Corp|Co|Company|GmbH|SA|SAS|SRL|PLC|Group|International|Enterprise|Industries|Fashion|Apparel|Garment|Textile|Clothing)\.?)))/gi,
];

function injectFactoryLinks(html: string): string {
  let result = html;

  for (const pattern of FACTORY_PATTERNS) {
    // Reset lastIndex since we reuse the regex
    pattern.lastIndex = 0;
    result = result.replace(pattern, (_match, factoryId: string, factoryName: string) => {
      return `<span class="factory-name" data-factory="${factoryId.toUpperCase()}">${factoryId} - ${factoryName}</span>`;
    });
  }

  // Also catch standalone factory IDs that appear in table cells or inline
  // FA + 5+ digits
  result = result.replace(/\b(FA\d{5,})\b(?![\s]*[-–—])/gi, (_match, factoryId: string) => {
    return `<span class="factory-name" data-factory="${factoryId.toUpperCase()}">${factoryId}</span>`;
  });

  return result;
}

/**
 * Lightweight: just sanitize without marked (for plain text system messages).
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
