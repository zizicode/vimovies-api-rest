# Ejemplos de Uso - API de Sincronización de Películas

## Autenticación
Todas las solicitudes requieren autenticación con rol de admin. Incluye el token JWT en el header:

```bash
Authorization: Bearer <tu_jwt_token>
```

## 1. Iniciar Sincronización Básica

### Solicitud
```bash
POST /admin/sync/movies/start
Content-Type: application/json
Authorization: Bearer <token>

{
  "movieCount": 20,
  "requireSpanishVersion": true
}
```

### Respuesta
```json
{
  "success": true,
  "jobId": "sync_2024_05_24_001",
  "message": "Sincronización iniciada",
  "config": {
    "movieCount": 20,
    "requireSpanishVersion": true,
    "searchStrategy": "multiple_searches",
    "defaultStatus": "draft"
  }
}
```

## 2. Sincronización de Alta Calidad

### Solicitud
```bash
POST /admin/sync/movies/start
Content-Type: application/json
Authorization: Bearer <token>

{
  "movieCount": 50,
  "minVoteAverage": 7.0,
  "minVoteCount": 1000,
  "minPopularity": 20,
  "requireSpanishVersion": true,
  "maxCast": 20,
  "maxCrew": 20,
  "defaultStatus": "published",
  "defaultNoindex": false,
  "delayBetweenMovies": 1000
}
```

### Respuesta
```json
{
  "success": true,
  "jobId": "sync_2024_05_24_002",
  "message": "Sincronización iniciada",
  "config": {
    "movieCount": 50,
    "minVoteAverage": 7.0,
    "minVoteCount": 1000,
    "minPopularity": 20,
    "requireSpanishVersion": true,
    "maxCast": 20,
    "maxCrew": 20,
    "defaultStatus": "published",
    "defaultNoindex": false,
    "delayBetweenMovies": 1000,
    "searchStrategy": "multiple_searches"
  }
}
```

## 3. Sincronización por Géneros Específicos

### Solicitud
```bash
POST /admin/sync/movies/start
Content-Type: application/json
Authorization: Bearer <token>

{
  "movieCount": 100,
  "allowedGenres": [28, 12, 16, 35, 18, 14, 878],
  "requireAllGenres": false,
  "requireSpanishVersion": true,
  "requireEnglishVersion": true,
  "syncVideos": true,
  "syncWatchProviders": true,
  "maxCast": 15,
  "maxCrew": 15,
  "defaultStatus": "published",
  "defaultNoindex": false,
  "includeOfficialVideosOnly": true
}
```

## 4. Sincronización Familiar

### Solicitud
```bash
POST /admin/sync/movies/start
Content-Type: application/json
Authorization: Bearer <token>

{
  "movieCount": 75,
  "includeAdult": false,
  "allowedGenres": [16, 10751, 12, 14],
  "minVoteAverage": 6.0,
  "requireSpanishVersion": true,
  "maxCast": 15,
  "defaultStatus": "published",
  "defaultNoindex": false
}
```

## 5. Verificar Estado de Sincronización

### Solicitud
```bash
GET /admin/sync/movies/sync_2024_05_24_001/status
Authorization: Bearer <token>
```

### Respuesta (En Progreso)
```json
{
  "success": true,
  "jobId": "sync_2024_05_24_001",
  "status": "running",
  "progress": {
    "currentMovie": {
      "tmdbId": 12345,
      "title": "Inception",
      "currentStep": "Sincronizando videos",
      "stepIndex": 4,
      "totalSteps": 7
    },
    "overall": {
      "processed": 8,
      "errors": 0,
      "total": 20,
      "percentage": 40
    }
  }
}
```

### Respuesta (Completado)
```json
{
  "success": true,
  "jobId": "sync_2024_05_24_001",
  "status": "completed",
  "results": {
    "processed": 20,
    "errors": 0,
    "skipped": 2,
    "updated": 5,
    "new": 15,
    "elapsedTime": 45000
  },
  "details": [
    {
      "tmdbId": 12345,
      "title": "Inception",
      "success": true,
      "updated": false,
      "stepsCompleted": ["Búsqueda", "Creación", "Géneros", "Créditos", "Videos", "Providers", "SEO"]
    },
    {
      "tmdbId": 67890,
      "title": "The Dark Knight",
      "success": true,
      "updated": true,
      "stepsCompleted": ["Búsqueda", "Actualización", "Géneros", "Créditos", "Videos", "Providers"]
    }
  ]
}
```

