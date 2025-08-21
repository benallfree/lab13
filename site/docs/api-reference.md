---
title: API Reference
sidebar_position: 6
---

# API Reference

Complete reference for the Lab 13 SDK classes, methods, and types.

## Lab13Client

The main client class for managing player connections and IDs in Lab 13 games.

### Constructor

```typescript
Lab13Client(socket: PartySocket, options?: Partial<Lab13ClientOptions>)
```

Creates a new Lab13Client instance that wraps a PartySocket connection.

**Parameters:**

- `socket` (PartySocket): An active PartySocket connection
- `options` (optional): Configuration options including bot support

**Example:**

```js
import { PartySocket } from 'partysocket'
import { Lab13Client } from 'https://esm.sh/js13k'

const socket = new PartySocket({
  host: 'your-party-server.com',
  room: 'my-game-room',
})

// Regular player client
const client = Lab13Client(socket)

// Bot client
const botClient = Lab13Client(socket, { bot: true })
```

### Methods

#### Player Management

##### `playerId(): string | null`

Returns your current player ID, or `null` if not yet assigned.

```js
const myId = client.playerId()
if (myId) {
  console.log('My player ID:', myId)
}
```

##### `clientIds(): string[]`

Returns an array of all connected client IDs (both players and bots).

```js
const allClients = client.clientIds()
console.log('All connected clients:', allClients)
```

##### `playerIds(): string[]`

Returns an array of all connected player IDs (excluding bots).

```js
const allPlayers = client.playerIds()
console.log('Connected players:', allPlayers)
```

##### `botIds(): string[]`

Returns an array of all connected bot IDs.

```js
const allBots = client.botIds()
console.log('Connected bots:', allBots)
```

##### `clientType(): ClientType`

Returns your client type ('player' or 'bot').

```js
const type = client.clientType()
console.log('I am a:', type) // 'player' or 'bot'
```

##### `queryPlayerIds(): void`

Requests an updated list of all player IDs from the server.

```js
// Request fresh player list
client.queryPlayerIds()
```

#### Communication

##### `sendToPlayer(playerId: string, message: string): void`

Sends a message to a specific player.

**Parameters:**

- `playerId` (string): The ID of the target player
- `message` (string): The message to send

```js
client.sendToPlayer('player-123', 'Hello there!')
```

##### `sendToAll(message: string): void`

Broadcasts a message to all connected players.

**Parameters:**

- `message` (string): The message to broadcast

```js
client.sendToAll('move:player-123,100,200')
client.sendToAll('chat:Hello everyone!')
```

#### Event System

##### `on(event: string, callback: Function): void`

Registers an event listener.

**Parameters:**

- `event` (string): Event name
- `callback` (Function): Event handler function

```js
client.on('player-id-updated', (event) => {
  console.log('My ID assigned:', event.detail)
})

client.on('client-connected', (event) => {
  console.log('Client joined:', event.detail)
})
```

##### `off(event: string, callback: Function): void`

Removes an event listener.

**Parameters:**

- `event` (string): Event name
- `callback` (Function): The same function reference passed to `on()`

```js
function handleClientConnect(event) {
  console.log('Client connected:', event.detail)
}

client.on('client-connected', handleClientConnect)
client.off('client-connected', handleClientConnect) // Remove the listener
```

### Events

The client emits several custom events during its lifecycle:

#### `player-id-updated`

Fired when you receive your unique player ID from the server.

**Event Detail:**

- `string`: Your unique player ID

```js
client.on('player-id-updated', (event) => {
  console.log('🆔 My player ID:', event.detail)

  // Initialize your player state
  initializePlayer(event.detail)
})
```

#### `client-connected`

Fired when another client (player or bot) connects to the same room.

**Event Detail:**

- `string`: The ID of the client who connected

```js
client.on('client-connected', (event) => {
  console.log('👋 Client joined:', event.detail)

  // Add them to your game
  addClientToGame(event.detail)
})
```

#### `client-disconnected`

Fired when another client (player or bot) disconnects from the room.

**Event Detail:**

- `string`: The ID of the client who disconnected

```js
client.on('client-disconnected', (event) => {
  console.log('👋 Client left:', event.detail)

  // Remove them from your game
  removeClientFromGame(event.detail)
})
```

#### `client-ids-updated`

Fired when the complete list of client IDs is updated.

**Event Detail:**

- `string[]`: Array of all connected client IDs

```js
client.on('client-ids-updated', (event) => {
  console.log('📋 All clients:', event.detail)

  // Update your client list
  updateClientList(event.detail)
})
```

#### `player-ids-updated`

Fired when the list of player IDs (excluding bots) is updated.

**Event Detail:**

- `string[]`: Array of all connected player IDs

```js
client.on('player-ids-updated', (event) => {
  console.log('📋 All players:', event.detail)

  // Update your player list
  updatePlayerList(event.detail)
})
```

#### `bot-ids-updated`

Fired when the list of bot IDs is updated.

**Event Detail:**

- `string[]`: Array of all connected bot IDs

```js
client.on('bot-ids-updated', (event) => {
  console.log('🤖 All bots:', event.detail)

  // Update your bot list
  updateBotList(event.detail)
})
```

### WebSocket Events

The client also supports all standard WebSocket events through the underlying PartySocket:

```js
client.on('open', () => {
  console.log('✅ Connected to server')
})

client.on('close', () => {
  console.log('❌ Disconnected from server')
})

client.on('error', (error) => {
  console.error('WebSocket error:', error)
})
```

