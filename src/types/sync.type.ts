import { ContentStatus, SitemapPriority, VideoSite, VideoType } from '@/enums'

export interface SyncMoviesRequest {
  // Búsqueda básica
  movieCount: number                    // Cantidad de películas a buscar
  searchStrategy: 'single_search' | 'multiple_searches' // Estrategia de búsqueda
  
  // Filtros de calidad
  minVoteAverage?: number               // Puntuación mínima (0-10)
  minVoteCount?: number                 // Cantidad mínima de votos
  minPopularity?: number                // Popularidad mínima
  
  // Filtros de contenido
  includeAdult?: boolean                // Incluir contenido adulto
  originalLanguage?: string             // Idioma original (ej: 'en', 'es')
  releaseYearStart?: number             // Año de lanzamiento mínimo
  releaseYearEnd?: number               // Año de lanzamiento máximo
  
  // Géneros
  allowedGenres?: number[]              // IDs de géneros permitidos
  requireAllGenres?: boolean            // Si debe tener TODOS los géneros especificados
  
  // Idiomas requeridos
  requireSpanishVersion?: boolean       // Requerir versión en español
  requireEnglishVersion?: boolean       // Requerir versión en inglés
  
  // Límites de relaciones
  maxCast?: number                      // Máximo de actores a sincronizar
  maxCrew?: number                      // Máximo de equipo a sincronizar
  crewJobs?: string[]                   // Puestos de equipo a sincronizar
  
  // Videos y plataformas
  syncVideos?: boolean                  // Sincronizar videos
  videoTypes?: VideoType[]              // Tipos de video a incluir
  includeOfficialVideosOnly?: boolean   // Solo videos oficiales
  videoSites?: VideoSite[]              // Sitios de video permitidos
  
  syncWatchProviders?: boolean          // Sincronizar plataformas de streaming
  providerRegions?: string[]           // Regiones para providers
  
  // Control de existentes
  updateExisting?: boolean              // Actualizar si ya existe
  preserveEditorial?: boolean           // Preservar datos editoriales al actualizar
  preserveSeo?: boolean                 // Preservar datos SEO al actualizar
  
  // Configuración por defecto
  defaultStatus?: ContentStatus          // Estado por defecto para nuevas películas
  defaultNoindex?: boolean              // Noindex por defecto
  defaultSitemapPriority?: SitemapPriority // Prioridad sitemap por defecto
  
  // Control de sincronización
  delayBetweenMovies?: number           // Delay entre películas (ms)
  maxPagesToSearch?: number             // Máximo de páginas a buscar
}

export interface MovieSyncProgress {
  currentMovie: {
    tmdbId: number
    title: string
    voteAverage?: number
    voteCount?: number
    popularity?: number
    posterPath?: string
    backdropPath?: string
    currentStep: string
    stepIndex: number
    totalSteps: number
  }
  overall: {
    processed: number
    errors: number
    total: number
    percentage: number
  }
}

export interface MovieSyncResult {
  tmdbId: number
  title: string
  year?: number
  voteAverage?: number
  voteCount?: number
  popularity?: number
  posterPath?: string
  backdropPath?: string
  success: boolean
  error?: string
  skipped?: boolean
  updated?: boolean
  stepsCompleted?: string[]
}

export interface SyncMoviesResponse {
  success: boolean
  jobId: string
  status: 'running' | 'completed' | 'failed' | 'stopped'
  results?: {
    processed: number
    errors: number
    skipped: number
    updated: number
    new: number
    elapsedTime: number
  }
  progress?: MovieSyncProgress
  details?: MovieSyncResult[]
  error?: string
}

// Géneros recomendados para SEO
export const RECOMMENDED_GENRES = [
  { id: 28, name: 'Acción', priority: 'high' },
  { id: 12, name: 'Aventura', priority: 'high' },
  { id: 16, name: 'Animación', priority: 'high' },
  { id: 35, name: 'Comedia', priority: 'high' },
  { id: 80, name: 'Crimen', priority: 'medium' },
  { id: 99, name: 'Documental', priority: 'medium' },
  { id: 18, name: 'Drama', priority: 'high' },
  { id: 10751, name: 'Familia', priority: 'medium' },
  { id: 14, name: 'Fantasía', priority: 'high' },
  { id: 36, name: 'Historia', priority: 'low' },
  { id: 27, name: 'Horror', priority: 'medium' },
  { id: 10402, name: 'Música', priority: 'low' },
  { id: 9648, name: 'Misterio', priority: 'medium' },
  { id: 10749, name: 'Romance', priority: 'medium' },
  { id: 878, name: 'Ciencia Ficción', priority: 'high' },
  { id: 10770, name: 'Película de TV', priority: 'low' },
  { id: 53, name: 'Suspense', priority: 'medium' },
  { id: 10752, name: 'Bélica', priority: 'medium' },
  { id: 37, name: 'Western', priority: 'low' }
]

// Puestos de equipo recomendados para sincronizar
export const DEFAULT_CREW_JOBS = [
  'Director',
  'Screenplay', 
  'Story',
  'Producer',
  'Executive Producer',
  'Original Music Composer',
  'Director of Photography',
  'Editor',
  'Production Design',
  'Art Direction',
  'Set Decoration',
  'Costume Design',
  'Sound',
  'Visual Effects'
]

export const DEFAULT_VIDEO_TYPES = [
  VideoType.Trailer,
  VideoType.Teaser,
  VideoType.Clip,
  VideoType.Featurette,
  VideoType.BehindTheScenes
]

export const DEFAULT_VIDEO_SITES = [
  VideoSite.YouTube
]

export const DEFAULT_PROVIDER_REGIONS = [
  'ES', 'MX', 'AR', 'CO', 'US'
]
