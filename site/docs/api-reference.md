---
title: API Reference
sidebar_position: 6
---

# API Reference

Complete reference for the JS13K Online SDK classes, methods, and types.

## Js13kClient

The main client class for connecting to the JS13K Online server.

### Constructor

```typescript
new Js13kClient<TState>(room: string, options?: ClientOptions<TState>)
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
  debug: true,
  throttleMs: 100,
  deltaEvaluator: (delta, remoteState, playerId) => true,
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

##### `getMyState(copy?: boolean): GetPlayerState<TState> | null`

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

##### `getPlayerState(playerId: string, copy?: boolean): GetPlayerState<TState> | null`

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

##### `updateState(delta: PartialDeep<TState>): void`

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

##### `updateMyState(delta: PartialDeep<GetPlayerState<TState>>): void`

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

## Lobby Presence (joinLobby)

Lightweight helper to announce player presence for a given game room. Use this to let the lobby know which game a tab is currently in. This does not provide aggregated lobby stats.

### Function

```typescript
joinLobby(room: string, options?: JoinLobbyOptions): {
  on: (event: 'open' | 'message' | 'error' | 'close', cb: (event: Event) => void) => void
}
```

**Parameters:**

- `room` (string): The game slug/room you want to report presence for
- `options` (JoinLobbyOptions, optional):
  - `host?: string` Server origin to connect to (default: `https://online.js13kgames.com`)

**Example:**

```js
import { joinLobby } from 'https://esm.sh/js13k-online'

// Announce that this tab is currently in the "cats" room
const lobby = joinLobby('cats')

lobby.on('open', () => console.log('connected to lobby'))
lobby.on('close', () => console.log('disconnected from lobby'))
lobby.on('error', (e) => console.error('lobby error', e))
```

Notes:

- Presence works by setting a `room` field on your lobby player record.
- For custom deployments, pass `{ host: window.location.origin }`.

## Helper Functions

### `generateUUID(): string`

Generates a cryptographically secure UUID (Universally Unique Identifier) for creating unique game objects.

**Returns:**

- `string`: A UUID in the format `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

**Example:**

```js
import Js13kClient, { generateUUID } from 'https://esm.sh/js13k-online'

// Create unique IDs for game objects
const itemId = generateUUID()
const enemyId = generateUUID()
const powerupId = generateUUID()

// Use in state updates
client.updateState({
  items: {
    [itemId]: { type: 'sword', x: 100, y: 200 },
  },
})
```

**Use Cases:**

- Creating unique game objects (items, enemies, powerups)
- Generating room names
- Creating unique identifiers for any game entity

### `mergeState(target: any, source: any): any`

Recursively merges two objects, with special handling for `null` values as deletion signals. This is the same merge logic used internally by the SDK and server.

**Parameters:**

- `target` (any): The target object to merge into
- `source` (any): The source object with changes to apply

**Returns:**

- `any`: The merged result

**Behavior:**

- **Primitive values**: Source values replace target values
- **Objects**: Properties are recursively merged
- **Arrays**: Treated as objects (merged by index)
- **Null values**: Signal deletion of the corresponding property
- **Non-objects**: Source value replaces target value

**Example:**

```js
import Js13kClient, { mergeState } from 'https://esm.sh/js13k-online'

// Basic merging
const target = { a: 1, b: { x: 10, y: 20 } }
const source = { b: { y: 30, z: 40 }, c: 3 }
const result = mergeState(target, source)
// result = { a: 1, b: { x: 10, y: 30, z: 40 }, c: 3 }

// Deletion with null
const target2 = { a: 1, b: 2, c: 3 }
const source2 = { b: null, d: 4 }
const result2 = mergeState(target2, source2)
// result2 = { a: 1, c: 3, d: 4 } (b is deleted)

// Array merging
const target3 = {
  items: [
    { id: 1, name: 'old' },
    { id: 2, name: 'keep' },
  ],
}
const source3 = { items: [{ id: 1, name: 'new' }, null, { id: 3, name: 'new' }] }
const result3 = mergeState(target3, source3)
// result3 = { items: [{ id: 1, name: 'new' }, { id: 3, name: 'new' }] }
```

**Use Cases:**

- Manually merging state updates outside the SDK
- Implementing custom state synchronization
- Testing state merge behavior
- Creating state patches for offline/online sync

## Entity Collections and Tombstones

Underscore‑prefixed object keys are treated as entity collections at any nesting level. Within an entity collection:

- Keys are presumed to be GUIDs (e.g., from `generateUUID()`), each representing a single entity
- Setting an entity to `null` tombstones it and deletes it from state
- After a GUID is tombstoned, any future updates for that GUID are ignored by both client and server

This behavior is enforced by the framework’s delta filter and merge logic and is a key feature to prevent race conditions on deleted entities.

Notes:

- Any object whose key starts with `_` (for example: `_players`, `_mice`, `_bullets`) is considered an entity collection
- You can nest entity collections inside other objects; the rule applies at any depth
- Use normal, non‑underscored collections when you do not need tombstoning semantics

Example: create, update, and delete an entity in a collection called `_mice`.

```js
import Js13kClient, { generateUUID } from 'https://esm.sh/js13k-online'