## Types

### Lab13ClientApi

The return type of the Lab13Client function.

```typescript
type Lab13ClientApi = {
  queryPlayerIds: () => void
  on: <K extends keyof Lab13ClientEventMap>(
    event: K,
    callback: (
      event: Lab13ClientEventMap[K] extends Event ? Lab13ClientEventMap[K] : never
    ) => Lab13ClientEventMap[K] extends Event ? void : never
  ) => void
  off: <K extends keyof Lab13ClientEventMap>(
    event: K,
    callback: (
      event: Lab13ClientEventMap[K] extends Event ? Lab13ClientEventMap[K] : never
    ) => Lab13ClientEventMap[K] extends Event ? void : never
  ) => void
  playerId: () => string | null
  clientIds: () => string[]
  playerIds: () => string[]
  botIds: () => string[]
  clientType: () => ClientType
  sendToPlayer: (playerId: string, message: string) => void
  sendToAll: (message: string) => void
}
```

### Lab13ClientEventMap

Type definition for all events emitted by the client.

```typescript
type Lab13ClientEventMap = {
  'player-id-updated': CustomEvent<string>
  'client-connected': CustomEvent<string>
  'client-disconnected': CustomEvent<string>
  'client-ids-updated': CustomEvent<string[]>
  'player-ids-updated': CustomEvent<string[]>
  'bot-ids-updated': CustomEvent<string[]>
} & WebSocketEventMap
```

### Lab13ClientOptions

Configuration options for the Lab13Client.

```typescript
type Lab13ClientOptions = {
  bot: boolean
}
```

### ClientType

The type of client (player or bot).

```typescript
type ClientType = 'player' | 'bot'
```

## Protocol

The Lab13Client uses a simple text-based protocol over WebSocket:

### Incoming Messages

- `@playerId` - Assigns your player ID
- `+clientId` - Client connected notification
- `-clientId` - Client disconnected notification
- `bclientId` - Bot connected notification
- `?i` - Request for player ID list
- `.iclientId[|b]` - Player ID list update (with optional bot marker)

### Outgoing Messages

- `?i` - Request current player IDs
- `.iplayerId[|b]` - Response with your player ID (with optional bot marker)
- `bplayerId` - Bot announcement

## Usage Examples

### Basic Setup

```js
import { PartySocket } from 'partysocket'
import { Lab13Client } from 'https://esm.sh/js13k'

// Create WebSocket connection
const socket = new PartySocket({
  host: 'your-party-server.com',
  room: 'my-game-room',
})

// Create Lab13Client wrapper
const client = Lab13Client(socket)

// Set up event handlers
client.on('player-id-updated', (event) => {
  console.log('Got my ID:', event.detail)
})

client.on('client-connected', (event) => {
  console.log('Client joined:', event.detail)
})

client.on('client-disconnected', (event) => {
  console.log('Client left:', event.detail)
})

// Query for current players
client.queryPlayerIds()
```

### Bot Support

```js
// Create a monitoring bot client
const botClient = Lab13Client(socket, { bot: true })

// Listen for bot-specific events
client.on('bot-ids-updated', (event) => {
  console.log('Current monitor bots:', event.detail)
})

// Get different client types
const allClients = client.clientIds() // All clients
const players = client.playerIds() // Only players
const bots = client.botIds() // Only bots
const myType = client.clientType() // 'player' or 'bot'
```

> **Note**: Per JS13K Online competition rules, bots can only monitor the game. They cannot interact with or alter game state.

### Game Integration

```js
// Track all clients
let clients = new Map()

client.on('client-ids-updated', (event) => {
  // Clear old clients
  clients.clear()

  // Add all current clients
  event.detail.forEach((id) => {
    clients.set(id, { id, connected: true })
  })

  console.log('Updated client list:', Array.from(clients.values()))
})

client.on('client-connected', (event) => {
  const clientId = event.detail
  clients.set(clientId, { id: clientId, connected: true })
  console.log('Client joined:', clientId)
})

client.on('client-disconnected', (event) => {
  const clientId = event.detail
  clients.delete(clientId)
  console.log('Client left:', clientId)
})
```

### Global Access

The Lab13Client is also available globally in the browser:

```js
// Access globally
const client = window.Lab13Client(socket)
```

## Error Handling

### Connection Errors

```js
client.on('error', (error) => {
  console.error('Connection error:', error)
  // Handle connection issues
})

client.on('close', () => {
  console.log('Connection closed')
  // Handle disconnection
})
```

### Missing Player ID

```js
const myId = client.playerId()
if (!myId) {
  console.log('Waiting for player ID...')
  // Wait for player-id-updated event
}
```

## Best Practices

### Event Management

1. **Remove listeners** when components unmount to prevent memory leaks
2. **Use specific event handlers** rather than generic ones
3. **Handle connection state** appropriately

### Client Management

1. **Query player IDs** after connection to get current state
2. **Track client state** separately from connection state
3. **Handle disconnections** gracefully
4. **Use appropriate event types** for different client types

### Bot Integration

1. **Listen for bot events** to handle AI players differently
2. **Separate bot logic** from player logic
3. **Use client type checking** when needed

### Performance

1. **Limit event handler complexity** to avoid blocking
2. **Use efficient data structures** for client tracking
3. **Avoid excessive queries** for player IDs

This API reference covers all public methods and types in the Lab 13 SDK. The client provides a simple interface for managing player connections and IDs in multiplayer games.
