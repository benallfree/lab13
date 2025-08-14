---
title: API Reference
sidebar_position: 6
---

# API Reference

Complete reference for the JS13K MMO SDK classes, methods, and types.

## Js13kClient

The main client class for connecting to the JS13K MMO server.

### Constructor

```typescript
new Js13kClient\<TState\>(room: string, options?: ClientOptions\<TState\>)
```

Creates a new client instance and automatically connects to the server.

**Parameters:**

- `room` (string): Unique room identifier for your game
- `options` (ClientOptions): Optional configuration object

**Example:**

```js
const client = new Js13kClient('my-game-room')

// With options
const client = new Js13kClient('my-game-room', {
  host: 'custom-host.com',
  party: 'custom-party',
  throttleMs: 100,
  deltaEvaluator: (delta, shadowState, playerId) => true,
})
```

### Methods

#### State Management

##### `getState(): TState`

Returns the complete current game state.

```js
const state = client.getState()
console.log(state.players, state.world)
```

##### `getMyId(): string | null`

Returns your player ID, or `null` if not yet connected.

```js
const myId = client.getMyId()
if (myId) {
  console.log('My player ID:', myId)
}
```

##### `getMyState(copy?: boolean): GetPlayerState\<TState\> | null`

Returns your player state from the `players` collection.

**Parameters:**

- `copy` (boolean, optional): If `true`, returns a deep copy safe to modify

```js
const myState = client.getMyState()
if (myState) {
  console.log('My position:', myState.x, myState.y)
}

// Get a copy to modify safely
const myStateCopy = client.getMyState(true)
myStateCopy.x += 10 // Won't affect the original state
```

##### `getPlayerState(playerId: string, copy?: boolean): GetPlayerState\<TState\> | null`

Returns another player's state from the `players` collection.

**Parameters:**

- `playerId` (string): The target player's ID
- `copy` (boolean, optional): If `true`, returns a deep copy safe to modify

```js
const otherPlayer = client.getPlayerState('other-player-id')
if (otherPlayer) {
  console.log('Other player health:', otherPlayer.health)
}
```

##### `updateState(delta: PartialDeep\<TState\>): void`

Updates any part of the game state. Changes are throttled and sent to other clients.

**Parameters:**

- `delta` (PartialDeep\<TState\>): Partial state object with changes

```js
// Update world state
client.updateState({
  world: {
    score: 100,
    items: [{ id: 1, x: 50, y: 50 }],
  },
})

// Update multiple players
client.updateState({
  players: {
    'player-1': { health: 50 },
    'player-2': { health: 75 },
  },
})
```

##### `updateMyState(delta: PartialDeep\<GetPlayerState\<TState\>\>): void`

Updates your own player state. Convenience method for updating `players[myId]`.

**Parameters:**

- `delta` (PartialDeep\<GetPlayerState\<TState\>\>): Partial player state object

```js
// Update your position
client.updateMyState({
  x: 100,
  y: 200,
})

// Update nested properties
client.updateMyState({
  inventory: [...myState.inventory, 'new-item'],
  stats: {
    ...myState.stats,
    level: myState.stats.level + 1,
  },
})
```

#### Connection Management

##### `isConnected(): boolean`

Returns `true` if connected to the server.

```js
if (client.isConnected()) {
  // Safe to send updates
  client.updateMyState({ status: 'ready' })
}
```

##### `disconnect(): void`

Closes the connection and cleans up resources.

```js
// Clean disconnect
client.disconnect()
```

#### Event System

##### `on(event: string, callback: Function): void`

Registers an event listener.

**Parameters:**

- `event` (string): Event name
- `callback` (Function): Event handler function

```js
client.on('connected', () => {
  console.log('Connected to server!')
})

client.on('delta', (delta) => {
  console.log('State changed:', delta)
})
```

##### `off(event: string, callback: Function): void`

Removes an event listener.

**Parameters:**

- `event` (string): Event name
- `callback` (Function): The same function reference passed to `on()`

