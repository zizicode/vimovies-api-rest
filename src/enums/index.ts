export * from './media.enum'
export * from './person.enum'
export * from './sitemap.enum'
export * from './plataform.enum'

export enum SupportedLocale {
    ES = 'es',
    EN = 'en',
}

export enum RatingSource {
    TMDB = 'tmdb',
    IMDB = 'imdb',
    RTCritics = 'rt_critics',
    RTAudience = 'rt_audience',
    Vimovies = 'vimovies',
}

export enum VideoType {
    Trailer = 'trailer',
    Teaser = 'teaser',
    Clip = 'clip',
    Featurette = 'featurette',
    BehindTheScenes = 'behind_the_scenes',
    Bloopers = 'bloopers',
}

export enum VideoSite {
    YouTube = 'youtube',
    Vimeo = 'vimeo',
}
