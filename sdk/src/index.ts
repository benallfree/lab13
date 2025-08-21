import { PartySocket } from 'partysocket'

export type Lab13ClientApi = ReturnType<typeof Lab13Client>

export type Lab13ClientEventMap = {
  'player-id-updated': CustomEvent<string>
  'client-connected': CustomEvent<string>
  'client-disconnected': CustomEvent<string>
  'client-ids-updated': CustomEvent<string[]>
  'player-ids-updated': CustomEvent<string[]>
  'bot-ids-updated': CustomEvent<string[]>
} & WebSocketEventMap

export type Lab13ClientOptions = {
  bot: boolean
}

export type ClientType = 'player' | 'bot'

export const Lab13Client = (socket: PartySocket, options?: Partial<Lab13ClientOptions>) => {
  const { bot = false } = options || {}

  let playerId: string | null = null
  const clientIds = new Set<string>()
  const playerIds = new Set<string>()
  const botIds = new Set<string>()
  const clientType: ClientType = bot ? 'bot' : 'player'

  socket.addEventListener('message', (event) => {
    const msg = event.data.toString()

    console.log('got message', msg.slice(0, 1))
    switch (msg[0]) {
      case '@':
        playerId = msg.slice(1)
        if (bot) {
          api.sendToAll(`b${playerId}`)
        }
        socket.dispatchEvent(new CustomEvent('player-id-updated', { detail: playerId }))
        break
      case 'b':
        const botId = msg.slice(1)
        clientIds.add(botId)
        botIds.add(botId)
        playerIds.delete(botId)
        console.log('got bot')
        socket.dispatchEvent(new CustomEvent('client-ids-updated', { detail: Array.from(clientIds) }))
        socket.dispatchEvent(new CustomEvent('player-ids-updated', { detail: Array.from(playerIds) }))
        socket.dispatchEvent(new CustomEvent('bot-ids-updated', { detail: Array.from(botIds) }))
        break
      case '+':
        const newClientId = msg.slice(1)
        clientIds.add(newClientId)
        botIds.delete(newClientId)
        playerIds.add(newClientId) // Assume it's a player until it gets upgraded to a bot
        socket.dispatchEvent(new CustomEvent('client-connected', { detail: newClientId }))
        socket.dispatchEvent(new CustomEvent('client-ids-updated', { detail: Array.from(clientIds) }))
        socket.dispatchEvent(new CustomEvent('player-ids-updated', { detail: Array.from(playerIds) }))
        socket.dispatchEvent(new CustomEvent('bot-ids-updated', { detail: Array.from(botIds) }))
        break
      case '-':
        const disconnectedClientId = msg.slice(1)
        clientIds.delete(disconnectedClientId)
        playerIds.delete(disconnectedClientId)
        botIds.delete(disconnectedClientId)
        socket.dispatchEvent(new CustomEvent('player-disconnected', { detail: disconnectedClientId }))
        socket.dispatchEvent(new CustomEvent('player-ids-updated', { detail: Array.from(playerIds) }))
        socket.dispatchEvent(new CustomEvent('bot-ids-updated', { detail: Array.from(botIds) }))
        socket.dispatchEvent(new CustomEvent('client-ids-updated', { detail: Array.from(clientIds) }))
        break
      case '?':
        {
          const subCommand = msg[1]
          switch (subCommand) {
            case 'i':
              const replyPlayerId = msg.slice(2)
              if (playerId) {
                api.sendToPlayer(replyPlayerId, `.i${playerId}${bot ? '|b' : ''}`)
              }
              break
            default:
              break
          }
        }
        break
      case '.':
        {
          const subCommand = msg[1]
          switch (subCommand) {
            case 'i':
              const [newClientId, isBot] = msg.slice(2).split('|')
              clientIds.add(newClientId)
              if (isBot) {
                botIds.add(newClientId)
                playerIds.delete(newClientId)
              } else {
                playerIds.add(newClientId)
                botIds.delete(newClientId)
              }
              socket.dispatchEvent(new CustomEvent('client-ids-updated', { detail: Array.from(clientIds) }))
              socket.dispatchEvent(new CustomEvent('player-ids-updated', { detail: Array.from(playerIds) }))
              socket.dispatchEvent(new CustomEvent('bot-ids-updated', { detail: Array.from(botIds) }))
              break
            default:
              break
          }
        }
        break
      default:
        break
    }
  })

  const api = {
    queryPlayerIds: () => {
      if (playerId) {
        socket.send(`?i${playerId}`)
      }
    },
    on<K extends keyof Lab13ClientEventMap>(
      event: K,
      callback: (
        event: Lab13ClientEventMap[K] extends Event ? Lab13ClientEventMap[K] : never
      ) => Lab13ClientEventMap[K] extends Event ? void : never
    ) {
      // @ts-expect-error because PartySocket inherits from <WebSocketEventMap>
      socket.addEventListener(event, callback)
    },
    off<K extends keyof Lab13ClientEventMap>(
      event: K,
      callback: (
        event: Lab13ClientEventMap[K] extends Event ? Lab13ClientEventMap[K] : never
      ) => Lab13ClientEventMap[K] extends Event ? void : never
    ) {
      // @ts-expect-error because PartySocket inherits from <WebSocketEventMap>
      socket.removeEventListener(event, callback)
    },
    playerId: () => playerId,
    clientIds: () => Array.from(clientIds),
    playerIds: () => Array.from(playerIds),
    botIds: () => Array.from(botIds),
    clientType: () => clientType,
    sendToPlayer: (playerId: string, message: string) => {
      socket.send(`@${playerId}|${message}`)
    },
    sendToAll: (message: string) => {
      socket.send(`${message}`)
    },
  }

  return api
}

declare global {
  interface Window {
    Lab13Client: typeof Lab13Client
  }
}

if (typeof window !== 'undefined') {
  window.Lab13Client = Lab13Client
}
