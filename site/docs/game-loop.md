---
title: Game Loop
sidebar_position: 3
---

# Working with the Game Loop

When you connect to the JS13K Online server using the Lab13 SDK, several things happen automatically. Understanding this flow will help you build more robust multiplayer games.

## Connection Process

The Lab13 SDK handles the connection process and extends the base JS13K Online protocol:

```js
import { Lab13Client } from 'https://esm.sh/lab13-sdk'
import { PartySocket } from 'https://esm.sh/partysocket'

const socket = new PartySocket({
  host: 'your-party-server.partykit.dev',
  room: 'my-game-room',
})

const client = Lab13Client(socket)

// Connection happens automatically!
// The Lab13 SDK will:
// 1. Connect to the WebSocket
// 2. Handle player ID assignment
// 3. Track connected clients (players and bots)
// 4. Set up enhanced event listeners
```

## Initialization

Set up your client, canvas, and input. Initialize your player as soon as you receive your ID.

```js
import { Lab13Client } from 'https://esm.sh/lab13-sdk'
import { PartySocket } from 'https://esm.sh/partysocket'

const socket = new PartySocket({
  host: 'your-party-server.partykit.dev',
  room: 'cats',
})

const client = Lab13Client(socket)

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
client.on('player-id-updated', (event) => {
  const myId = event.detail
  const nameInput = document.getElementById('name-input')

  // Send initial state to all players
  client.sendToAll(
    `init:${JSON.stringify({
      x: canvas.width / 2,
      y: canvas.height / 2,
      score: 0,
      name: nameInput && 'value' in nameInput ? nameInput.value || '' : '',
    })}`
  )
})
```

## Connection Events

The Lab13 SDK provides enhanced events that extend the base JS13K Online protocol:

### Player ID Assignment

Every client gets a unique ID that persists for the duration of their session:

```js
client.on('player-id-updated', (event) => {
  const playerId = event.detail
  console.log('My player ID:', playerId)

  // You can also get your ID anytime with:
  const myId = client.playerId()

  // Initialize your player state
  client.sendToAll(
    `init:${JSON.stringify({
      name: 'Player',
      x: 100,
      y: 100,
      color: 'blue',
    })}`
  )
})
```

### Client Connection Tracking

The Lab13 SDK automatically tracks when clients (players and bots) join or leave:

```js
client.on('client-connected', (event) => {
  const clientId = event.detail
  console.log(`Client ${clientId} joined the game`)

  // Check if it's a bot or player
  if (client.botIds().includes(clientId)) {
    console.log('Bot joined:', clientId)
    // Handle bot-specific logic
  } else {
    console.log('Player joined:', clientId)
    // Query their state
    client.sendToPlayer(clientId, 'getState')
  }
})

client.on('client-disconnected', (event) => {
  const clientId = event.detail
  console.log(`Client ${clientId} left the game`)
  // Remove them from your UI
  removeClientFromUI(clientId)
})

client.on('client-ids-updated', (event) => {
  const clientIds = event.detail
  console.log('Current clients:', clientIds)
  // Query all clients for their state
  clientIds.forEach((id) => {
    client.sendToPlayer(id, 'getState')
  })
})

// Bot-specific tracking
client.on('bot-ids-updated', (event) => {
  const botIds = event.detail
  console.log('Current bots:', botIds)
  // Update bot AI systems
})
```

## Handling Disconnections

The Lab13 SDK handles connection issues gracefully, but you can listen for disconnection:

```js
socket.addEventListener('close', () => {
  console.log('Lost connection to server')
  // Show a "reconnecting..." message
  showReconnectingMessage()
})

// When reconnected, you'll get client events again
socket.addEventListener('open', () => {
  hideReconnectingMessage()
  // Query for current clients
  client.queryPlayerIds()
})
```

## Custom Message Handling

Since Lab13 extends the base protocol, you'll need to handle custom game messages:

```js
socket.addEventListener('message', (event) => {
  const msg = event.data.toString()

  // Handle custom game messages
  if (msg.startsWith('init:')) {
    const state = JSON.parse(msg.slice(5))
    createClientElement(client.playerId(), state)
  } else if (msg.startsWith('move:')) {
    const [clientId, x, y] = msg.slice(5).split(',')
    updateClientPosition(clientId, parseInt(x), parseInt(y))
  } else if (msg === 'getState') {
    // Respond with current state
    const myState = getMyState()
    client.sendToPlayer(client.playerId(), `init:${JSON.stringify(myState)}`)
  }
})
```

## State Management

Use the Lab13 SDK's communication methods to manage game state:

```js
// Example: move my player based on input
function tick() {
  const dx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0)
  const dy = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0)

  if (dx !== 0 || dy !== 0) {
    const myState = getMyState()
    const newX = (myState.x || 0) + dx
    const newY = (myState.y || 0) + dy

    // Update local state
    updateMyState({ x: newX, y: newY })

    // Send movement to all clients
    client.sendToAll(`move:${client.playerId()},${newX},${newY}`)
  }
}

// Example: spawn a shared world item
const itemId = 'item-' + Math.random().toString(36).slice(2)
client.sendToAll(`spawn:${itemId}:${JSON.stringify({ x: 200, y: 120, owner: client.playerId() })}`)
```

## Bot Integration

The Lab13 SDK makes it easy to integrate monitoring bots into your games:

```js
// Create a monitoring bot client
const botClient = Lab13Client(socket, { bot: true })

// Bot monitoring behavior
botClient.on('player-id-updated', (event) => {
  const botId = event.detail
  console.log('Monitor bot ID assigned:', botId)

  // Start monitoring (no game interaction)
  setInterval(() => {
    const stats = {
      players: botClient.playerIds().length,
      totalClients: botClient.clientIds().length,
      timestamp: Date.now(),
    }
    console.log('Game stats:', stats)
  }, 5000)
})

// Handle bot events in your main client
client.on('bot-ids-updated', (event) => {
  const bots = event.detail
  console.log('Active monitor bots:', bots)

  // Update monitoring systems
  updateMonitoring(bots)
})
```

> **Important**: Bots can only monitor the game. They cannot send game state updates or interact with gameplay per JS13K Online competition rules.

## How State Synchronization Works

- When you send messages via `sendToPlayer` or `sendToAll`, the Lab13 SDK uses the base JS13K Online protocol to relay your messages.
- The server broadcasts your messages to other clients using the standard protocol.
- You handle incoming messages by listening to the socket's `message` event and parsing custom game messages.
- The Lab13 SDK automatically handles player ID management and connection tracking.

## Lab13 SDK vs Base Protocol

The Lab13 SDK enhances the base JS13K Online protocol with:

- **Automatic Client Tracking**: No need to manually query for connected clients
- **Enhanced Events**: Rich event system for client management
- **Bot Support**: Built-in support for AI players
- **Type Safety**: Full TypeScript support with proper event typing
- **Convenience Methods**: Higher-level APIs for common multiplayer patterns

The base protocol provides the core communication primitives, while Lab13 adds the conveniences that make multiplayer game development easier.

## Learn more

The tutorials (@tutorials/) feature more advanced state management patterns:

- [Understanding Game State](./tutorials/game-state)
- [Quantizing Deltas](./tutorials/quantizing)
- [Throttling Updates](./tutorials/throttling)
- [Evaluating Deltas](./tutorials/delta-evaluator)
- [State Ownership](./tutorials/ownership)
- [Lab13 SDK API Reference](./api-reference)
