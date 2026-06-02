-- ============================================
-- LIMPIEZA COMPLETA DE DATOS
-- ============================================
-- Ejecutar en orden para respetar foreign keys

-- 1. Eliminar datos de relaciones (tablas intermedias)
DELETE FROM user_watchlist_items;
DELETE FROM user_watchlists;
DELETE FROM user_reviews;
DELETE FROM curated_list_items;
DELETE FROM article_media_mentions;
DELETE FROM article_tags;
DELETE FROM article_faqs;
DELETE FROM media_watch_providers;
DELETE FROM media_ratings;
DELETE FROM media_videos;
DELETE FROM media_credits;
DELETE FROM media_genres;

-- 2. Eliminar datos principales
DELETE FROM users;
DELETE FROM curated_lists;
DELETE FROM tags;
DELETE FROM articles;
DELETE FROM article_categories;
DELETE FROM authors;
DELETE FROM platforms;
DELETE FROM people;
DELETE FROM media;
DELETE FROM genres;
DELETE FROM sitemap_index;
DELETE FROM redirects;
DELETE FROM seo_audit_log;

-- 3. Resetear secuencias (si usas PostgreSQL)
-- ALTER SEQUENCE genres_id_seq RESTART WITH 1;
-- ALTER SEQUENCE platforms_id_seq RESTART WITH 1;
-- ALTER SEQUENCE article_categories_id_seq RESTART WITH 1;


-- ============================================
-- INSERTAR DATOS INICIALES (SEED DATA)
-- ============================================
-- Basado en el archivo guia.md

-- Sitemap Index
INSERT INTO sitemap_index (section, filename, priority) VALUES
  ('home',      'sitemap-home.xml',      'critical'),
  ('peliculas', 'sitemap-peliculas.xml', 'medium'),
  ('series',    'sitemap-series.xml',    'medium'),
  ('actores',   'sitemap-actores.xml',   'low'),
  ('generos',   'sitemap-generos.xml',   'high'),
  ('articulos', 'sitemap-articulos.xml', 'high'),
  ('plataformas','sitemap-plataformas.xml','medium');

-- Géneros (TMDB standard IDs)
INSERT INTO genres (tmdb_id, slug, name_es, name_en, sitemap_priority) VALUES
  (28,    'accion',           'Acción',           'Action',         'high'),
  (12,    'aventura',         'Aventura',          'Adventure',      'high'),
  (16,    'animacion',        'Animación',         'Animation',      'high'),
  (35,    'comedia',          'Comedia',           'Comedy',         'high'),
  (80,    'crimen',           'Crimen',            'Crime',          'high'),
  (99,    'documental',       'Documental',        'Documentary',    'medium'),
  (18,    'drama',            'Drama',             'Drama',          'high'),
  (10751, 'familia',          'Familia',           'Family',         'medium'),
  (14,    'fantasia',         'Fantasía',          'Fantasy',        'high'),
  (36,    'historia',         'Historia',          'History',        'medium'),
  (27,    'terror',           'Terror',            'Horror',         'high'),
  (10402, 'musica',           'Música',            'Music',          'medium'),
  (9648,  'misterio',         'Misterio',          'Mystery',        'high'),
  (10749, 'romance',          'Romance',           'Romance',        'medium'),
  (878,   'ciencia-ficcion',  'Ciencia Ficción',   'Science Fiction','high'),
  (10770, 'television',       'Televisión',        'TV Movie',       'low'),
  (53,    'thriller',         'Thriller',          'Thriller',       'high'),
  (10752, 'guerra',           'Guerra',            'War',            'medium'),
  (37,    'western',          'Western',           'Western',        'medium');

-- Plataformas (Streaming)
INSERT INTO platforms (slug, name_es, name_en, platform_type, tmdb_provider_id, display_order) VALUES
  ('netflix',       'Netflix',          'Netflix',          'svod', 8,    1),
  ('prime-video',   'Prime Video',      'Prime Video',      'svod', 119,  2),
  ('disney-plus',   'Disney+',          'Disney+',          'svod', 337,  3),
  ('hbo-max',       'Max',              'Max',              'svod', 384,  4),
  ('apple-tv-plus', 'Apple TV+',        'Apple TV+',        'svod', 350,  5),
  ('paramount',     'Paramount+',       'Paramount+',       'svod', 531,  6),
  ('star-plus',     'Star+',            'Star+',            'svod', 619,  7),
  ('mubi',          'MUBI',             'MUBI',             'svod', 11,   8),
  ('crunchyroll',   'Crunchyroll',      'Crunchyroll',      'svod', 283,  9),
  ('pluto-tv',      'Pluto TV',         'Pluto TV',         'avod', 300, 10);

-- Categorías de Artículos
INSERT INTO article_categories (slug, name_es, name_en) VALUES
  ('mejores-peliculas',    'Mejores Películas',     'Best Movies'),
  ('donde-ver',            'Dónde Ver',             'Where to Watch'),
  ('novedades-streaming',  'Novedades en Streaming','Streaming News'),
  ('analisis',             'Análisis',              'Analysis'),
  ('listas',               'Listas',                'Lists'),
  ('curiosidades',         'Curiosidades',          'Fun Facts'),
  ('proximos-estrenos',    'Próximos Estrenos',     'Upcoming Releases');


-- ============================================
-- NOTAS:
-- ============================================
-- 1. Los datos iniciales incluyen: sitemap_index, géneros TMDB, plataformas streaming y categorías de artículos
-- 2. Las películas, personas, autores y artículos se importan posteriormente a través de la API
-- 3. Si necesitas datos de ejemplo adicionales, usa la API de sincronización o el script de importación
