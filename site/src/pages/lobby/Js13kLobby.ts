import { ClientOptions, EventCallback, GameState, Js13kClient } from '../../../static/sdk/index.js'

// Simple lobby wrapper to aggregate global lobby stats
export type LobbyStats = {
  totalPlayers: number
  games: Record<string, { totalPlayers: number }>
}

export type LobbyEvent = 'stats'

export class Js13kLobby {
  private client: Js13kClient<GameState>
  private listeners: Record<LobbyEvent, EventCallback[]>
  private idPromise: Promise<string>

  constructor(options: ClientOptions = {}) {
    this.client = new Js13kClient<{ _players: Record<string, any> }>('js13k', {
      debug: false,
      ...options,
    })
    this.listeners = { stats: [] }

    const emitStats = () => this.emit('stats', this.computeStats())
    this.client.on('state', emitStats)
    this.client.on('delta', emitStats)
    this.client.on('connect', emitStats)
    this.client.on('disconnect', emitStats)
    this.idPromise = new Promise((resolve) => {
      this.client.on('id', (id) => {
        console.log(`id`, id)
        resolve(id)
      })
    })
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

  private computeStats(): LobbyStats {
    const state = this.client.getState()
    const players = state && state._players ? state._players : {}
    const games: Record<string, { totalPlayers: number }> = {}
    let totalPlayers = 0
    for (const id of Object.keys(players)) {
      const room = players[id]?.room
      if (typeof room === 'string' && room) {
        games[room] = { totalPlayers: (games[room]?.totalPlayers || 0) + 1 }
        totalPlayers += 1
      }
    }
    return { totalPlayers, games }
  }
}
// Convenience function to connect and enter a lobby room in one line

export function connectToJs13kLobby(room: string, options: ClientOptions = {}): Js13kLobby {
  const lobby = new Js13kLobby(options)
  lobby.enterRoom(room)
  return lobby
}
