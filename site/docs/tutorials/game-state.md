---
title: Understanding Game State
sidebar_position: 1
---

# Game State Management

The JS13K Online system uses a **trusted shared state relay** architecture where each client maintains a synchronized copy of the game state, and the server relays changes between all connected players.

## State Structure

Your game state is a JavaScript object that gets synchronized across all clients:

```js
// Basic game state structure
{
  players: {
    'player-id-1': { x: 100, y: 200, name: 'Alice', health: 100 },
    'player-id-2': { x: 300, y: 150, name: 'Bob', health: 80 }
  },
  // You can add any other game data here
  world: {
    items: [
      { id: 1, type: 'coin', x: 250, y: 300 },
      { id: 2, type: 'powerup', x: 400, y: 100 }
    ],
    score: 1250
  }
}
```

## The `players` Collection

The `players` object is special - the server automatically manages player connections and disconnections:

- When a player connects, an empty entry is created: `players[playerId] = {}`
- When a player disconnects, their entry is automatically removed
- You control what data goes into each player's state

```js
// When you connect, you get an empty player state
client.on('id', (myId) => {
  // Initialize your player data
  client.updateMyState({
    name: 'MyName',
    x: 400,
    y: 300,
    color: '#ff0000',
    health: 100,
    inventory: [],
  })
})
```

## State Management Methods

The SDK provides several methods for working with state:

### Getting State

```js
// Get the complete game state
const fullState = client.getState()
console.log(fullState.players, fullState.world)

// Get your own player state
const myState = client.getMyState()
console.log('My position:', myState.x, myState.y)

// Get another player's state
const otherPlayer = client.getPlayerState('other-player-id')
console.log('Other player health:', otherPlayer?.health)

// Get a copy (safe to modify without affecting the original)
const myStateCopy = client.getMyState(true)
myStateCopy.x += 10 // Won't affect the real state
```

### Updating State

There are two main ways to update state:

#### Update Your Player State

Most common - update your own player data:

```js
// Update specific properties of your player
client.updateMyState({
  x: newX,
  y: newY,
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

#### Update Any Part of State

For global game state (use carefully):

```js
// Update world state
client.updateState({
  world: {
    score: currentScore + 100,
    items: updatedItems,
  },
})

// Update multiple players (for game master scenarios)
client.updateState({
  players: {
    'player-1': { health: 50 },
    'player-2': { health: 75 },
  },
})
```

## Delta System

The SDK uses a delta-based system for efficiency - only changes are sent over the network:

```js
// Instead of sending the entire state every time...
const fullState = {
  players: {
    'me': { x: 100, y: 200, health: 100, name: 'Alice', inventory: [...] }
  }
}

// Only the changes are sent:
client.updateMyState({ x: 101, y: 202 }) // Only position changed
```

### Listening for Changes

Track state changes with events:

```js
// Listen for any state changes
client.on('delta', (delta) => {
  console.log('State changed:', delta)

  // Delta might look like:
  // { players: { 'player-id': { x: 150, y: 200 } } }

  // Update your game visuals based on the delta
  updateGameVisuals(delta)
})

// Listen for the initial state
client.on('state', (fullState) => {
  console.log('Initial state received:', fullState)
  initializeGame(fullState)
})
```

## State Design Patterns

### Player-Centric Games

Most games focus on player state:

```js
// Racing game
client.updateMyState({
  x: carX,
  y: carY,
  rotation: carAngle,
  speed: currentSpeed,
  lap: currentLap,
})

// RPG game
client.updateMyState({
  x: characterX,
  y: characterY,
  level: playerLevel,
  health: currentHealth,
  equipment: {
    weapon: 'sword',
    armor: 'chainmail',
  },
})
```

### World State Games

Games with shared world elements:

```js
// Black Cats Demo - shared mice state
import { generateUUID } from 'https://esm.sh/js13k-online'

// Spawn a new mouse
function spawnMouse() {
  const mouseId = generateUUID()
  client.updateState({
    mice: {
      [mouseId]: {
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        owner: client.getMyId(), // Only owner can move this mouse
      },
    },
  })
}

// Remove a mouse when caught
function catchMouse(mouseId) {
  const state = client.getState()
  const updatedMice = { ...state.mice }
  delete updatedMice[mouseId]
  client.updateState({ mice: updatedMice })
}
```

````js
// Tower defense - shared world state

```js
// Tower defense - shared world state
client.updateState({
  world: {
    towers: [
      { id: 1, x: 100, y: 100, type: 'cannon', owner: myId },
      { id: 2, x: 200, y: 150, type: 'laser', owner: 'other-player' },
    ],
    enemies: [{ id: 1, x: 50, y: 50, health: 100, type: 'orc' }],
  },
})

