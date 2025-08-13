# JS13K SDK

A simple client SDK for the JS13K MMO Challenge Series that abstracts away the WebSocket connection and state management.

## Usage

### Basic Setup

```html
<script type="module">
  import Js13kClient from './sdk.js'

  const client = new Js13kClient('game-name')
</script>
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

// Update my data
client.updateMyData({
  x: 100,
  y: 200,
  angle: 0.5,
})

// Send custom delta updates
client.sendDelta({
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

## API Reference

### Constructor

```javascript
new Js13kClient(room, options)
```

- `room` (string): The room name to join
- `options` (object, optional): Configuration options
  - `host` (string): Server host (defaults to `window.location.host`)
  - `party` (string): Party name (defaults to `'js13k'`)

### Methods

#### `on(event, callback)`

Register an event listener.

#### `off(event, callback)`

Remove an event listener.

#### `getState()`

Get the current game state.

#### `getMyId()`

Get the current player's ID.

#### `getMyState(copy = false)`

Get the current player's state data.

- `copy` (boolean): If true, returns a deep copy of the state

#### `getPlayerState(playerId, copy = false)`

Get a specific player's state data.

- `playerId` (string): The ID of the player
- `copy` (boolean): If true, returns a deep copy of the state

#### `isConnected()`

Check if connected to the server.

#### `updateMyData(data)`

Update the current player's data. This is a convenience method that wraps the data in the proper structure for `sendDelta`.

#### `sendDelta(delta)`

Send a delta update to the server. The delta should follow the same structure as the state object.

#### `disconnect()`

Disconnect from the server.

### Events

- `connected`: Fired when connection is established
- `disconnected`: Fired when connection is lost
- `id`: Fired when player ID is received (data: player ID)
- `state`: Fired when initial state is received (data: full state)
- `delta`: Fired when state update is received (data: delta object)
- `connect`: Fired when another player connects (data: player ID)
- `disconnect`: Fired when another player disconnects (data: player ID)

## Example

See `demos/sdk-example.html` for a complete working example.

## Migration from Raw PartySocket

If you're migrating from the raw PartySocket implementation in the demos:

**Before:**

```javascript
import PartySocket from 'https://esm.sh/partysocket'

const socket = new PartySocket({
  host: window.location.host,
  party: 'js13k',
  room: 'cars',
})

socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data)
  // Handle messages manually...
})
```

**After:**

```javascript
import Js13kClient from './sdk.js'

const client = new Js13kClient('cars')

client.on('delta', (delta) => {
  // Handle delta updates...
})

client.on('id', (myId) => {
  // Handle player ID...
})
```

## Global Usage

The SDK is also available globally for non-module usage:

```html
<script src="./sdk.js"></script>
<script>
  const client = new Js13kClient('room-name')
</script>
```
