---
title: Game Loop
sidebar_position: 3
---

# Working with the Game Loop

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

## Initialization (based on cats demo)

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

## Complete Connection Example

Here's a complete example showing connection handling and a minimal loop:

```js
const client = new Js13kClient('cats')
let isReady = false

// Canvas and input
const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')
function resizeCanvas() {
  const container = canvas.parentElement || document.body
  canvas.width = container.clientWidth
  canvas.height = container.clientHeight
}
resizeCanvas()
window.addEventListener('resize', resizeCanvas)
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

// Connection status (optional UI)
client.on('connected', () => updateStatus('Connected'))
client.on('disconnected', () => {
  updateStatus('Disconnected')
  isReady = false
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

// Initial state -> start loop
client.on('state', () => {
  isReady = true
  loop()
})

function updateStatus(message) {
  const el = document.getElementById('status')
  if (el) el.textContent = message
}

function updatePlayer() {
  const me = client.getMyState(true)
  if (!me) return
  let moved = false
  if (keys.ArrowUp) {
    me.y -= 4
    moved = true
  }
  if (keys.ArrowDown) {
    me.y += 4
    moved = true
  }
  if (keys.ArrowLeft) {
    me.x -= 4
    moved = true
  }
  if (keys.ArrowRight) {
    me.x += 4
    moved = true
  }
  me.x = Math.max(20, Math.min(canvas.width - 20, me.x))
  me.y = Math.max(20, Math.min(canvas.height - 20, me.y))
  if (moved) client.updateMyState(me)
}

function drawCat(x, y, isMyCat, score, name) {
  // Minimal placeholder – implement your own drawing
  ctx.fillStyle = isMyCat ? '#ff6b6b' : '#333'
  ctx.beginPath()
  ctx.arc(x, y, 10, 0, Math.PI * 2)
  ctx.fill()
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const state = client.getState()
  if (state.players) {
    for (const playerId in state.players) {
      const p = state.players[playerId]
      drawCat(p.x, p.y, playerId === client.getMyId(), p.score, p.name)
    }
  }
}

function loop() {
  if (!isReady) return
  updatePlayer()
  render()
  requestAnimationFrame(loop)
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

Now that you understand initialization and the loop, learn about [Game State Management](./tutorials/game-state.md) to design your multiplayer game state effectively.
