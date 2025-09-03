---
title: State Management
sidebar_position: 3
---

# State Management with Lab13 SDK

The Lab13 SDK provides powerful state synchronization systems designed for multiplayer games. This guide covers the core concepts and patterns for managing shared game state.

## Recommended Approach: useEasyState

**`useEasyState` is the recommended and preferred method for state management** in Lab13 games. It provides automatic optimizations and a simplified API that handles common multiplayer game patterns out of the box.

### Why useEasyState?

- **Automatic normalization** of position and rotation data
- **Built-in precision control** for network optimization
- **Automatic player lifecycle management** with callbacks
- **Simplified API** that reduces boilerplate code
- **Optimized for JS13K** with minimal code footprint

## Core Concepts

### State Structure

The SDK uses a specific state structure optimized for multiplayer games:

```typescript
import { StateBase } from 'lab13-sdk'

type PlayerState = {
  x: number
  y: number
  score: number
  name: string
}

type GameState = StateBase<PlayerState>
```

The `StateBase` type automatically includes the `@players` collection, so you only need to define your player state structure.

### Key Features

- **Automatic synchronization** between all connected players
- **Delta updates** for efficient network usage
- **Deep merging** of state changes
- **Type safety** with TypeScript
- **Normalization** for network optimization

## Getting Started with useEasyState

### Basic Setup

```typescript
import { useEasyState, StateBase } from 'lab13-sdk'

type PlayerState = {
  x: number
  y: number
  score: number
  name: string
}

type GameState = StateBase<PlayerState>

const { getState, updateMyState, getPlayerStates, getMyState } = useEasyState<GameState>({
  positionPrecision: 2, // Round positions to 2 decimal places
  rotationPrecision: 2, // Round rotations to 2 decimal places
  rotationUnits: 'd', // Use degrees (or 'r' for radians)
  onPlayerStateAvailable: (id, state) => {
    // Called when a new player joins
    console.log('New player joined:', id, state)
    spawnPlayer(id, state)
  },
})
```

### Configuration Options

```typescript
const { updateMyState, getMyState, getPlayerStates } = useEasyState<GameState>({
  // Position and rotation precision for network optimization
  positionPrecision: 0, // Round to integers
  rotationPrecision: 2, // Round to 2 decimal places
  rotationUnits: 'd', // 'd' for degrees, 'r' for radians

  // Player lifecycle callback
  onPlayerStateAvailable: (id, state) => {
    // Handle new player joining
    spawnPlayer(id, state)
  },

  // Advanced options (inherited from useState)
  deltaThrottleMs: 50, // Send updates every 50ms maximum
  debug: false, // Enable debug logging
})
```

### Updating Your State

```typescript
// Update your player's position
updateMyState({
  x: 100,
  y: 200,
})

// Update your player's score
updateMyState({
  score: 150,
})

// Update multiple properties at once
updateMyState({
  x: 150,
  y: 250,
  score: 200,
})
```

### Reading State

```typescript
// Get all players
const players = getPlayerStates()

// Get your state
const myState = getMyState()

// Get a specific player's state
const otherPlayer = getPlayerStates()['player-123']

// Get complete game state
const fullState = getState()
```

## Advanced State Management

### Custom State Processing

```typescript
const { getState, updateMyState } = useEasyState<GameState>({
  positionPrecision: 2,
  rotationPrecision: 2,
  rotationUnits: 'd',

  // Custom processing before sending (inherited from useState)
  onBeforeSendDelta: (delta) => {
    console.log('Sending delta:', delta)
    return delta
  },

  // Custom processing when receiving (inherited from useState)
  onDeltaReceived: (delta) => {
    console.log('Received delta:', delta)
    return delta
  },

  // Custom processing when receiving full state (inherited from useState)
  onStateReceived: (currentState, newState) => {
    console.log('Received full state:', newState)
    return newState
  },
})
```

### State Throttling

Control how often state updates are sent:

```typescript
const { getState, updateMyState } = useEasyState<GameState>({
  positionPrecision: 2,
  rotationPrecision: 2,
  rotationUnits: 'd',
  deltaThrottleMs: 50, // Send updates every 50ms maximum
})
```

## Entity Management

### Adding Game Entities

For games with multiple entity types (players, enemies, items, etc.):

```typescript
import { ENTITY_COLLECTION_PREFIX } from 'lab13-sdk'

type PlayerState = {
  x: number
  y: number
  score: number
}

type MouseState = {
  x: number
  y: number
  _vx: number
  _vy: number
  _owner: string
}

// Define entity collection keys
const MICE_ENTITY_COLLECTION_KEY = `${ENTITY_COLLECTION_PREFIX}mice`

type GameState = StateBase<PlayerState> & {
  [MICE_ENTITY_COLLECTION_KEY]: {
    [entityId: string]: MouseState
  }
}
```

