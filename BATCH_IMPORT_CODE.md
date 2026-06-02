# Agregar endpoint de importación por lote

## Paso 1 - Agregar este método al MediaController

Agrega este método dentro del objeto `MediaController` (después del método `importFromJson`):

```typescript
// POST /admin/import/batch - Importar múltiples películas desde JSON
async importBatchFromJson(c: Context) {
    try {
        const { movies } = await c.req.json()

        if (!Array.isArray(movies)) {
            return ok(c, {
                success: false,
                message: 'El formato debe ser { movies: [...] }'
            })
        }

        const results = {
            total: movies.length,
            successful: 0,
            failed: 0,
            errors: [] as Array<{ title: string; error: string }>
        }

        for (const movie of movies) {
            try {
                const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null
                const slug = movie.original_title
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')
                const finalSlug = year ? `${slug}-${year}` : slug

                const mediaData = {
                    tmdb_id: movie.tmdb_id,
                    imdb_id: movie.imdb_id || null,
                    media_type: MediaType.Movie,
                    slug: finalSlug,
                    original_title: movie.original_title,
                    original_language: movie.original_language,
                    release_date: movie.release_date || null,
                    runtime_minutes: movie.runtime_minutes || null,
                    tmdb_popularity: movie.tmdb_popularity || 0,
                    title_es: movie.title_es || null,
                    title_en: movie.title_en || null,
                    synopsis_es: movie.synopsis_es || null,
                    synopsis_en: movie.synopsis_en || null,
                    poster_path: movie.poster_path || null,
                    backdrop_path: movie.backdrop_path || null,
                    status: ContentStatus.Archived,
                    noindex: true,
                    sitemap_priority: SitemapPriority.Medium,
                    tmdb_last_synced_at: new Date().toISOString()
                }

                const result = await MediaService.upsertFromSync(mediaData)

                // Sincronizar géneros
                if (movie.genres && movie.genres.length > 0) {
                    await MediaService.syncGenres(result.id, movie.genres.map((g: any) => g.id))
                }

                // Sincronizar videos (formato TMDB)
                if (movie.videos && movie.videos.length > 0) {
                    await MediaService.syncVideos(result.id, movie.videos.map((v: any) => ({
                        locale: v.locale || v.iso_639_1,
                        video_type: v.type.toLowerCase(),
                        video_site: v.site.toLowerCase(),
                        external_key: v.key,
                        title: v.name,
                        published_at: v.published_at,
                        is_official: v.official
                    })))
                }

                results.successful++
            } catch (error) {
                results.failed++
                results.errors.push({
                    title: movie.original_title,
                    error: error instanceof Error ? error.message : String(error)
                })
            }
        }

        return ok(c, {
            success: true,
            message: 'Importación por lote completada',
            results
        })
    } catch (err) {
        return serverError(c, err)
    }
}
```

## Paso 2 - Agregar la ruta

En `api-control/src/routes/media.routes.ts`, agrega:

```typescript
mediaRoutes.post('/admin/import/batch', MediaController.importBatchFromJson)
```

## Paso 3 - Uso desde el frontend

El endpoint acepta un JSON con el formato:

```json
{
  "movies": [
    {
      "tmdb_id": 123,
      "original_title": "Movie Title",
      "release_date": "2024-01-01",
      ...
    }
  ]
}
```

Ejemplo de llamada:

```javascript
const response = await fetch('http://localhost:3000/api/media/admin/import/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ movies: jsonExportado.movies })
})
```

Respuesta:

```json
{
  "success": true,
  "message": "Importación por lote completada",
  "results": {
    "total": 10,
    "successful": 8,
    "failed": 2,
    "errors": [
      {
        "title": "Movie 1",
        "error": "Error message"
      }
    ]
  }
}
```
