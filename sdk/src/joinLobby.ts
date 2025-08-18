import { safeWebSocket } from './safeWebSocket'

export type JoinLobbyOptions = {
  host?: string
  onConnect?: (ws: WebSocket) => void
  timeout?: number
}

export function joinLobby(gameSlug: string, options: JoinLobbyOptions = {}) {
  const { host = location.origin, onConnect = () => {}, timeout = 3000 } = options
  safeWebSocket(
    `${host}/parties/js13k/js13k`,
    (ws) => {
      ws.addEventListener('message', ({ data }) => {
        const { id } = JSON.parse(data)
        if (id) ws.send(`{"delta":{"_players":{"${id}":{"room":"${gameSlug}"}}}}`)
      })
      onConnect(ws)
    },
    timeout
  )
}
