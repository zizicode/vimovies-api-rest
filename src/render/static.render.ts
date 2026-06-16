// api-control/src/render/static.render.ts

const BASE_URL = process.env.SITE_URL?.replace(/\/$/, '') ?? 'https://vimovies.com'
const OG_IMAGE = `${BASE_URL}/og-image.png`
const TWITTER_HANDLE = '@vimovies'
const SITE_NAME = 'Vimovies'

// ── Tipos ─────────────────────────────────────────────────────
export interface StaticPageMeta {
  title_es: string
  title_en: string
  description_es: string
  description_en: string
  canonical_es: string
  canonical_en: string
  og_image?: string
}

export interface RenderMeta {
  title: string
  description: string
  canonical: string
  og: {
    title: string
    description: string
    image: string
    type: string
    url: string
    site_name: string
  }
  twitter: {
    card: string
    title: string
    description: string
    image: string
    site: string
  }
  alternates: {
    es: string
    en: string
  }
  schema: Record<string, unknown>
}

// ── Mapa de páginas estáticas ─────────────────────────────────
export const STATIC_META: Record<string, StaticPageMeta> = {
  // Listados
  'peliculas': {
    title_es: 'Películas Online en HD | Vimovies',
    title_en: 'HD Movies Online | Vimovies',
    description_es: 'Explora nuestro catálogo completo de películas. Filtra por género, año y plataforma. Descubre dónde ver cada título en streaming.',
    description_en: 'Explore our complete movie catalog. Filter by genre, year and platform. Discover where to stream each title.',
    canonical_es: `${BASE_URL}/peliculas`,
    canonical_en: `${BASE_URL}/movies`,
  },
  'movies': {
    title_es: 'Películas Online en HD | Vimovies',
    title_en: 'HD Movies Online | Vimovies',
    description_es: 'Explora nuestro catálogo completo de películas. Filtra por género, año y plataforma. Descubre dónde ver cada título en streaming.',
    description_en: 'Explore our complete movie catalog. Filter by genre, year and platform. Discover where to stream each title.',
    canonical_es: `${BASE_URL}/peliculas`,
    canonical_en: `${BASE_URL}/movies`,
  },
  'actores': {
    title_es: 'Actores y Directores de Cine | Vimovies',
    title_en: 'Movie Actors and Directors | Vimovies',
    description_es: 'Descubre actores, directores y todo el talento detrás de tus películas favoritas. Biografías, filmografías y más.',
    description_en: 'Discover actors, directors and the talent behind your favorite movies. Biographies, filmographies and more.',
    canonical_es: `${BASE_URL}/actores`,
    canonical_en: `${BASE_URL}/actors`,
  },
  'actors': {
    title_es: 'Actores y Directores de Cine | Vimovies',
    title_en: 'Movie Actors and Directors | Vimovies',
    description_es: 'Descubre actores, directores y todo el talento detrás de tus películas favoritas. Biografías, filmografías y más.',
    description_en: 'Discover actors, directors and the talent behind your favorite movies. Biographies, filmographies and more.',
    canonical_es: `${BASE_URL}/actores`,
    canonical_en: `${BASE_URL}/actors`,
  },
  'generos': {
    title_es: 'Géneros de Películas | Vimovies',
    title_en: 'Movie Genres | Vimovies',
    description_es: 'Explora películas por género: acción, comedia, drama, terror, ciencia ficción y mucho más.',
    description_en: 'Browse movies by genre: action, comedy, drama, horror, sci-fi and much more.',
    canonical_es: `${BASE_URL}/generos`,
    canonical_en: `${BASE_URL}/genres`,
  },
  'genres': {
    title_es: 'Géneros de Películas | Vimovies',
    title_en: 'Movie Genres | Vimovies',
    description_es: 'Explora películas por género: acción, comedia, drama, terror, ciencia ficción y mucho más.',
    description_en: 'Browse movies by genre: action, comedy, drama, horror, sci-fi and much more.',
    canonical_es: `${BASE_URL}/generos`,
    canonical_en: `${BASE_URL}/genres`,
  },
  'articulos': {
    title_es: 'Artículos y Críticas de Cine | Vimovies',
    title_en: 'Movie Articles and Reviews | Vimovies',
    description_es: 'Lee artículos, críticas, noticias y análisis del mundo del cine y el streaming.',
    description_en: 'Read articles, reviews, news and analysis from the world of cinema and streaming.',
    canonical_es: `${BASE_URL}/articulos`,
    canonical_en: `${BASE_URL}/articles`,
  },
  'articles': {
    title_es: 'Artículos y Críticas de Cine | Vimovies',
    title_en: 'Movie Articles and Reviews | Vimovies',
    description_es: 'Lee artículos, críticas, noticias y análisis del mundo del cine y el streaming.',
    description_en: 'Read articles, reviews, news and analysis from the world of cinema and streaming.',
    canonical_es: `${BASE_URL}/articulos`,
    canonical_en: `${BASE_URL}/articles`,
  },

  // Informativas
  'sobre-nosotros': {
    title_es: 'Sobre Nosotros | Vimovies',
    title_en: 'About Us | Vimovies',
    description_es: 'Conoce al equipo detrás de Vimovies, la plataforma de referencia para el cine y el streaming.',
    description_en: 'Meet the team behind Vimovies, the go-to platform for movies and streaming.',
    canonical_es: `${BASE_URL}/sobre-nosotros`,
    canonical_en: `${BASE_URL}/about-us`,
  },
  'about-us': {
    title_es: 'Sobre Nosotros | Vimovies',
    title_en: 'About Us | Vimovies',
    description_es: 'Conoce al equipo detrás de Vimovies, la plataforma de referencia para el cine y el streaming.',
    description_en: 'Meet the team behind Vimovies, the go-to platform for movies and streaming.',
    canonical_es: `${BASE_URL}/sobre-nosotros`,
    canonical_en: `${BASE_URL}/about-us`,
  },
  'contacto': {
    title_es: 'Contacto | Vimovies',
    title_en: 'Contact | Vimovies',
    description_es: 'Ponte en contacto con el equipo de Vimovies. Resolvemos tus dudas y atendemos tus sugerencias.',
    description_en: 'Get in touch with the Vimovies team. We answer your questions and welcome your suggestions.',
    canonical_es: `${BASE_URL}/contacto`,
    canonical_en: `${BASE_URL}/contacto`,
  },

  // Legales
  'terminos': {
    title_es: 'Términos de Servicio | Vimovies',
    title_en: 'Terms of Service | Vimovies',
    description_es: 'Lee los términos y condiciones de uso de Vimovies.',
    description_en: 'Read the terms and conditions of use for Vimovies.',
    canonical_es: `${BASE_URL}/terminos`,
    canonical_en: `${BASE_URL}/terms`,
  },
  'terms': {
    title_es: 'Términos de Servicio | Vimovies',
    title_en: 'Terms of Service | Vimovies',
    description_es: 'Lee los términos y condiciones de uso de Vimovies.',
    description_en: 'Read the terms and conditions of use for Vimovies.',
    canonical_es: `${BASE_URL}/terminos`,
    canonical_en: `${BASE_URL}/terms`,
  },
  'privacidad': {
    title_es: 'Política de Privacidad | Vimovies',
    title_en: 'Privacy Policy | Vimovies',
    description_es: 'Conoce cómo Vimovies gestiona y protege tus datos personales.',
    description_en: 'Learn how Vimovies manages and protects your personal data.',
    canonical_es: `${BASE_URL}/privacidad`,
    canonical_en: `${BASE_URL}/privacy`,
  },
  'privacy': {
    title_es: 'Política de Privacidad | Vimovies',
    title_en: 'Privacy Policy | Vimovies',
    description_es: 'Conoce cómo Vimovies gestiona y protege tus datos personales.',
    description_en: 'Learn how Vimovies manages and protects your personal data.',
    canonical_es: `${BASE_URL}/privacidad`,
    canonical_en: `${BASE_URL}/privacy`,
  },
  'cookies': {
    title_es: 'Política de Cookies | Vimovies',
    title_en: 'Cookie Policy | Vimovies',
    description_es: 'Información sobre el uso de cookies en Vimovies y cómo gestionarlas.',
    description_en: 'Information about the use of cookies on Vimovies and how to manage them.',
    canonical_es: `${BASE_URL}/cookies`,
    canonical_en: `${BASE_URL}/cookies`,
  },
}

