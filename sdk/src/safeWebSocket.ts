export function safeWebSocket(url: string, onConnect: (ws: WebSocket) => void = () => {}, timeout = 3000) {
  const connect = () => {
    const ws = new WebSocket(url)
    const close = () => setTimeout(connect, timeout)
    ws.addEventListener('close', close)
    onConnect(ws)
  }
  connect()
}