### Managing Entities

```typescript
import { generateUUID } from 'lab13-sdk'

// Create a new mouse entity
function spawnMouse() {
  const mouseId = generateUUID()
  const mouseState: MouseState = {
    x: Math.random() * 800,
    y: Math.random() * 600,
    _vx: 0,
    _vy: 0,
    _owner: '',
  }

  updateState({
    [MICE_ENTITY_COLLECTION_KEY]: {
      [mouseId]: mouseState,
    },
  })
}

// Remove a mouse entity
function removeMouse(mouseId: string) {
  updateState({
    [MICE_ENTITY_COLLECTION_KEY]: {
      [mouseId]: null, // Setting to null removes the entity
    },
  })
}
```

## State Synchronization Patterns

### 1. **Player Movement**

```typescript
// Handle player input and update state
function updatePlayerMovement() {
  const myState = getMyState()

  if (!myState) return

  let newX = myState.x || 100
  let newY = myState.y || 100

  // Handle input
  if (keys['ArrowUp']) newY -= 5
  if (keys['ArrowDown']) newY += 5
  if (keys['ArrowLeft']) newX -= 5
  if (keys['ArrowRight']) newX += 5

  // Update state (automatically syncs to all players)
  updateMyState({
    x: newX,
    y: newY,
  })
}
```

### 2. **Score Tracking**

```typescript
// Update player score
function addScore(points: number) {
  const myState = getMyState()
  const currentScore = myState?.score || 0

  updateMyState({
    score: currentScore + points,
  })
}
```

### 3. **Shared Game Objects**

```typescript
// Update shared game state (not player-specific)
function updateSharedState() {
  updateState({
    gameTime: Date.now(),
    level: currentLevel,
    // This updates the root state, not player state
  })
}
```

### 4. **Entity Ownership**

```typescript
// Claim ownership of an entity
function claimMouse(mouseId: string) {
  const myId = getMyId()

  updateState({
    [MICE_ENTITY_COLLECTION_KEY]: {
      [mouseId]: {
        _owner: myId,
      },
    },
  })
}
```

## Best Practices

### 1. **Use Delta Updates**

Only send changed data:

```typescript
// ✅ Good: Only send what changed
updateMyState({
  x: newX,
  y: newY,
})

// ❌ Avoid: Sending unchanged data
updateMyState({
  x: newX,
  y: newY,
  score: currentScore, // Don't send if unchanged
  name: currentName, // Don't send if unchanged
})
```

### 2. **Configure Precision Appropriately**

Use precision settings to reduce network traffic:

```typescript
const { updateMyState } = useEasyState<GameState>({
  positionPrecision: 0, // Round positions to integers for simple games
  rotationPrecision: 2, // Keep rotation precision for smooth movement
  rotationUnits: 'd',
})
```

### 3. **Handle Missing State**

Always check for undefined state:

```typescript
const myState = getMyState()

if (myState) {
  // Use myState safely
  console.log('My position:', myState.x, myState.y)
}
```

### 4. **Use Private Keys for Local Data**

Use keys starting with `_` for data that shouldn't be synced:

```typescript
type PlayerState = {
  x: number
  y: number
  score: number
  _lastInputTime: number // Private, not synced
  _localAnimationFrame: number // Private, not synced
}
```

### 5. **Throttle Frequent Updates**

For high-frequency updates like movement:

```typescript
const { updateMyState } = useEasyState<GameState>({
  positionPrecision: 2,
  rotationPrecision: 2,
  rotationUnits: 'd',
  deltaThrottleMs: 50, // Limit to 20 updates per second
})
```

## Private Fields

### Overview

Private fields are a key optimization in the Lab13 SDK that help reduce network traffic and improve performance. Any object property that starts with an underscore (`_`) is considered private and is automatically filtered out before being sent to other players.

### How Private Fields Work

```typescript
type PlayerState = {
  x: number
  y: number
  score: number
  _lastInputTime: number // Private - not synced
  _localAnimationFrame: number // Private - not synced
  _interpolationData: any // Private - not synced
}

// When you update state with private fields
updateMyState({
  x: 100,
  y: 200,
  _lastInputTime: Date.now(), // This won't be sent to other players
})

// Only the public fields (x, y) are synchronized
// Private fields (_lastInputTime) remain local only
```

### Use Cases for Private Fields

