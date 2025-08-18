import { ClientOptions, EventCallback, GameState, Js13kClient } from '../../../static/sdk/index.js'

// Simple lobby wrapper to aggregate global lobby stats

export type GameStats = {
  playerCount: number
}
export type LobbyStats = {
  games: Record<string, GameStats>
}

export type LobbyEvent = 'stats'

export class Js13kLobby {
  private client: Js13kClient<GameState>
  private listeners: Record<LobbyEvent, EventCallback[]>
  private idPromise: Promise<string>

  constructor(options: ClientOptions = {}) {
    this.client = new Js13kClient('js13k', {
      ...options,
    })
    this.listeners = { stats: [] }

    this.client.on('stats', (stats) => this.emit('stats', stats))
  }

  enterRoom(room: string): void {
    this.idPromise.then(() => {
      this.client.updateMyState({ room })
    })
  }

  on(event: LobbyEvent, callback: (stats: LobbyStats) => void): void {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(callback as EventCallback)
  }

  off(event: LobbyEvent, callback: (stats: LobbyStats) => void): void {
    const list = this.listeners[event]
    if (!list) return
    const idx = list.indexOf(callback as unknown as EventCallback)
    if (idx >= 0) list.splice(idx, 1)
  }

  disconnect(): void {
    this.client.disconnect()
  }

  private emit(event: LobbyEvent, data: LobbyStats): void {
    const list = this.listeners[event]
    if (!list) return
    for (const cb of list) {
      try {
        cb(data)
      } catch (err) {
        console.error('Error in Js13kLobby listener', err)
      }
    }
  }
}
// Convenience function to connect and enter a lobby room in one line

export function connectToJs13kLobby(room: string, options: ClientOptions = {}): Js13kLobby {
  const lobby = new Js13kLobby(options)
  lobby.enterRoom(room)
  return lobby
}
