// Escapa caracteres especiales para XML válido
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Construye URL absoluta sin doble slash
export function buildUrl(base: string, path: string): string {
  const cleanBase = base.replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${cleanBase}${cleanPath}`
}

// Formatea fecha a YYYY-MM-DD
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return new Date().toISOString().split('T')[0] || ''
  const dateStr = new Date(date as string | Date).toISOString().split('T')[0]
  return dateStr || ''
}

// Genera el bloque xhtml:link para hreflang (ES ↔ EN)
export function buildHreflang(esUrl: string, enUrl: string): string {
  return `
    <xhtml:link rel="alternate" hreflang="es" href="${escapeXml(esUrl)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enUrl)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(enUrl)}"/>`
}

// Genera una entrada <url> completa
export function buildUrlEntry(params: {
  loc: string
  lastmod?: string | null
  changefreq: string
  priority: number
  esUrl: string
  enUrl: string
}): string {
  return `
  <url>
    <loc>${escapeXml(params.loc)}</loc>
    <lastmod>${formatDate(params.lastmod)}</lastmod>
    <changefreq>${params.changefreq}</changefreq>
    <priority>${params.priority.toFixed(1)}</priority>${buildHreflang(params.esUrl, params.enUrl)}
  </url>`
}

// Envuelve entradas en el tag urlset con namespace hreflang
export function wrapUrlset(entries: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('')}
</urlset>`
}

// Headers HTTP correctos para XML
export function xmlHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/xml; charset=utf-8',
    'X-Robots-Tag': 'noindex',
    'Cache-Control': 'public, max-age=3600',
  }
}
