export interface Genres {
    id: number
    name: string
}


  export interface PersonDetails {
    adult: boolean
    also_known_as: string[]
    biography: string
    birthday: string | null
    deathday: string | null
    gender: number
    homepage: string | null
    id: number
    imdb_id: string | null
    known_for_department: string
    name: string
    place_of_birth: string | null
    popularity: number
    profile_path: string | null
  }


export interface Collection {
    id: number
    name: string
    poster_path: string | null
    backdrop_path: string | null
}

export interface MovieListResponse {
    page: number
    results: Array<{
        id: number
        title: string
        original_title: string
        original_language: string
        release_date: string
        poster_path: string | null
        backdrop_path: string | null
        popularity: number
        vote_average: number
        vote_count: number
        adult: boolean
        overview: string
        genre_ids: number[]
    }>
    total_pages: number
    total_results: number
}


export interface SpokenLanguage {
    english_name: string
    iso_639_1: string
    name: string
}

export interface ProductionCompany {
    id: number
    logo_path: string | null
    name: string
    origin_country: string
}

export interface Cast {
    adult: boolean
    gender: number
    id: number
    known_for_department: string
    name: string
    original_name: string
    popularity: number
    profile_path: string | null
    cast_id: number
    character: string
    credit_id: string
    order: number
}

export interface Crew {
    adult: boolean
    gender: number
    id: number
    known_for_department: string
    name: string
    original_name: string
    popularity: number
    profile_path: string | null
    credit_id: string
    department: string
    job: string
}


export interface Credits {
    cast: Cast[]
    crew: Crew[]
}


export interface ProductionCountry {
    iso_3166_1: string
    name: string
}

export interface MovieDetails {
    adult: boolean
    backdrop_path: string | null
    belongs_to_collection: Collection | null
    budget: number
    genres: Genres[]
    homepage: string
    id: number
    imdb_id: string | null
    origin_country: string[]
    original_language: string
    original_title: string
    overview: string
    popularity: number
    poster_path: string | null
    production_companies: ProductionCompany[]
    production_countries: ProductionCountry[]
    release_date: string
    revenue: number
    runtime: number
    softcore: boolean
    spoken_languages: SpokenLanguage[]
    status: string
    tagline: string
    title: string
    video: boolean
    vote_average: number
    vote_count: number
    credits: Credits
}

export interface LocalizedData<T> {
    es: T | null
    en: T | null
}