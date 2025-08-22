---
title: Understanding Game State
sidebar_position: 1
---

# Game State Management

The Lab 13 system uses a **trusted shared state relay** architecture where each client maintains a synchronized copy of the game state, and the server relays changes between all connected players.

## State Structure

Your game state is a JavaScript object that gets synchronized across all clients:

```js
// Basic game state structure
{
  _players: {
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

### Entity collections (underscore‑prefixed)

Keys that start with `_` and contain objects are treated as entity collections. Entries are presumed to be GUID‑keyed, and setting an entry to `null` tombstones it so no future updates to that GUID are accepted. This prevents race conditions on deleted entities. See the tutorial "Managing Entities and Collections" for when to use underscored vs non‑underscored collections.

### Tombstoning

When you set an entity to `null` in an entity collection, it becomes "tombstoned":

- The entity is marked as deleted
- Future updates to that entity ID are ignored
- This prevents race conditions on deleted entities
- Tombstones persist for the duration of the session

```js
// This mouse is now deleted and cannot be resurrected
client.mutateState({
  _mice: { [mouseId]: null },
})

// This update will be ignored due to tombstoning
client.mutateState({
  _mice: { [mouseId]: { x: 300, y: 400 } }, // Ignored!
})
```

## The `_players` Collection

The `_players` object is special - the server automatically manages player connections and disconnections:

- When a player connects, an empty entry is created: `_players[playerId] = {}`
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
const fullState = client.state()
console.log(fullState._players, fullState.world)

// Get your own player state
const myState = fullState._players[client.playerId()]
console.log('My position:', myState?.x, myState?.y)

// Get another player's state
const otherPlayer = fullState._players['other-player-id']
console.log('Other player health:', otherPlayer?.health)
```

### Updating State

The primary method for updating state is `mutateState()`:

#### Update Your Player State

Most common - update your own player data:

```js
// Update specific properties of your player
client.mutateState({
  _players: {
    [client.playerId()]: {
      x: newX,
      y: newY,
    },
  },
})

// Update nested properties
const currentState = client.state()
const myState = currentState._players[client.playerId()] || {}
client.mutateState({
  _players: {
    [client.playerId()]: {
      inventory: [...(myState.inventory || []), 'new-item'],
      stats: {
        ...(myState.stats || {}),
        level: (myState.stats?.level || 0) + 1,
      },
    },
  },
})
```

#### Update Any Part of State

For global game state (use carefully):

```js
// Update world state
client.mutateState({
  world: {
    score: currentScore + 100,
    items: updatedItems,
  },
})

// Update multiple players (for game master scenarios)
client.mutateState({
  _players: {
    'player-1': { health: 50 },
    'player-2': { health: 75 },
  },
})
```

## Delta System and Deep Merging

The SDK uses a delta-based system for efficiency - only changes are sent over the network. It also uses deep merging to combine state updates:

```js
// Initial state
const state = {
  _players: {
    'player-1': { x: 100, y: 200, health: 100, name: 'Alice' },
  },
}

// Update only position
client.mutateState({
  _players: {
    'player-1': { x: 150, y: 250 },
  },
})

// Result: health and name are preserved, only x and y are updated
// { _players: { 'player-1': { x: 150, y: 250, health: 100, name: 'Alice' } } }
```

### Deep Merge Behavior

- **Objects**: Merged recursively
- **Arrays**: Replaced entirely (not merged)
- **Primitives**: Replaced
- **Null values**: Delete the key (for entity collections, this creates a tombstone)

```js
// Deep merge example
const currentState = {
  player: {
    position: { x: 100, y: 200 },
    inventory: ['sword', 'shield'],
    stats: { health: 100, mana: 50 },
  },
}

// Update
client.mutateState({
  player: {
    position: { x: 150 }, // Only x changes, y is preserved
    inventory: ['sword', 'shield', 'potion'], // Array is replaced
    stats: { health: 75 }, // Only health changes, mana is preserved
  },
})
```

### Listening for Changes

Track state changes with events:

