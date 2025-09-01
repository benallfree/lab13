---
title: Getting Started
sidebar_position: 2
---

# Getting Started with Lab13 SDK

This guide will walk you through creating a multiplayer game using the Lab13 SDK for JS13K Online.

## Quick Start

### 1. Install the SDK

```bash
npm install lab13-sdk
```

### 2. Basic Connection

Create a simple multiplayer connection:

```typescript
import { useOnline, useMyId, onOpen, onClose } from 'lab13-sdk'

// Connect to a room (automatically loads PartySocket)
useOnline('mewsterpiece/my-game')

// Get your player ID
const { getMyId } = useMyId()

// Handle connection events
onOpen(() => {
  console.log('Connected! My ID:', getMyId())
})

onClose(() => {
  console.log('Disconnected')
})
```

### 3. Player Tracking

Track when players join and leave:

```typescript
import { onClientJoined, onClientLeft } from 'lab13-sdk'

onClientJoined((clientId) => {
  console.log('Player joined:', clientId)
  // Add player to your game
})

onClientLeft((clientId) => {
  console.log('Player left:', clientId)
  // Remove player from your game
})
```

## Complete Example: Multiplayer Chat

Let's build a simple multiplayer chat application:

```typescript
import { useOnline, useMyId, useState, onClientJoined, onClientLeft, onOpen, onClose } from 'lab13-sdk'

// Connect to chat room
useOnline('mewsterpiece/chat')

// Get player ID
const { getMyId } = useMyId()

// Define chat message type
type ChatMessage = {
  text: string
  timestamp: number
  author: string
}

// Define game state
type GameState = {
  '@players': {
    [playerId: string]: {
      messages: ChatMessage[]
    }
  }
}

// Set up state management
const { getState, updateMyState, getPlayerStates } = useState<GameState>()

// Handle connection
onOpen(() => {
  console.log('Connected to chat!')
  document.getElementById('status')!.textContent = 'Connected'
})

onClose(() => {
  console.log('Disconnected from chat')
  document.getElementById('status')!.textContent = 'Disconnected'
})

// Handle players joining/leaving
onClientJoined((clientId) => {
  console.log('Player joined chat:', clientId)
  updatePlayerList()
})

onClientLeft((clientId) => {
  console.log('Player left chat:', clientId)
  updatePlayerList()
})

// Send a message
function sendMessage(text: string) {
  const myId = getMyId()
  const message: ChatMessage = {
    text,
    timestamp: Date.now(),
    author: myId,
  }

  // Add message to my state
  updateMyState({
    messages: [message],
  })
}

// Update player list display
function updatePlayerList() {
  const players = getPlayerStates()
  const playerList = document.getElementById('players')!
  playerList.innerHTML = Object.keys(players)
    .map((id) => `<div>${id === getMyId() ? 'You' : `Player ${id}`}</div>`)
    .join('')
}

// Render chat messages
function renderChat() {
  const players = getPlayerStates()
  const chatContainer = document.getElementById('chat')!

  const allMessages: (ChatMessage & { playerId: string })[] = []

  Object.entries(players).forEach(([playerId, playerState]) => {
    if (playerState.messages) {
      playerState.messages.forEach((msg) => {
        allMessages.push({ ...msg, playerId })
      })
    }
  })

  // Sort by timestamp
  allMessages.sort((a, b) => a.timestamp - b.timestamp)

  chatContainer.innerHTML = allMessages
    .map(
      (msg) =>
        `<div><strong>${msg.playerId === getMyId() ? 'You' : `Player ${msg.playerId}`}:</strong> ${msg.text}</div>`
    )
    .join('')
}

// Set up UI
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('messageInput') as HTMLInputElement
  const sendButton = document.getElementById('sendButton') as HTMLButtonElement

  sendButton.addEventListener('click', () => {
    if (input.value.trim()) {
      sendMessage(input.value.trim())
      input.value = ''
    }
  })

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      sendMessage(input.value.trim())
      input.value = ''
    }
  })

  // Render loop
  setInterval(() => {
    renderChat()
    updatePlayerList()
  }, 100)
})
```

## Advanced Example: Multiplayer Game

Here's a more complex example showing a multiplayer game with state synchronization:

