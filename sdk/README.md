# JS13K MMO SDK

A simple client SDK for the JS13K MMO Challenge Series that abstracts away the WebSocket connection and state management with intelligent delta throttling for smooth multiplayer games.

## Installation

```html
<script type="module">
  import Js13kClient from 'https://esm.sh/js13k-mmo-sdk'
  const client = new Js13kClient('room-name')
</script>
```

## Usage

### Basic Setup

```javascript
// Simple client
const client = new Js13kClient('room-name')

// With custom options
const client = new Js13kClient('room-name', {
  host: 'my-server.com',
  party: 'my-game',
  throttleMs: 50, // Custom throttle interval
  deltaEvaluator: (delta, deltaBase) => {
    // Custom logic to determine if delta should be sent
    return true
  },
})
```

### Event Handling

```javascript
// Connection events
client.on('connected', () => {
  console.log('Connected to server')
})

client.on('disconnected', () => {
  console.log('Disconnected from server')
})

// Game events
client.on('id', (myId) => {
  console.log('My ID:', myId)
})

client.on('state', (state) => {
  console.log('Initial state received:', state)
})

client.on('delta', (delta) => {
  console.log('State update received:', delta)
})

client.on('connect', (playerId) => {
  console.log('Player connected:', playerId)
})

client.on('disconnect', (playerId) => {
  console.log('Player disconnected:', playerId)
})
```

### State Management

```javascript
// Get current state
const state = client.getState()

// Get my player ID
const myId = client.getMyId()

// Get my player state (with optional deep copy)
const myState = client.getMyState()
const myStateCopy = client.getMyState(true)

// Get another player's state
const otherPlayerState = client.getPlayerState('player-id')
const otherPlayerStateCopy = client.getPlayerState('player-id', true)

// Check connection status
const isConnected = client.isConnected()

// Update my player state (throttled automatically)
client.updateMyState({
  x: 100,
  y: 200,
  angle: 0.5,
})

// Send custom delta updates (also throttled)
client.updateState({
  players: {
    [myId]: { health: 50 },
    [otherPlayerId]: { position: { x: 150, y: 250 } },
  },
})
```

### Connection Management

```javascript
// Disconnect
client.disconnect()

// Remove event listeners
client.off('delta', myCallback)
```

## Delta Throttling

The SDK includes intelligent delta throttling that's perfect for games running at 60fps. Instead of sending every single update over the network, the SDK batches and throttles deltas for optimal performance.

### How It Works

1. **Throttle Window**: Deltas are collected during a configurable time window (default: 50ms)
2. **Delta Merging**: Multiple deltas for the same state are merged into a single "uberdelta"
3. **Smart Evaluation**: Optional evaluator function determines if the merged delta should be sent
4. **Network Optimization**: Only significant changes are transmitted, reducing bandwidth usage

### Configuration

```javascript
const client = new Js13kClient('room-name', {
  throttleMs: 50, // Throttle window in milliseconds (default: 50)
  deltaEvaluator: (delta, deltaBase, playerId) => {
    // Return true if delta should be sent, false to skip
    // delta: The merged delta to be sent
    // deltaBase: The previous state for comparison
    // playerId: The current player's ID (for player-specific evaluation)

    // Example: Only send if position changed significantly
    if (!deltaBase || !playerId) return true

    // Get the player's previous state from the delta base
    const playerBase = deltaBase.players?.[playerId]
    if (!playerBase) return true

    const xChanged = Math.abs((delta.players?.[playerId]?.x || 0) - (playerBase.x || 0)) > 2
    const yChanged = Math.abs((delta.players?.[playerId]?.y || 0) - (playerBase.y || 0)) > 2

    return xChanged || yChanged
  },
})
```

### Game Loop Integration

```javascript
// Perfect for 60fps game loops
function gameLoop() {
  // Update player position every frame
  player.x += velocity.x
  player.y += velocity.y

  // SDK automatically throttles and batches these updates
  client.updateMyState(player)

  requestAnimationFrame(gameLoop)
}
```

### Benefits

- **Reduced Network Traffic**: Only significant changes are sent
- **Smooth Gameplay**: No network lag from excessive updates
- **Automatic Batching**: Multiple updates become single network messages
- **Configurable**: Customize throttling behavior for your game's needs

## API Reference

### Constructor

```javascript
new Js13kClient() < TState > (room, options)
```

- `room` (string): The room name to join
- `options` (object, optional): Configuration options
  - `host` (string): Server host (defaults to `window.location.host`)
  - `party` (string): Party name (defaults to `'js13k'`)
  - `throttleMs` (number): Throttle window in milliseconds (default: 50)
  - `deltaEvaluator` (function): Optional function to evaluate if delta should be sent

### Methods

#### `on(event, callback)`

Register an event listener.

#### `off(event, callback)`

Remove an event listener.

#### `getState(): TState`

Get the current game state.

#### `getMyId(): string | null`

Get the current player's ID.

#### `getMyState(copy = false): PlayerStateValue<TState> | null`

Get the current player's state data.

- `copy` (boolean): If true, returns a deep copy of the state

#### `getPlayerState(playerId, copy = false): PlayerStateValue<TState> | null`

Get a specific player's state data.

- `playerId` (string): The ID of the player
- `copy` (boolean): If true, returns a deep copy of the state

#### `isConnected(): boolean`

Check if connected to the server.

#### `updateMyState(delta: PartialDeep<PlayerStateValue<TState>>): void`

Update the current player's state. Automatically throttled and batched.

#### `updateState(delta: PartialDeep<TState>): void`

Send a delta update to the server. Automatically throttled and batched.

#### `disconnect(): void`

Disconnect from the server.

### Events

- `connected`: Fired when connection is established
- `disconnected`: Fired when connection is lost
- `id`: Fired when player ID is received (data: player ID)
- `state`: Fired when initial state is received (data: full state)
- `delta`: Fired when state update is received (data: delta object)
- `connect`: Fired when another player connects (data: player ID)
- `disconnect`: Fired when another player disconnects (data: player ID)

### Types

```typescript
type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P]
}

type PlayerStateValue<TState extends GameState> = TState['players'] extends {
  [key: string]: infer P
}
  ? P
  : any

type DeltaEvaluator<TState = GameState> = (
  delta: PartialDeep<TState>,
  deltaBase: PartialDeep<TState>,
  playerId?: string
) => boolean
```

## Examples

### Racing Game

```javascript
const client = new Js13kClient('racing', {
  throttleMs: 33, // 30fps updates
  deltaEvaluator: (delta, deltaBase, playerId) => {
    if (!deltaBase || !playerId) return true

    // Get the player's previous state from the delta base
    const playerBase = deltaBase.players?.[playerId]
    if (!playerBase) return true

    // Only send if position changed by more than 1 unit
    const distance = Math.sqrt(
      Math.pow((delta.players?.[playerId]?.x || 0) - (playerBase.x || 0), 2) +
        Math.pow((delta.players?.[playerId]?.y || 0) - (playerBase.y || 0), 2)
    )

    return distance > 1
  },
})

// Update car position every frame
function updateCar() {
  car.x += velocity.x
  car.y += velocity.y

  // SDK handles throttling automatically
  client.updateMyState(car)
}
```

### Real-time Strategy Game

```javascript
const client = new Js13kClient('rts', {
  throttleMs: 100, // Less frequent updates for RTS
  deltaEvaluator: (delta, deltaBase, playerId) => {
    // Always send unit commands immediately
    if (delta.commands) return true

    // Throttle position updates
    return true // Simplified for this example
  },
})
```

See [live demos](https://mmo.js13kgames.com/demos) for more examples.

## License

MIT
