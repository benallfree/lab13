import { PartySocket } from 'partysocket'

// Compact GUID generator - 16 chars, very unique
export const generateId = () => {
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  return (t + r).slice(-16)
}

export type GameState = Record<string, any> & {
  _players?: Record<string, { id: string; [key: string]: any }>
}

export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P]
}

export type Lab13ClientApi = ReturnType<typeof Lab13Client>

export type Lab13ClientEventMap = {
  'player-id-updated': CustomEvent<string>
  'client-connected': CustomEvent<string>
  'client-disconnected': CustomEvent<string>
  'client-ids-updated': CustomEvent<string[]>
  'player-ids-updated': CustomEvent<string[]>
  'bot-ids-updated': CustomEvent<string[]>
  'state-updated': CustomEvent<{ state: Record<string, any>; delta: Record<string, any> }>
} & WebSocketEventMap

export type Lab13ClientOptions = {
  bot: boolean
}

export type ClientType = 'player' | 'bot'

export const Lab13Client = <T extends GameState>(socket: PartySocket, options?: Partial<Lab13ClientOptions>) => {
  const { bot = false } = options || {}

  let playerId: string | null = null
  const clientIds = new Set<string>()
  const playerIds = new Set<string>()
  const botIds = new Set<string>()
  const clientType: ClientType = bot ? 'bot' : 'player'

  // State management
  let state: T = {} as T

  const tombstoneEntities = new Set<string>()

  // Deep merge utility function
  function deepMerge(
    target: Record<string, any>,
    source: Record<string, any>,
    isEntityCollection = false
  ): Record<string, any> {
    const result = { ...target }
    for (const key in source) {
      if (tombstoneEntities.has(key) && isEntityCollection) {
        continue
      }
      if (source[key] === null) {
        // Delete the key if the value is NULL
        delete result[key]
        if (isEntityCollection) {
          tombstoneEntities.add(key)
        }
      } else if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key], key.startsWith('_'))
      } else {
        result[key] = source[key]
      }
    }
    return result
  }

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

        // Remove from state._players if it's a bot
        if (state._players && state._players[botId]) {
          delete state._players[botId]
        }

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

        // Automatically add player to state._players
        if (!state._players) {
          state._players = {}
        }
        state._players[newClientId] = { id: newClientId }

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

        // Automatically remove player from state._players and tombstone it
        if (state._players && state._players[disconnectedClientId]) {
          delete state._players[disconnectedClientId]
          tombstoneEntities.add(disconnectedClientId)
        }

        socket.dispatchEvent(new CustomEvent('client-disconnected', { detail: disconnectedClientId }))
        socket.dispatchEvent(new CustomEvent('client-ids-updated', { detail: Array.from(clientIds) }))
        socket.dispatchEvent(new CustomEvent('player-ids-updated', { detail: Array.from(playerIds) }))
        socket.dispatchEvent(new CustomEvent('bot-ids-updated', { detail: Array.from(botIds) }))
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
            case 's':
              const replyId = msg.slice(2)
              api.sendToPlayer(replyId, `.s${JSON.stringify(state)}`)
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
                // Remove from state._players if it's a bot
                if (state._players && state._players[newClientId]) {
                  delete state._players[newClientId]
                }
              } else {
                playerIds.add(newClientId)
                botIds.delete(newClientId)
                // Add to state._players if it's a player
                if (!state._players) {
                  state._players = {}
                }
                if (!state._players[newClientId]) {
                  state._players[newClientId] = { id: newClientId }
                }
              }
              socket.dispatchEvent(new CustomEvent('client-ids-updated', { detail: Array.from(clientIds) }))
              socket.dispatchEvent(new CustomEvent('player-ids-updated', { detail: Array.from(playerIds) }))
              socket.dispatchEvent(new CustomEvent('bot-ids-updated', { detail: Array.from(botIds) }))
              break
            case 's':
              try {
                state = JSON.parse(msg.slice(2))
                socket.dispatchEvent(
                  new CustomEvent('state-updated', {
                    detail: { state },
                  })
                )
              } catch (e) {
                console.error('Failed to parse state data:', e)
              }
              break
            default:
              break
          }
        }
        break
      case 'd':
        try {
          const delta = JSON.parse(msg.slice(1))
          state = deepMerge(state, delta) as T
          socket.dispatchEvent(
            new CustomEvent('state-updated', {
              detail: { state, delta },
            })
          )
        } catch (e) {
          console.error('Failed to parse delta:', e)
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
    state: () => state,
    mutateState: (delta: PartialDeep<T>) => {
      state = deepMerge(state, delta) as T
      socket.send(`d${JSON.stringify(delta)}`)
      socket.dispatchEvent(
        new CustomEvent('state-updated', {
          detail: { state, delta },
        })
      )
    },
    generateId,
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
