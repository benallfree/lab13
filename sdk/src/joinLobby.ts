export type JoinLobbyOptions = {
  host?: string
}

export function joinLobby(room: string, options: JoinLobbyOptions = {}) {
  const { host = `https://online.js13kgames.com` } = options

  let ws: WebSocket,
    onOpen: (event: Event) => void,
    onMessage: (event: MessageEvent) => void,
    onError: (event: Event) => void,
    onClose: (event: Event) => void

  const connect = () => {
    ws = new WebSocket(`${host}/parties/js13k/js13k`)
    ws.onopen = (e) => onOpen?.(e)
    ws.onmessage = ({ data }) => {
      const { id } = JSON.parse(data)
      if (id) ws.send(`{"delta":{"_players":{"${id}":{"room":"${room}"}}}}`)
    }
    ws.onclose = (e) => {
      onClose?.(e)
      setTimeout(() => connect(), 3000)
    }
    ws.onerror = (e) => (onError?.(e), ws.close())
  }

  connect()
  return {
    on: (event: 'open' | 'message' | 'error' | 'close', callback: (event: Event) => void) => {
      if (event === 'open') onOpen = callback
      else if (event === 'message') onMessage = callback
      else if (event === 'error') onError = callback
      else if (event === 'close') onClose = callback
    },
  }
}
