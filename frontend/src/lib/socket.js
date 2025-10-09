import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_BACKEND_URL

export const socket = io(SOCKET_URL, {
  path: '/socket.io',
  transports: ['websocket'],
  autoConnect: true,
})
