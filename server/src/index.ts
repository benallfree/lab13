/// <reference path="./worker-configuration.d.ts" />

import type { GameState, PartialDeep } from 'js13k-online'
import { filterDeltaWithTombstones, mergeState } from 'js13k-online'
import { Connection, ConnectionContext, getServerByName, routePartykitRequest, Server, WSMessage } from 'partyserver'

const LOBBY_SERVER_NAME = `js13k`

type GameStats = {
  playerCount: number
}
// Define your Server
export class Js13kServer extends Server<Env> {
  private games: Record<string, GameStats> = { [LOBBY_SERVER_NAME]: { playerCount: 0 } }

  private state: GameState = { _players: {} }
  // Track deleted entity GUIDs (collection-agnostic)
  private tombstones: Set<string> = new Set<string>()

  updatePlayerCount(delta: number, gameSlug = this.name) {
    if (!this.games[gameSlug]) {
      this.games[gameSlug] = { playerCount: 0 }
    }
    this.games[gameSlug].playerCount = Math.max(0, this.games[gameSlug].playerCount + delta)

    if (this.name === LOBBY_SERVER_NAME) {
      this.games[LOBBY_SERVER_NAME].playerCount = Math.max(0, this.games[LOBBY_SERVER_NAME].playerCount + delta)
      console.log(`[${this.name}] Room stats:`, JSON.stringify(this.games, null, 2))
      this.broadcast(
        JSON.stringify({
          stats: {
            games: this.games,
          },
        })
      )
    } else {
      getServerByName(this.env.js13k, LOBBY_SERVER_NAME).then((lobby) => {
        lobby.updatePlayerCount(delta, this.name)
      })
      this.broadcast(
        JSON.stringify({
          stats: {
            totalPlayerCount: this.games[this.name].playerCount,
          },
        })
      )
    }
  }

  onConnect(conn: Connection, ctx: ConnectionContext) {
    // A websocket just connected!
    console.log(
      `Connected:
    id: ${conn.id}
    room: ${this.name}
    url: ${new URL(ctx.request.url).pathname}`
    )

    if (this.name !== LOBBY_SERVER_NAME) {
      this.updatePlayerCount(1)
    }

    // Create empty entry in _players collection for this connection
    this.state._players[conn.id] = {}

    // Send initial state to new connection
    conn.send(JSON.stringify({ state: this.state }))

    // Send the client their own ID
    conn.send(JSON.stringify({ id: conn.id }))

    // Broadcast connect event to all other clients
    this.broadcast(JSON.stringify({ connect: conn.id }), [conn.id])
  }

  onMessage(conn: Connection, message: WSMessage) {
    try {
      const data = JSON.parse(message.toString())

      if (data.delta) {
        // Filter incoming delta against tombstones and collect new deletions
        const filtered = filterDeltaWithTombstones(data.delta as PartialDeep<GameState>, this.tombstones)

        // If nothing remains after filtering (only trailing updates to deleted entities), drop it
        if (Object.keys(filtered).length === 0) {
          // Nothing to apply or broadcast
          return
        }

        // Merge filtered delta into state
        this.state = mergeState(this.state, filtered)

        console.log(`Delta applied from ${conn.id}:`, filtered)

        // Broadcast filtered delta to all other clients
        this.broadcast(JSON.stringify({ delta: filtered }), [conn.id])
      } else {
        // Handle other message types
        console.log(`connection ${conn.id} sent message: ${message}`)
        this.broadcast(message, [conn.id])
      }
    } catch (error) {
      console.error('Error parsing message. Blindly broadcasting:')
      this.broadcast(message, [conn.id])
    }
  }

  onClose(conn: Connection) {
    console.log(`Connection ${conn.id} disconnected`)

    if (this.name !== LOBBY_SERVER_NAME) {
      this.updatePlayerCount(-1)
    }

    // Remove the disconnected client's data from state
    delete this.state._players[conn.id]
    console.log(`Removed ${conn.id} from room state`)

    // Broadcast disconnect event to all remaining clients
    this.broadcast(JSON.stringify({ disconnect: conn.id }))
  }

  // No per-collection sets needed; GUIDs are global
}

// Private helpers
export interface NestedObject {
  [key: string]: any
}

export default {
  // Set up your fetch handler to use configured Servers
  async fetch(request: Request, env: Env) {
    const res = await routePartykitRequest(request, env as any)
    if (res) return res

    if (env.ENVIRONMENT === 'development') {
      const url = new URL(request.url)
      const docusaurusUrl = `http://localhost:3000${url.pathname}${url.search}`
      // console.log(`Forwarding request to Docusaurus dev server: ${docusaurusUrl}`)
      return fetch(docusaurusUrl, request)
    }

    // @ts-ignore
    return env.ASSETS.fetch(request)
  },
}
