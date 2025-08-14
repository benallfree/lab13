---
sidebar_position: 3
---

# Initial Connection

When you connect to the JS13K MMO server using the SDK, several things happen automatically. Understanding this flow will help you build more robust games.

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

## Complete Connection Example

Here's a complete example showing proper connection handling:

```js
const client = new Js13kClient('my-game-room')
let isReady = false

// Track connection status
client.on('connected', () => {
  console.log('✅ Connected to server')
  updateStatus('Connected')
})

client.on('disconnected', () => {
  console.log('❌ Disconnected from server')
  updateStatus('Disconnected - Reconnecting...')
  isReady = false
})

// Get your player ID
client.on('id', (myId) => {
  console.log('🆔 My ID:', myId)

  // Initialize your player
  client.updateMyState({
    name: prompt('Enter your name:') || 'Anonymous',
    x: Math.random() * 800,
    y: Math.random() * 600,
    color: getRandomColor(),
  })
})

// Receive initial game state
client.on('state', (state) => {
  console.log('📦 Initial state received')
  console.log('Players currently in game:', Object.keys(state.players).length)

  // Now you can start your game loop
  isReady = true
  startGameLoop()
})

// Track other players
client.on('connect', (playerId) => {
  console.log('👋 Player joined:', playerId)
})

client.on('disconnect', (playerId) => {
  console.log('👋 Player left:', playerId)
})

function updateStatus(message) {
  document.getElementById('status').textContent = message
}

function startGameLoop() {
  if (!isReady) return

  // Your game loop here
  requestAnimationFrame(startGameLoop)
}
```

## Best Practices

### Wait for Ready State

Don't start your game logic until you've received both your ID and the initial state:

```js
let hasId = false
let hasState = false

client.on('id', () => {
  hasId = true
  checkReady()
})

client.on('state', () => {
  hasState = true
  checkReady()
})

function checkReady() {
  if (hasId && hasState) {
    startGame()
  }
}
```

### Handle Reconnection

Always be prepared for temporary disconnections:

```js
client.on('disconnected', () => {
  // Pause game logic
  pauseGame()
  showMessage('Connection lost, reconnecting...')
})

client.on('connected', () => {
  // Resume when reconnected
  hideMessage()
})

client.on('state', () => {
  // Resume game with fresh state
  resumeGame()
})
```

### Initialize Player State Early

Set your initial player state as soon as you get your ID:

```js
client.on('id', (myId) => {
  // Initialize immediately with default values
  client.updateMyState({
    x: 0,
    y: 0,
    ready: false,
  })

  // Then update with real values
  setTimeout(() => {
    client.updateMyState({
      x: getSpawnX(),
      y: getSpawnY(),
      ready: true,
    })
  }, 100)
})
```

## What's Next?

Now that you understand the connection flow, learn about [Game State Management](./game-state.md) to design your multiplayer game state effectively.