1. **Local Animation State**

   ```typescript
   type PlayerState = {
     x: number
     y: number
     _animationFrame: number
     _interpolationStart: { x: number; y: number }
     _interpolationEnd: { x: number; y: number }
   }
   ```

2. **Input Buffering**

   ```typescript
   type PlayerState = {
     x: number
     y: number
     _inputBuffer: string[]
     _lastProcessedInput: number
   }
   ```

3. **Performance Metrics**

   ```typescript
   type PlayerState = {
     x: number
     y: number
     _fps: number
     _latency: number
     _lastUpdateTime: number
   }
   ```

4. **Temporary State**
   ```typescript
   type PlayerState = {
     x: number
     y: number
     _isMoving: boolean
     _moveStartTime: number
     _targetPosition: { x: number; y: number }
   }
   ```

### Benefits

- **Reduced Network Traffic**: Private fields don't consume bandwidth
- **Better Performance**: Less data to serialize/deserialize
- **Cleaner State**: Public state remains focused on essential game data
- **Local Flexibility**: Store temporary or computed data without affecting sync

## Entity Collections and Tombstoning

### Overview

Entity collections are special state structures that begin with the `@` prefix. They provide automatic entity lifecycle management through a process called "tombstoning" - a technique for efficiently removing entities from the game state.

### How Entity Collections Work

```typescript
import { ENTITY_COLLECTION_PREFIX } from 'lab13-sdk'

// Define entity collection keys
const MICE_ENTITY_COLLECTION_KEY = `${ENTITY_COLLECTION_PREFIX}mice`
const PROJECTILES_ENTITY_COLLECTION_KEY = `${ENTITY_COLLECTION_PREFIX}projectiles`

type GameState = StateBase<PlayerState> & {
  [MICE_ENTITY_COLLECTION_KEY]: {
    [entityId: string]: MouseState
  }
  [PROJECTILES_ENTITY_COLLECTION_KEY]: {
    [entityId: string]: ProjectileState
  }
}
```

### What is Tombstoning?

Tombstoning is a technique where deleted entities are marked with a "tombstone" rather than being immediately removed from the state. This ensures that all players receive the deletion notification and can properly clean up their local references.

### How Tombstoning Works

1. **Entity Deletion**: When you set an entity to `null`, it's immediately removed from local state
2. **Broadcast**: The deletion (null value) is broadcast to all other players
3. **Tombstone Creation**: The entity ID is added to a tombstone set to prevent future updates
4. **Protection**: Any incoming updates for that entity ID are ignored while it's tombstoned

```typescript
// Remove a mouse entity
function removeMouse(mouseId: string) {
  updateState({
    [MICE_ENTITY_COLLECTION_KEY]: {
      [mouseId]: null, // This triggers tombstoning
    },
  })
}

// The entity is immediately removed locally and the deletion is broadcast
// to all other players. The entity ID is tombstoned to prevent future updates.
```

### Why Tombstoning Matters

1. **Prevents Entity Revival**: Without tombstoning, an entity deleted locally could be "revived" by a late-arriving update from a peer. For example:
   - Player A deletes a mouse entity
   - Player B had already sent an update for that mouse (in-flight)
   - Without tombstoning, Player B's late update would recreate the deleted mouse
   - With tombstoning, the late update is ignored and the entity stays deleted

2. **Network Resilience**: Handles cases where deletion messages might be lost or arrive out of order

3. **State Consistency**: Prevents orphaned entities from persisting across the network

4. **Memory Management**: Automatic cleanup prevents memory leaks from deleted entities

### Entity Lifecycle Example

```typescript
// 1. Create entity
function spawnMouse() {
  const mouseId = generateUUID()
  updateState({
    [MICE_ENTITY_COLLECTION_KEY]: {
      [mouseId]: {
        x: Math.random() * 800,
        y: Math.random() * 600,
        _vx: 0,
        _vy: 0,
        _owner: '',
      },
    },
  })
}

// 2. Update entity
function moveMouse(mouseId: string, x: number, y: number) {
  updateState({
    [MICE_ENTITY_COLLECTION_KEY]: {
      [mouseId]: {
        x,
        y,
      },
    },
  })
}

// 3. Delete entity (tombstoning)
function removeMouse(mouseId: string) {
  updateState({
    [MICE_ENTITY_COLLECTION_KEY]: {
      [mouseId]: null, // Triggers tombstoning
    },
  })
}
```

### Best Practices for Entity Collections

