import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'

let io: Server | null = null

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

  // ── Configurar canales - prendiente ─────────────────────────────────────────────

  // ── Conexión general (opcional) ────────────────────────────────────

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`)

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} - ${reason}`)
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
