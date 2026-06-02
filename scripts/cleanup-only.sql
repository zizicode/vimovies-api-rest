-- ============================================
-- LIMPIEZA COMPLETA DE DATOS (SOLO BORRADO)
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
-- Descomenta si necesitas resetear los IDs autoincrementales
-- ALTER SEQUENCE genres_id_seq RESTART WITH 1;
-- ALTER SEQUENCE platforms_id_seq RESTART WITH 1;
-- ALTER SEQUENCE article_categories_id_seq RESTART WITH 1;