```js
function handleDelta(delta) {
  console.log('Delta:', delta)
}

client.on('delta', handleDelta)
client.off('delta', handleDelta) // Remove the listener
```

##### `emit(event: string, data?: any): void`

Manually triggers an event (for internal use or testing).

**Parameters:**

- `event` (string): Event name
- `data` (any, optional): Data to pass to event handlers

```js
// Manually trigger an event
client.emit('custom-event', { some: 'data' })
```

### Events

The client emits several events during its lifecycle:

#### `connected`

Fired when the WebSocket connection is established.

```js
client.on('connected', () => {
  console.log('✅ Connected to server')
})
```

#### `disconnected`

Fired when the WebSocket connection is lost.

```js
client.on('disconnected', () => {
  console.log('❌ Disconnected from server')
})
```

#### `id`

Fired when you receive your unique player ID from the server.

**Callback Parameters:**

- `playerId` (string): Your unique player ID

```js
client.on('id', (myId) => {
  console.log('🆔 My player ID:', myId)

  // Initialize your player state
  client.updateMyState({
    name: 'Player',
    x: 100,
    y: 100,
  })
})
```

#### `state`

Fired when you receive the initial complete game state.

**Callback Parameters:**

- `state` (TState): The complete game state

```js
client.on('state', (gameState) => {
  console.log('📦 Initial state received')
  console.log('Players in game:', Object.keys(gameState.players).length)

  // Initialize your game with existing state
  initializeGame(gameState)
})
```

#### `delta`

Fired when any part of the game state changes.

**Callback Parameters:**

- `delta` (PartialDeep\<TState\>): The state changes

```js
client.on('delta', (delta) => {
  console.log('🔄 State changed:', delta)

  // Update your game based on the changes
  if (delta.players) {
    updatePlayerPositions(delta.players)
  }

  if (delta.world) {
    updateWorldState(delta.world)
  }
})
```

#### `connect`

Fired when another player connects to the same room.

**Callback Parameters:**

- `playerId` (string): The ID of the player who connected

```js
client.on('connect', (playerId) => {
  console.log('👋 Player joined:', playerId)

  // Their state will be in the next delta update
})
```

#### `disconnect`

Fired when another player disconnects from the room.

**Callback Parameters:**

- `playerId` (string): The ID of the player who disconnected

```js
client.on('disconnect', (playerId) => {
  console.log('👋 Player left:', playerId)

  // Remove them from your UI
  removePlayerFromUI(playerId)
})
```

## Types

### ClientOptions\<TState\>

Configuration options for the Js13kClient constructor.

```typescript
interface ClientOptions<TState = GameState> {
  host?: string
  party?: string
  deltaEvaluator?: DeltaEvaluator<TState>
  throttleMs?: number
}
```

**Properties:**

- `host` (string, optional): Server hostname (default: `window.location.host`)
- `party` (string, optional): Party name (default: `'js13k'`)
- `deltaEvaluator` (DeltaEvaluator, optional): Function to control when deltas are sent
- `throttleMs` (number, optional): Throttle interval in milliseconds (default: `50`)

### DeltaEvaluator\<TState\>

Function type for controlling when state updates should be sent to the server.

```typescript
type DeltaEvaluator<TState = GameState> = (
  delta: PartialDeep<TState>,
  deltaBase: PartialDeep<TState>,
  playerId?: string
) => boolean
```

**Parameters:**

- `delta` (PartialDeep\<TState\>): The pending state changes
- `deltaBase` (PartialDeep\<TState\>): The state when the delta accumulation started
- `playerId` (string, optional): Your player ID

**Returns:**

- `boolean`: `true` to send the delta, `false` to skip it

**Example:**

