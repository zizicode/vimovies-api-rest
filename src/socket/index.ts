import { Server as SocketIOServer } from 'socket.io'
import type { Server } from 'node:http'

export const initSocket = (server: Server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: [
        'https://www.vimovies.com',
        'http://localhost:5173',
        'http://localhost:3000'
      ],
      credentials: true
    }
  })

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id)

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id)
    })
  })
}
