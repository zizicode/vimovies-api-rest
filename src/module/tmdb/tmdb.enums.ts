
export enum TmdbEndpoint {
    // Movies
    MOVIE_DETAILS = '/movie/{id}',
    MOVIE_ALTERNATIVE_TITLES = '/movie/{id}/alternative_titles',
    MOVIE_CHANGES = '/movie/{id}/changes',
    MOVIE_CREDITS = '/movie/{id}/credits',
    MOVIE_EXTERNAL_IDS = '/movie/{id}/external_ids',
    MOVIE_IMAGES = '/movie/{id}/images',
    MOVIE_KEYWORDS = '/movie/{id}/keywords',
    MOVIE_RELEASE_DATES = '/movie/{id}/release_dates',
    MOVIE_REVIEWS = '/movie/{id}/reviews',
    MOVIE_SIMILAR = '/movie/{id}/similar',
    MOVIE_RECOMMENDATIONS = '/movie/{id}/recommendations',
    MOVIE_TRANSLATIONS = '/movie/{id}/translations',
    MOVIE_VIDEOS = '/movie/{id}/videos',
    MOVIE_WATCH_PROVIDERS = '/movie/{id}/watch/providers',

    // Collections
    COLLECTION_DETAILS = '/collection/{id}',

    // People
    PERSON_DETAILS = '/person/{id}',
    PERSON_MOVIE_CREDITS = '/person/{id}/movie_credits',
    PERSON_IMAGES = '/person/{id}/images',
    PERSON_EXTERNAL_IDS = '/person/{id}/external_ids',

    // Search
    SEARCH_MOVIE = '/search/movie',
    SEARCH_PERSON = '/search/person',
    SEARCH_MULTI = '/search/multi',

    // Discover
    DISCOVER_MOVIE = '/discover/movie',

    // Trending
    TRENDING_MOVIE_DAY = '/trending/movie/day',
    TRENDING_MOVIE_WEEK = '/trending/movie/week',
    TRENDING_PERSON_WEEK = '/trending/person/week',

    // Listings
    MOVIE_POPULAR = '/movie/popular',
    MOVIE_TOP_RATED = '/movie/top_rated',
    MOVIE_NOW_PLAYING = '/movie/now_playing',
    MOVIE_UPCOMING = '/movie/upcoming',

    // Genres
    GENRE_MOVIE_LIST = '/genre/movie/list',

    // Configuration
    CONFIGURATION = '/configuration',
}

export function buildTmdbEndpoint(
    endpoint: TmdbEndpoint,
    params?: Record<string, string | number>
): string {
    let path: string = endpoint

    if (!params) return path

    Object.entries(params).forEach(([key, value]) => {
        path = path.replace(`{${key}}`, String(value))
    })

    return path
}