const mouseId = generateUUID()

// Create entity
client.updateState({
  _mice: {
    [mouseId]: { x: 100, y: 150, owner: client.getMyId() },
  },
})

// Update entity
client.updateState({ _mice: { [mouseId]: { x: 120 } } })

// Delete (tombstone) entity — subsequent updates for mouseId will be dropped
client.updateState({ _mice: { [mouseId]: null } })
```

Built‑in collections:

- `_players`: Built‑in entity collection keyed by socket connection IDs (treated as GUIDs). The server creates an empty record on connect and removes it on disconnect. Use `client.updateMyState(...)` to modify your own `_players[myId]` entry.

## Types

### ClientOptions\<TState\>

Configuration options for the Js13kClient constructor.

```typescript
interface ClientOptions<TState = GameState> {
  host?: string
  party?: string
  deltaNormalizer?: DeltaNormalizer<TState>
  deltaEvaluator?: DeltaEvaluator<TState>
  throttleMs?: number
  debug?: boolean
}
```

**Properties:**

- `host` (string, optional): Server hostname (default: `window.location.host`)
- `party` (string, optional): Party name (default: `'js13k'`)
- `deltaNormalizer` (DeltaNormalizer, optional): Normalize outgoing deltas before comparison/sending
- `deltaEvaluator` (DeltaEvaluator, optional): Function to control when deltas are sent
- `throttleMs` (number, optional): Throttle interval in milliseconds (default: `50`)
- `debug` (boolean, optional): Enable verbose SDK logs in the console (default: `false`)

### DeltaEvaluator\<TState\>

Function type for controlling when state updates should be sent to the server.

```typescript
type DeltaEvaluator<TState = GameState> = (
  delta: PartialDeep<TState>,
  remoteState: PartialDeep<TState>,
  playerId?: string
) => boolean
```

**Parameters:**

- `delta` (PartialDeep\<TState\>): The pending state changes
- `remoteState` (PartialDeep\<TState\>): The last known remote state used for comparison
- `playerId` (string, optional): Your player ID

**Returns:**

- `boolean`: `true` to send the delta, `false` to skip it

**Example:**

```js
const deltaEvaluator = (delta, remoteState, playerId) => {
  // Only send position updates if player moved > 5 pixels
  if (delta.players?.[playerId]) {
    const playerDelta = delta.players[playerId]
    const oldPos = remoteState.players?.[playerId] || {}

    if (playerDelta.x !== undefined || playerDelta.y !== undefined) {
      const dx = Math.abs(playerDelta.x - (oldPos.x || 0))
      const dy = Math.abs(playerDelta.y - (oldPos.y || 0))
      return dx > 5 || dy > 5
    }
  }

  return true // Send other updates normally
}
```

### DeltaNormalizer\<TState\>

Hook to sanitize/normalize outgoing deltas. Useful for quantizing values (like rounding positions) or stripping noisy fields.

```typescript
type DeltaNormalizer<TState = GameState> = (delta: PartialDeep<TState>) => PartialDeep<TState>
```

**Behavior:**

- Called right before diffing against the last known remote state.
- The returned object is what will be evaluated and potentially sent.
- Default is the identity function: `delta => delta`.

**Example:** Round `x`/`y` positions and pass deletions as `null`.

```js
const client = new Js13kClient('my-room', {
  deltaNormalizer: (delta) => ({
    ...delta,
    players: Object.fromEntries(
      Object.entries(delta.players || {}).map(([id, p]) => [
        id,
        p == null
          ? null
          : {
              ...p,
              x: Math.round(p.x || 0),
              y: Math.round(p.y || 0),
            },
      ])
    ),
  }),
})
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

The JS13K Online server:

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

This API reference covers all public methods and types in the JS13K Online SDK. For more examples and patterns, see the other documentation pages.
