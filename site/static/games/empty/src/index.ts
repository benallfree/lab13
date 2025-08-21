import pkg from '../package.json'
import './style.css'

export function safeWebSocket(url: string, onConnect: (ws: WebSocket) => void = () => {}, timeout = 3000) {
  const connect = () => {
    const ws = new WebSocket(url)
    const close = () => setTimeout(connect, timeout)
    ws.addEventListener('close', close)
    onConnect(ws)
  }
  connect()
}

let ws: WebSocket | null = null
const relayUrl = import.meta.env.VITE_RELAY_WS_URL || `ws://localhost:4321/parties/relay`
safeWebSocket(`${relayUrl}/${pkg.name}`, (websocket) => {
  ws = websocket

  ws.addEventListener('open', () => {})

  ws.addEventListener('message', (e) => {})

  ws.addEventListener('close', () => {})

  ws.addEventListener('error', () => {})
})