```js
const deltaEvaluator = (delta, shadowState, playerId) => {
  // Only send position updates if player moved > 5 pixels
  if (delta.players?.[playerId]) {
    const playerDelta = delta.players[playerId]
    const oldPos = shadowState.players?.[playerId] || {}

    if (playerDelta.x !== undefined || playerDelta.y !== undefined) {
      const dx = Math.abs(playerDelta.x - (oldPos.x || 0))
      const dy = Math.abs(playerDelta.y - (oldPos.y || 0))
      return dx > 5 || dy > 5
    }
  }

  return true // Send other updates normally
}
```

### GameState

Base type for game state. You should extend this with your own interface.

```typescript
type GameState = Record<string, any>
```

**Example:**

```typescript
interface MyGameState extends GameState {
  players: Record<
    string,
    {
      x: number
      y: number
      name: string
      health: number
    }
  >
  world: {
    items: Array<{ id: number; type: string; x: number; y: number }>
    score: number
  }
}
```

### GetPlayerState\<TState\>

Utility type that extracts the player state type from your game state.

```typescript
type GetPlayerState<TState extends GameState> = TState['players'][string]
```

**Example:**

```typescript
interface MyGameState {
  players: Record<
    string,
    {
      x: number
      y: number
      health: number
    }
  >
}

// PlayerType is { x: number; y: number; health: number }
type PlayerType = GetPlayerState<MyGameState>
```

### PartialDeep\<T\>

Utility type that makes all properties of an object and its nested objects optional.

```typescript
type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P]
}
```

This is used for delta updates where you only need to specify the properties that changed.

### MessageData

Internal message format used by the WebSocket protocol.

```typescript
interface MessageData {
  id?: string // Player ID assignment
  connect?: string // Player connection notification
  disconnect?: string // Player disconnection notification
  state?: any // Initial state dump
  delta?: any // State changes
}
```

## Server API

While you typically don't need to interact with the server directly, understanding its behavior can be helpful.

### Server Behavior

The JS13K MMO server:

1. **Manages Connections**: Assigns unique IDs to each connection
2. **Manages Player State**: Creates/removes entries in `state.players`
3. **Relays Messages**: Broadcasts deltas to all connected clients
4. **State Persistence**: Maintains state in memory (not persistent across server restarts)

### Message Flow

1. **Client connects** → Server sends `{ id: "player-id" }` and `{ state: currentState }`
2. **Client sends delta** → Server merges into state and broadcasts to all other clients
3. **Client disconnects** → Server removes from `state.players` and broadcasts `{ disconnect: "player-id" }`

### Room Isolation

Each room is completely isolated:

- State is maintained separately per room
- Messages are only broadcast within the same room
- Player IDs are unique within a room but may repeat across rooms

## Error Handling

### Connection Errors

```js
client.on('disconnected', () => {
  // Handle connection loss
  showReconnectingMessage()
})

client.on('connected', () => {
  // Handle reconnection
  hideReconnectingMessage()
})
```

### Message Parsing Errors

The client automatically handles JSON parsing errors and logs them to the console. Invalid messages are ignored.

### State Validation

Since the server trusts all clients, consider client-side validation:

```js
client.on('delta', (delta) => {
  // Validate incoming changes
  if (delta.players) {
    Object.entries(delta.players).forEach(([playerId, playerDelta]) => {
      if (!isValidPlayerUpdate(playerDelta)) {
        console.warn('Invalid update from player:', playerId)
        return // Skip this update
      }
    })
  }

  // Apply validated changes
  updateGameFromDelta(delta)
})
```

## Best Practices

### Performance

1. **Use throttling** to limit update frequency
2. **Implement delta evaluation** for expensive updates
3. **Minimize state size** by only storing necessary data
4. **Use spatial partitioning** for large worlds

### Reliability

1. **Handle disconnections** gracefully
2. **Validate incoming state** changes
3. **Implement reconnection** logic
4. **Use authoritative patterns** for critical game logic

### Security

1. **Validate all input** from other clients
2. **Use consensus patterns** for important decisions
3. **Implement rate limiting** on the client side
4. **Don't trust client state** for critical game mechanics

This API reference covers all public methods and types in the JS13K MMO SDK. For more examples and patterns, see the other documentation pages.
