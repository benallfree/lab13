/// <reference path="./worker-configuration.d.ts" />

import { mergeState } from 'js13k-mmo-sdk'
import { Connection, ConnectionContext, routePartykitRequest, Server, WSMessage } from 'partyserver'

type RoomName = string
type RoomState = {
  players: Record<string, any>
}
type State = Record<RoomName, RoomState>

// Define your Server
export class Js13kServer extends Server {
  private state: State = {}

  getRoomState() {
    return this.state[this.name] || { players: {} }
  }

  setRoomState(state: RoomState) {
    this.state[this.name] = state
  }

  onConnect(conn: Connection, ctx: ConnectionContext) {
    // A websocket just connected!
    console.log(
      `Connected:
    id: ${conn.id}
    room: ${this.name}
    url: ${new URL(ctx.request.url).pathname}`
    )

    // Create empty entry in players collection for this connection
    const currentState = this.getRoomState()
    currentState.players[conn.id] = {}
    this.setRoomState(currentState)

    // Send initial state to new connection
    conn.send(JSON.stringify({ state: this.getRoomState() }))

    // Send the client their own ID
    conn.send(JSON.stringify({ id: conn.id }))

    // Broadcast connect event to all other clients
    this.broadcast(JSON.stringify({ connect: conn.id }), [conn.id])
  }

  onMessage(conn: Connection, message: WSMessage) {
    try {
      const data = JSON.parse(message.toString())

      if (data.delta) {
        // Merge delta into state
        this.setRoomState(mergeState(this.getRoomState(), data.delta))

        // Broadcast delta to all other clients
        this.broadcast(message, [conn.id])

        console.log(`Delta applied from ${conn.id}:`, data.delta)
      } else {
        // Handle other message types
        console.log(`connection ${conn.id} sent message: ${message}`)
        this.broadcast(message, [conn.id])
      }
    } catch (error) {
      console.error('Error parsing message:', error)
    }
  }

  onClose(conn: Connection) {
    console.log(`Connection ${conn.id} disconnected`)

    // Remove the disconnected client's data from state
    const currentState = this.getRoomState()
    if (currentState.players[conn.id]) {
      delete currentState.players[conn.id]
      this.setRoomState(currentState)
      console.log(`Removed ${conn.id} from room state`)
    }

    // Broadcast disconnect event to all remaining clients
    this.broadcast(JSON.stringify({ disconnect: conn.id }))
  }
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
