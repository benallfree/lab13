import { randomUUID } from 'crypto'
import express from 'express'
import { createServer as createHttpServer } from 'http'
import WebSocket, { WebSocketServer } from 'ws'

export async function runRelay(): Promise<void> {
  const app = express()
  const server = createHttpServer(app)
  const rooms = new Map<string, Set<WebSocket>>()
  const connectionIds = new Map<WebSocket, string>()
  const port = Number(process.env.PORT) || 4321

  const wss = new WebSocketServer({ noServer: true })

  // Helper function to send messages with consistent binary: false setting
  const send = (ws: WebSocket, message: string) => {
    try {
      ws.send(message, { binary: false })
    } catch {}
  }

  // Helper function to broadcast messages to all clients in a room
  const broadcast = (room: string, message: string, excludeIds?: string[]) => {
    const current = rooms.get(room)
    if (!current) return

    for (const client of current) {
      const clientId = connectionIds.get(client)
      if (excludeIds && clientId && excludeIds.includes(clientId)) {
        continue
      }
      send(client, message)
    }
  }

  wss.on('connection', (ws: WebSocket, request: any, room: string) => {
    const connectionId = randomUUID()
    connectionIds.set(ws, connectionId)

    let listeners = rooms.get(room)
    if (!listeners) {
      listeners = new Set()
      console.log('new room', room)
      rooms.set(room, listeners)
    }
    console.log('add connection to room', room)
    listeners.add(ws)

    // Send the client their ID
    send(ws, `@${connectionId}`)

    // Notify other clients about the new connection
    broadcast(room, `+${connectionId}`, [connectionId])

    ws.on('message', (data: any) => {
      console.log('rx', data.toString())
      broadcast(room, data.toString(), [connectionId])
    })

    ws.on('close', () => {
      const current = rooms.get(room)
      if (!current) return
      console.log('remove connection from room', room)
      current.delete(ws)

      // Notify other clients about the disconnection
      const disconnectedId = connectionIds.get(ws)
      if (disconnectedId) {
        broadcast(room, `-${disconnectedId}`)
        connectionIds.delete(ws)
      }

      if (current.size === 0) rooms.delete(room)
    })
  })

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '/', 'http://localhost')
    const match = url.pathname.match(/^\/parties\/relay\/(.+)$/)
    if (!match) return (socket as any).destroy()
    const room = decodeURIComponent(match[1]!)
    wss.handleUpgrade(request as any, socket as any, head as any, (ws) => {
      wss.emit('connection', ws, request as any, room)
    })
  })

  server.listen(port, () => {
    console.log(`Relay listening on ws://localhost:${port}/parties/relay/<room>`)
  })
}