```js
// Listen for any state changes
client.on('state-updated', (event) => {
  const { state, delta } = event.detail
  console.log('State changed:', delta)

  // Delta might look like:
  // { _players: { 'player-id': { x: 150, y: 200 } } }

  // Update your game visuals based on the delta
  updateGameVisuals(delta)
})

// Listen for the initial state (same event)
client.on('state-updated', (event) => {
  const { state, delta } = event.detail
  if (!delta) {
    // This is the initial state
    console.log('Initial state received:', state)
    initializeGame(state)
  }
})
```

## State Design Patterns

### Player-Centric Games

Most games focus on player state:

```js
// Racing game
client.mutateState({
  _players: {
    [client.playerId()]: {
      x: carX,
      y: carY,
      rotation: carAngle,
      speed: currentSpeed,
      lap: currentLap,
    },
  },
})

// RPG game
client.mutateState({
  _players: {
    [client.playerId()]: {
      x: characterX,
      y: characterY,
      level: playerLevel,
      health: currentHealth,
      equipment: {
        weapon: 'sword',
        armor: 'chainmail',
      },
    },
  },
})
```

### World State Games

Games with shared world elements:

```js
// Black Cats Demo - shared mice state
import { generateUUID } from 'https://esm.sh/js13k'

// Spawn a new mouse
function spawnMouse() {
  const mouseId = generateUUID()
  client.mutateState({
    _mice: {
      [mouseId]: {
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        owner: client.playerId(), // Only owner can move this mouse
      },
    },
  })
}

// Remove a mouse when caught using tombstoning
function catchMouse(mouseId) {
  client.mutateState({
    _mice: { [mouseId]: null },
  })
}
```

````js
// Tower defense - shared world state

```js
// Tower defense - shared world state
client.mutateState({
  world: {
    towers: [
      { id: 1, x: 100, y: 100, type: 'cannon', owner: myId },
      { id: 2, x: 200, y: 150, type: 'laser', owner: 'other-player' },
    ],
    enemies: [{ id: 1, x: 50, y: 50, health: 100, type: 'orc' }],
  },
})

// City builder - collaborative building
client.mutateState({
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

The Lab 13 SDK doesn't currently support delta evaluation in the same way as the previous version. Instead, you can implement your own throttling and evaluation logic:

```js
// Manual throttling for position updates
let lastUpdateTime = 0
const UPDATE_THROTTLE = 50 // ms

function updatePlayerPosition(x, y) {
  const now = Date.now()
  if (now - lastUpdateTime < UPDATE_THROTTLE) {
    return // Skip update if too soon
  }

  // Only send if movement is significant
  const currentState = client.state()
  const myState = currentState._players[client.playerId()] || {}
  const dx = Math.abs(x - (myState.x || 0))
  const dy = Math.abs(y - (myState.y || 0))

  if (dx > 5 || dy > 5) {
    client.mutateState({
      _players: {
        [client.playerId()]: { x, y },
      },
    })
    lastUpdateTime = now
  }
}
```

## State Validation

Since clients control their own state, consider validation patterns:

### Client-Side Validation

Each client can validate incoming changes:

```js
client.on('delta', (delta) => {
  // Validate player movements
  if (delta._players) {
    Object.entries(delta._players).forEach(([playerId, playerDelta]) => {
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

### Normalizing Outgoing Deltas

You can normalize your deltas before sending them to reduce network noise (e.g., round positions):

```js
// Helper function to normalize position data
function normalizePosition(delta) {
  if (delta._players) {
    const normalized = { ...delta }
    normalized._players = {}

    Object.entries(delta._players).forEach(([id, player]) => {
      if (player && typeof player === 'object') {
        normalized._players[id] = {
          ...player,
          x: player.x !== undefined ? Math.round(player.x) : player.x,
          y: player.y !== undefined ? Math.round(player.y) : player.y,
        }
      } else {
        normalized._players[id] = player
      }
    })

    return normalized
  }
  return delta
}

// Use before sending updates
function updatePlayerPosition(x, y) {
  const delta = {
    _players: {
      [client.playerId()]: { x, y },
    },
  }

  const normalized = normalizePosition(delta)
  client.mutateState(normalized)
}
```

You can also strip local-only fields that should not be mirrored in shared state. For example, in the Black Cats demo, velocity (`vx`, `vy`) is simulated locally only and not sent over the network.

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
    const playerDelta = delta._players?.[this.playerId]
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