## 6. Control de Sincronización

### Pausar Sincronización
```bash
POST /admin/sync/movies/sync_2024_05_24_001/pause
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "jobId": "sync_2024_05_24_001",
  "message": "Job pausado"
}
```

### Reanudar Sincronización
```bash
POST /admin/sync/movies/sync_2024_05_24_001/resume
Authorization: Bearer <token>
```

### Detener Sincronización
```bash
POST /admin/sync/movies/sync_2024_05_24_001/stop
Authorization: Bearer <token>
```

## 7. Obtener Configuración Recomendada

### Solicitud
```bash
GET /admin/sync/movies/config
Authorization: Bearer <token>
```

### Respuesta
```json
{
  "success": true,
  "recommendedGenres": [
    { "id": 28, "name": "Acción", "priority": "high" },
    { "id": 12, "name": "Aventura", "priority": "high" },
    { "id": 16, "name": "Animación", "priority": "high" }
  ],
  "defaultCrewJobs": [
    "Director", "Screenplay", "Story", "Producer",
    "Executive Producer", "Original Music Composer"
  ],
  "defaultVideoTypes": ["Trailer", "Teaser", "Clip", "Featurette", "BehindTheScenes"],
  "defaultVideoSites": ["YouTube"],
  "defaultProviderRegions": ["ES", "MX", "AR", "CO", "US"],
  "presets": {
    "highQuality": {
      "movieCount": 50,
      "minVoteAverage": 7.0,
      "minVoteCount": 1000,
      "requireSpanishVersion": true,
      "defaultStatus": "published"
    },
    "bulkImport": {
      "movieCount": 200,
      "minVoteAverage": 5.0,
      "requireSpanishVersion": false,
      "defaultStatus": "draft"
    },
    "seoOptimized": {
      "movieCount": 100,
      "allowedGenres": [28, 12, 16, 35, 18, 14, 878],
      "requireSpanishVersion": true,
      "requireEnglishVersion": true,
      "defaultStatus": "published"
    }
  }
}
```

## 8. Ejemplo Completo con JavaScript/TypeScript

```typescript
class SyncMoviesAPI {
  private baseURL = 'http://localhost:3000';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.token}`
  };

  async startSync(config: any) {
    const response = await fetch(`${this.baseURL}/admin/sync/movies/start`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(config)
    });
    
    return response.json();
  }

  async getStatus(jobId: string) {
    const response = await fetch(`${this.baseURL}/admin/sync/movies/${jobId}/status`, {
      headers: this.headers
    });
    
    return response.json();
  }

  async waitForCompletion(jobId: string, pollInterval = 2000) {
    while (true) {
      const status = await this.getStatus(jobId);
      
      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }
      
      console.log(`Progreso: ${status.progress?.overall?.percentage || 0}%`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}

// Uso
const api = new SyncMoviesAPI('tu_jwt_token');

// Iniciar sincronización de alta calidad
const syncResult = await api.startSync({
  movieCount: 50,
  minVoteAverage: 7.0,
  requireSpanishVersion: true,
  defaultStatus: 'published'
});

// Esperar completion
const finalResult = await api.waitForCompletion(syncResult.jobId);
console.log(`Sincronización completada: ${finalResult.results.new} películas nuevas`);
```

## 9. Manejo de Errores

### Error de Validación
```json
{
  "success": false,
  "error": "Si especificas allowedGenres, debe contener al menos un género"
}
```

### Job No Encontrado
```json
{
  "success": false,
  "error": "Job no encontrado"
}
```

### Error del Servidor
```json
{
  "success": false,
  "error": "Error interno del servidor",
  "details": "TMDB API rate limit exceeded"
}
```

## 10. Buenas Prácticas

1. **Monitoreo**: Usa el endpoint `/status` para monitorear el progreso
2. **Control**: Implementa pausas/reanudaciones para largas sincronizaciones
3. **Filtros**: Usa filtros de calidad para evitar contenido irrelevante
4. **Preservación**: Activa `preserveEditorial` y `preserveSeo` al actualizar
5. **Rate Limiting**: Usa `delayBetweenMovies` para no sobrecargar APIs externas
6. **Limpieza**: Usa `/cleanup` periódicamente para remover jobs antiguos