// ── Generador principal ───────────────────────────────────────
export function buildStaticRenderMeta(
  slug: string,
  locale: 'es' | 'en'
): RenderMeta | null {
  const page = STATIC_META[slug]
  if (!page) return null

  const isEs      = locale === 'es'
  const title       = isEs ? page.title_es       : page.title_en
  const description = isEs ? page.description_es : page.description_en
  const canonical   = isEs ? page.canonical_es   : page.canonical_en
  const image       = page.og_image ?? OG_IMAGE

  return {
    title,
    description,
    canonical,
    og: {
      title,
      description,
      image,
      type     : 'website',
      url      : canonical,
      site_name: SITE_NAME,
    },
    twitter: {
      card       : 'summary_large_image',
      title,
      description,
      image,
      site       : TWITTER_HANDLE,
    },
    alternates: {
      es: page.canonical_es,
      en: page.canonical_en,
    },
    schema: {
      '@context'  : 'https://schema.org',
      '@type'     : 'WebPage',
      name        : title,
      description,
      url         : canonical,
      inLanguage  : isEs ? 'es' : 'en',
      isPartOf    : {
        '@type': 'WebSite',
        name   : SITE_NAME,
        url    : BASE_URL,
      },
    },
  }
}

// ── Helper: body HTML para crawlers ──────────────────────────
export function buildStaticBody(title: string, description: string): string {
  return `
    <main>
      <section>
        <h1>${title}</h1>
        <p>${description}</p>
      </section>
    </main>`
}