// City builder - collaborative building
client.updateState({
  world: {
    buildings: {
      1: { type: 'house', x: 100, y: 100, owner: myId },
      2: { type: 'shop', x: 200, y: 100, owner: 'other-player' },
    },
    resources: {
      wood: 150,
      stone: 75,
    },
  },
})
````

## Performance Optimization

### Throttling

The SDK automatically throttles updates (default: 50ms) to prevent network spam:

```js
// These rapid updates will be batched
for (let i = 0; i < 100; i++) {
  client.updateMyState({ x: i, y: i })
}
// Only the final state (x: 99, y: 99) gets sent
```

### Delta Evaluation

Control when updates should be sent:

```js
const client = new Js13kClient('my-room', {
  throttleMs: 16, // 60 FPS
  deltaEvaluator: (delta, remoteState, playerId) => {
    // Only send position updates if player moved significantly
    if (delta.players?.[playerId]) {
      const playerDelta = delta.players[playerId]
      const oldPos = remoteState.players?.[playerId] || {}

      if (playerDelta.x !== undefined || playerDelta.y !== undefined) {
        const dx = Math.abs(playerDelta.x - (oldPos.x || 0))
        const dy = Math.abs(playerDelta.y - (oldPos.y || 0))
        return dx > 5 || dy > 5 // Only send if moved > 5 pixels
      }
    }

    return true // Send other updates normally
  },
})
```

## State Validation

Since clients control their own state, consider validation patterns:

### Client-Side Validation

Each client can validate incoming changes:

```js
client.on('delta', (delta) => {
  // Validate player movements
  if (delta.players) {
    Object.entries(delta.players).forEach(([playerId, playerDelta]) => {
      if (playerDelta.x !== undefined) {
        // Check if movement is reasonable (anti-cheat)
        const currentPos = client.getPlayerState(playerId)
        const distance = Math.abs(playerDelta.x - currentPos.x)

        if (distance > MAX_MOVEMENT_PER_FRAME) {
          console.warn('Suspicious movement detected:', playerId)
          // Could ignore the update or report the player
          return
        }
      }
    })
  }

  // Apply validated changes
  updateGameFromDelta(delta)
})
```

### Normalizing Outgoing Deltas (normalizeDelta)

Before your changes are evaluated and sent, you can normalize them. This is helpful to reduce network noise (e.g., round positions).

```js
const client = new Js13kClient('my-room', {
  deltaNormalizer: (delta) => ({
    ...delta,
    players: Object.fromEntries(
      Object.entries(delta.players || {}).map(([id, p]) => [
        id,
        p == null ? null : { ...p, x: Math.round(p.x || 0), y: Math.round(p.y || 0) },
      ])
    ),
  }),
})
```

You can also use `deltaNormalizer` to strip local-only fields that should not be mirrored in shared state. For example, in the Black Cats demo (`site/static/demos/cats.html`) we omit `mouse.vx` and `mouse.vy` so velocity is simulated locally only.

### Authoritative Patterns

Designate one client as authoritative for certain state:

```js
// Game master pattern
const isGameMaster = myId === getOldestPlayerId()

if (isGameMaster) {
  // Only game master updates world state
  client.updateState({
    world: {
      enemies: updatedEnemies,
      items: updatedItems,
    },
  })
}
```

## Common Patterns

### Smooth Interpolation

For smooth movement between updates:

```js
class PlayerRenderer {
  constructor(playerId) {
    this.playerId = playerId
    this.targetPos = { x: 0, y: 0 }
    this.currentPos = { x: 0, y: 0 }
  }

  onDelta(delta) {
    const playerDelta = delta.players?.[this.playerId]
    if (playerDelta) {
      // Set new target position
      this.targetPos.x = playerDelta.x ?? this.targetPos.x
      this.targetPos.y = playerDelta.y ?? this.targetPos.y
    }
  }

  update(dt) {
    // Smoothly interpolate to target
    const speed = 5
    this.currentPos.x += (this.targetPos.x - this.currentPos.x) * speed * dt
    this.currentPos.y += (this.targetPos.y - this.currentPos.y) * speed * dt
  }
}
```

### State Compression

For large states, consider compression techniques:

```js
// Instead of sending full arrays every time
client.updateState({
  world: {
    cells: hugeArrayOfCells, // Expensive!
  },
})

// Send only changed cells
const changedCells = {}
cellUpdates.forEach((update) => {
  changedCells[`${update.x},${update.y}`] = update.data
})

client.updateState({
  world: {
    cellUpdates: changedCells,
  },
})
```
