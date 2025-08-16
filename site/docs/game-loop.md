---
title: Game Loop
sidebar_position: 3
---

# Working with the Game Loop

When you connect to the JS13K Online server using the SDK, several things happen automatically. Understanding this flow will help you build more robust games.

## Connection Process

The `Js13kClient` handles the entire connection process for you:

```js
const client = new Js13kClient('my-game-room')

// Connection happens automatically!
// The client will:
// 1. Connect to the WebSocket
// 2. Receive your unique player ID
// 3. Receive the current game state
// 4. Set up event listeners
```

## Initialization

Set up your client, canvas, and input. Initialize your player as soon as you receive your ID.

```js
const client = new Js13kClient('cats')

// Canvas
const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

function resizeCanvas() {
  const container = canvas.parentElement || document.body
  canvas.width = container.clientWidth
  canvas.height = container.clientHeight
}
resizeCanvas()
window.addEventListener('resize', resizeCanvas)

// Input
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false }
document.addEventListener('keydown', (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = true
    e.preventDefault()
  }
})
document.addEventListener('keyup', (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false
    e.preventDefault()
  }
})

// Initialize my player when ID arrives
client.on('id', () => {
  const nameInput = document.getElementById('name-input')
  client.updateMyState({
    x: canvas.width / 2,
    y: canvas.height / 2,
    score: 0,
    name: nameInput && 'value' in nameInput ? nameInput.value || '' : '',
  })
})
```

## Connection Events

The SDK provides several events to track the connection lifecycle:

### Connected Event

Fired when the WebSocket connection is established:

```js
client.on('connected', () => {
  console.log('Connected to server!')
  // Now you can start sending updates
})
```

### Receiving Your Player ID

Every client gets a unique ID that persists for the duration of their session:

```js
client.on('id', (playerId) => {
  console.log('My player ID:', playerId)

  // You can also get your ID anytime with:
  const myId = client.getMyId()

  // Initialize your player state
  client.updateMyState({
    name: 'Player',
    x: 100,
    y: 100,
    color: 'blue',
  })
})
```

### Initial State

The server sends the complete current state when you connect:

```js
client.on('state', (gameState) => {
  console.log('Initial game state:', gameState)

  // The state structure looks like:
  // {
  //   players: {
  //     'player-id-1': { x: 100, y: 200, name: 'Alice' },
  //     'player-id-2': { x: 300, y: 150, name: 'Bob' }
  //   }
  // }

  // Initialize your game with existing players
  renderAllPlayers(gameState.players)
})
```

## Other Players Connecting/Disconnecting

Track when other players join or leave:

```js
client.on('connect', (playerId) => {
  console.log(`Player ${playerId} joined the game`)
  // Their state will be in the next delta update
})

client.on('disconnect', (playerId) => {
  console.log(`Player ${playerId} left the game`)
  // Remove them from your UI
  removePlayerFromUI(playerId)
})
```

## Handling Disconnections

The SDK handles connection issues gracefully, but you can listen for disconnection:

```js
client.on('disconnected', () => {
  console.log('Lost connection to server')
  // Show a "reconnecting..." message
  showReconnectingMessage()
})

// When reconnected, you'll get 'connected' and 'state' events again
client.on('connected', () => {
  hideReconnectingMessage()
})
```

## Mutating State

Use `client.updateMyState(partial)` to change your own player, and `client.updateState(partial)` for shared/global data. Only the fields you provide are merged; everything else stays the same.

```js
// Example: move my player based on input
function tick() {
  const dx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0)
  const dy = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0)

  const mine = client.getMyState(true)
  client.updateMyState({ x: (mine.x || 0) + dx, y: (mine.y || 0) + dy })
}

// Example: spawn a shared world item
const itemId = 'item-' + Math.random().toString(36).slice(2)
client.updateState({
  items: {
    [itemId]: { x: 200, y: 120, owner: client.getMyId() },
  },
})
```

## How saving works (local-first)

- When you call `updateMyState` or `updateState`, the SDK writes the change to your local state immediately (optimistic), then batches and sends a delta to the server.
- The server relays your delta to all clients. You will also receive your own delta via `client.on('delta', ...)`, which keeps everyone in sync.
- Read the latest local copy anytime with `client.getState()`, `client.getMyState()`, or `client.getPlayerState(id)`.

## Learn more

The tutorials (@tutorials/) feature more advanced state management patterns:

- [Understanding Game State](./tutorials/game-state)
- [Quantizing Deltas](./tutorials/quantizing)
- [Throttling Updates](./tutorials/throttling)
- [Evaluating Deltas](./tutorials/delta-evaluator)
- [State Ownership](./tutorials/ownership)
