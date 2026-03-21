import sanitizeHtmlLib from 'sanitize-html'

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'a',
  'div',
  'span',
]

export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      '*': ['class'],
    },
  })
}

export function sanitizeTitle(title: string): string {
  return sanitizeHtmlLib(title, { allowedTags: [], allowedAttributes: {} }).trim()
}

export function stripHtml(html: string): string {
  return sanitizeHtmlLib(html, { allowedTags: [], allowedAttributes: {} })
}

export function isHtmlEmpty(html: string): boolean {
  return !html || stripHtml(html).trim() === ''
}
