import { Server as HttpServer } from 'http'

import { Server } from 'socket.io'

import { verifyToken } from '@/utils/auth.utils'

let io: Server | null = null

// Tipos de eventos para sincronización
export interface SyncJobStatus {
  jobId: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  isRunning: boolean;
  isPaused: boolean;
  isStopped: boolean;
  startedAt: number;
  elapsedTime: number;
  totalMovies: number;
  currentMovieIndex: number;
  processed: number;
  errors: number;
  skipped: number;
  updated: number;
  new: number;
  progress?: {
    currentMovie: {
      tmdbId: number;
      title: string;
      year?: number;
      voteAverage?: number;
      voteCount?: number;
      popularity?: number;
      posterPath?: string;
      backdropPath?: string;
      currentStep: string;
      stepIndex: number;
      totalSteps: number;
    };
    overall: {
      processed: number;
      errors: number;
      total: number;
      percentage: number;
    };
  };
  results?: any[];
  lastUpdated: number;
}

/**
 * Inicializar Socket.IO con el servidor HTTP
 */
export function initializeSocket(httpServer: HttpServer) {
  if (io) {
    console.log('[Socket] Socket.IO already initialized')
    return io
  }

  // Crear instancia de Socket.IO
  io = new Server(httpServer, {
    cors: {
      origin: process.env.WEB_URL || process.env.DASHBOARD_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  console.log('[Socket] Socket.IO initialized')

  // ── Middleware de autenticación para Socket.IO ───────────────────────────────────
  
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return next(new Error('Authentication required'))
      }

      // Verificar token directamente
      const payload = await verifyToken(token)
      
      if (!payload) {
        return next(new Error('Invalid or expired token'))
      }

      // Verificar que sea admin
      if (!['admin', 'super_admin'].includes(payload.role)) {
        return next(new Error('Admin access required'))
      }

      // Guardar usuario en el socket
      socket.data.user = payload
      console.log(`[Socket] Auth successful: ${payload.name} (${payload.role})`)
      next()
    } catch (error) {
      console.log('[Socket] Auth failed:', error)
      next(new Error('Authentication failed'))
    }
  })

  // ── Conexión de admins ────────────────────────────────────────────────────────────────

  io.on('connection', (socket) => {
    const user = socket.data.user
    console.log(`[Socket] Admin connected: ${socket.id} - ${user.name} (${user.role})`)

    // Unirse a la sala de admins
    socket.join('admins')
    socket.emit('connected', { message: 'Connected to sync updates', user: { id: user.id, name: user.name, role: user.role } })

    // Enviar lista de jobs activos actual
    socket.emit('sync:active_jobs', getActiveJobs())

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Admin disconnected: ${socket.id} - ${reason}`)
    })

    socket.on('error', (error) => {
      console.error(`[Socket] Error:`, error)
    })
  })

  return io
}

/**
 * Obtener la instancia de Socket.IO
 */
export function getSocketIO(): Server | null {
  return io
}

/**
 * Emitir actualización de estado de sincronización a todos los admins
 */
export function broadcastSyncUpdate(jobStatus: SyncJobStatus) {
  if (!io) {
    console.log('[Socket] Socket.IO not initialized, skipping broadcast')
    return
  }

  console.log(`[Socket] Broadcasting sync update for job: ${jobStatus.jobId}`)
  
  // Enviar a todos los admins conectados
  io.to('admins').emit('sync:update', jobStatus)
}

/**
 * Emitir cuando un nuevo job de sincronización se inicia
 */
export function broadcastSyncStarted(jobStatus: SyncJobStatus) {
  if (!io) return
  
  console.log(`[Socket] Broadcasting sync started: ${jobStatus.jobId}`)
  io.to('admins').emit('sync:started', jobStatus)
}

/**
 * Emitir cuando un job de sincronización se completa
 */
export function broadcastSyncCompleted(jobStatus: SyncJobStatus) {
  if (!io) return
  
  console.log(`[Socket] Broadcasting sync completed: ${jobStatus.jobId}`)
  io.to('admins').emit('sync:completed', jobStatus)
}

/**
 * Emitir cuando ocurre un error en la sincronización
 */
export function broadcastSyncError(jobId: string, error: string) {
  if (!io) return
  
  console.log(`[Socket] Broadcasting sync error: ${jobId}`)
  io.to('admins').emit('sync:error', { jobId, error, timestamp: Date.now() })
}

/**
 * Emitir lista actualizada de jobs activos
 */
export function broadcastActiveJobs() {
  if (!io) return
  
  const activeJobs = getActiveJobs()
  io.to('admins').emit('sync:active_jobs', activeJobs)
}

/**
 * Obtener lista de jobs activos (simulado - debería integrarse con el servicio real)
 */
function getActiveJobs(): any[] {
  // Aquí deberías obtener los jobs reales del SyncMoviesService
  // Por ahora retornamos un array vacío
  return []
}