1. **Use Descriptive Names**

   ```typescript
   const ENEMIES_ENTITY_COLLECTION_KEY = `${ENTITY_COLLECTION_PREFIX}enemies`
   const POWERUPS_ENTITY_COLLECTION_KEY = `${ENTITY_COLLECTION_PREFIX}powerups`
   const EFFECTS_ENTITY_COLLECTION_KEY = `${ENTITY_COLLECTION_PREFIX}effects`
   ```

2. **Include Private Fields for Local State**

   ```typescript
   type MouseState = {
     x: number
     y: number
     _vx: number // Private - local velocity
     _vy: number // Private - local velocity
     _owner: string // Private - ownership tracking
   }
   ```

3. **Handle Missing Entities Gracefully**

   ```typescript
   function getMouse(mouseId: string) {
     const mice = getState()[MICE_ENTITY_COLLECTION_KEY] || {}
     return mice[mouseId]
   }
   ```

4. **Batch Entity Operations**

   ```typescript
   function spawnMultipleMice(count: number) {
     const mice: Record<string, MouseState> = {}

     for (let i = 0; i < count; i++) {
       const mouseId = generateUUID()
       mice[mouseId] = {
         x: Math.random() * 800,
         y: Math.random() * 600,
         _vx: 0,
         _vy: 0,
         _owner: '',
       }
     }

     updateState({
       [MICE_ENTITY_COLLECTION_KEY]: mice,
     })
   }
   ```

## Debugging State

### Enable Debug Logging

```typescript
const { updateMyState } = useEasyState<GameState>({
  positionPrecision: 2,
  rotationPrecision: 2,
  rotationUnits: 'd',
  debug: true, // Enable debug logging
})
```

### Monitor State Changes

```typescript
// Log state changes
setInterval(() => {
  const players = getPlayerStates()
  console.log('Current players:', players)
}, 1000)
```

## Performance Tips

1. **Use appropriate precision settings** for your game type
2. **Use throttling** for high-frequency updates
3. **Only send changed data** in deltas
4. **Use private keys** for local-only data
5. **Avoid deep nesting** in state structure
6. **Batch updates** when possible

## Example: Complete Game with useEasyState

Here's a complete example showing a multiplayer game using `useEasyState`:

```typescript
import { useEasyState, StateBase, generateUUID, ENTITY_COLLECTION_PREFIX } from 'lab13-sdk'

type PlayerState = {
  x: number
  y: number
  score: number
  name: string
}

type MouseState = {
  x: number
  y: number
  _vx: number
  _vy: number
  _owner: string
}

const MICE_ENTITY_COLLECTION_KEY = `${ENTITY_COLLECTION_PREFIX}mice`

type GameState = StateBase<PlayerState> & {
  [MICE_ENTITY_COLLECTION_KEY]: {
    [entityId: string]: MouseState
  }
}

const { getState, updateMyState, updateState, getPlayerStates, getMyState } = useEasyState<GameState>({
  positionPrecision: 2,
  rotationPrecision: 2,
  rotationUnits: 'd',
  deltaThrottleMs: 50,
  onPlayerStateAvailable: (id, state) => {
    console.log('New player joined:', id, state)
    spawnPlayer(id, state)
  },
})

// Game functions
function spawnMouse() {
  const mouseId = generateUUID()
  updateState({
    [MICE_ENTITY_COLLECTION_KEY]: {
      [mouseId]: {
        x: Math.random() * 800,
        y: Math.random() * 600,
        _vx: 0,
        _vy: 0,
        _owner: '',
      },
    },
  })
}

function claimMouse(mouseId: string) {
  updateState({
    [MICE_ENTITY_COLLECTION_KEY]: {
      [mouseId]: {
        _owner: getMyId(),
      },
    },
  })
}

function updatePlayerPosition(x: number, y: number) {
  updateMyState({ x, y })
}

function addScore(points: number) {
  const myState = getMyState()
  const currentScore = myState?.score || 0
  updateMyState({ score: currentScore + points })
}
```

## Advanced: useState (Legacy)

For advanced use cases or when you need complete control over the state management process, you can use the lower-level `useState` function. However, `useEasyState` is recommended for most games.

### useState API

```typescript
import { useState } from 'lab13-sdk'

const { getState, updateMyState, getPlayerStates } = useState<GameState>({
  onBeforeSendDelta: (delta) => {
    // Custom processing before sending
    return delta
  },
  onDeltaReceived: (delta) => {
    // Custom processing when receiving
    return delta
  },
  onStateReceived: (currentState, newState) => {
    // Custom processing when receiving full state
    return newState
  },
  deltaThrottleMs: 50,
})
```

This pattern provides a solid foundation for building complex multiplayer games while maintaining the size constraints required for JS13K.