```typescript
import {
  useOnline,
  useMyId,
  useState,
  createPositionNormalizer,
  onClientJoined,
  onClientLeft,
  onOpen,
  onClose,
} from 'lab13-sdk'

// Connect to game room
useOnline('mewsterpiece/my-game')

// Get player ID
const { getMyId } = useMyId()

// Define player state
type PlayerState = {
  x: number
  y: number
  score: number
  name: string
}

// Define game state
type GameState = {
  '@players': {
    [playerId: string]: PlayerState
  }
}

// Create position normalizer for network efficiency
const normalizePosition = createPositionNormalizer<GameState>(0)

// Set up state management with normalization
const { getState, updateMyState, getPlayerStates } = useState<GameState>({
  onBeforeSendDelta: (delta) => {
    // Normalize position data before sending
    return normalizePosition(delta)
  },
  onDeltaReceived: (delta) => {
    // Handle incoming state updates
    console.log('Received state update:', delta)
    return delta
  },
})

// Game variables
let keys: Record<string, boolean> = {}
let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D

// Initialize game
function initGame() {
  canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
  ctx = canvas.getContext('2d')!

  // Set up input handling
  document.addEventListener('keydown', (e) => {
    keys[e.key] = true
  })

  document.addEventListener('keyup', (e) => {
    keys[e.key] = false
  })

  // Start game loop
  gameLoop()
}

// Update player movement
function updatePlayer() {
  const myId = getMyId()
  const myState = getPlayerStates()[myId]

  if (!myState) return

  let newX = myState.x || 100
  let newY = myState.y || 100

  // Handle input
  if (keys['ArrowUp']) newY -= 5
  if (keys['ArrowDown']) newY += 5
  if (keys['ArrowLeft']) newX -= 5
  if (keys['ArrowRight']) newX += 5

  // Update state
  updateMyState({
    x: newX,
    y: newY,
  })
}

// Render all players
function renderPlayers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const players = getPlayerStates()
  const myId = getMyId()

  Object.entries(players).forEach(([playerId, playerState]) => {
    if (!playerState) return

    const isMyPlayer = playerId === myId
    const color = isMyPlayer ? '#ff0000' : '#0000ff'

    // Draw player
    ctx.fillStyle = color
    ctx.fillRect(playerState.x - 10, playerState.y - 10, 20, 20)

    // Draw name
    ctx.fillStyle = '#000'
    ctx.font = '12px Arial'
    ctx.fillText(playerState.name || playerId, playerState.x - 10, playerState.y - 25)
  })
}

// Game loop
function gameLoop() {
  updatePlayer()
  renderPlayers()
  requestAnimationFrame(gameLoop)
}

// Handle connection events
onOpen(() => {
  console.log('Connected to game!')
  initGame()
})

onClose(() => {
  console.log('Disconnected from game')
})

// Handle players
onClientJoined((clientId) => {
  console.log('Player joined:', clientId)
})

onClientLeft((clientId) => {
  console.log('Player left:', clientId)
})
```

## Key Concepts

### 1. **Automatic PartySocket Loading**

The SDK automatically loads PartySocket from the JS13K CDN:

```typescript
import { useOnline } from 'lab13-sdk'

// This automatically:
// 1. Loads PartySocket from https://js13kgames.com/2025/online/partysocket.js
// 2. Sets window.PartySocket
// 3. Creates window.socket
useOnline('room-name')
```

### 2. **State Management**

Use `useState` for synchronized game state:

```typescript
const { getState, updateMyState, getPlayerStates } = useState({
  onBeforeSendDelta: (delta) => {
    // Normalize data before sending
    return normalizePosition(delta)
  },
})
```

### 3. **Data Normalization**

Normalize data to reduce network traffic:

```typescript
const normalizePosition = createPositionNormalizer(0) // Round to integers
const normalizeRotation = createRotationNormalizer(2) // Round to 2 decimal places
```

### 4. **Player Tracking**

Track players with simple event handlers:

```typescript
onClientJoined((clientId) => {
  // Handle new player
})

onClientLeft((clientId) => {
  // Handle player leaving
})
```

## Next Steps

- Explore the [API Reference](/docs/api/) for detailed function documentation
- Learn about [state management patterns](/docs/sdk/state-management)
- See [optimization techniques](/docs/sdk/optimization) for staying under 13KB
