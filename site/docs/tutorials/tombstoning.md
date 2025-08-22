---
title: Understanding Tombstoning
sidebar_position: 11
---

# Understanding Tombstoning

Tombstoning is a key feature of the Lab 13 SDK that prevents race conditions when deleting entities in multiplayer games.

## What is Tombstoning?

When you set an entity to `null` in an entity collection (any object key starting with `_`), it becomes "tombstoned":

- The entity is marked as deleted
- Future updates to that entity ID are ignored
- This prevents race conditions on deleted entities
- Tombstones persist for the duration of the session

## Why Tombstoning Matters

In multiplayer games, network delays can cause race conditions:

```js
// Without tombstoning - RACE CONDITION!
// Player A deletes a mouse
client.mutateState({ _mice: { [mouseId]: null } })

// Player B moves the same mouse (late packet)
client.mutateState({ _mice: { [mouseId]: { x: 300, y: 400 } } })

// Result: The mouse is resurrected! 😱
```

With tombstoning:

```js
// Player A deletes a mouse (creates tombstone)
client.mutateState({ _mice: { [mouseId]: null } })

// Player B moves the same mouse (late packet)
client.mutateState({ _mice: { [mouseId]: { x: 300, y: 400 } } })

// Result: The update is ignored because mouseId is tombstoned ✅
```

## How to Use Tombstoning

### Deleting Entities

```js
import { generateUUID } from 'https://esm.sh/js13k'

// Create a mouse
const mouseId = generateUUID()
client.mutateState({
  _mice: {
    [mouseId]: { x: 100, y: 200, owner: client.playerId() },
  },
})

// Delete the mouse using tombstoning
client.mutateState({
  _mice: { [mouseId]: null },
})
```

### Handling Deletions in Your Game

```js
// Listen for state updates
client.on('state-updated', (event) => {
  const { delta } = event.detail

  // Check for deleted entities
  if (delta._mice) {
    Object.entries(delta._mice).forEach(([mouseId, mouseData]) => {
      if (mouseData === null) {
        // This mouse was deleted (tombstoned)
        removeMouseFromGame(mouseId)
        console.log(`Mouse ${mouseId} was deleted`)
      } else if (mouseData) {
        // This mouse was created or updated
        updateMouseInGame(mouseId, mouseData)
      }
    })
  }
})
```

## Entity Collections vs Regular Collections

### Entity Collections (Use Tombstoning)

Keys that start with `_` are entity collections:

```js
// Entity collections - use tombstoning for deletion
client.mutateState({
  _mice: { [mouseId]: null }, // ✅ Tombstoned
  _bullets: { [bulletId]: null }, // ✅ Tombstoned
  _players: { [playerId]: null }, // ✅ Tombstoned
  _items: { [itemId]: null }, // ✅ Tombstoned
})
```

### Regular Collections (No Tombstoning)

Keys that don't start with `_` are regular collections:

```js
// Regular collections - no tombstoning
client.mutateState({
  world: {
    items: ['sword', 'shield'], // Array replacement
    score: 1500, // Value replacement
  },
  settings: {
    difficulty: 'hard', // Value replacement
  },
})
```

## Best Practices

### 1. Use Entity Collections for Game Objects

```js
// Good: Use entity collections for game objects with lifecycle
client.mutateState({
  _enemies: { [enemyId]: { x: 100, y: 200, health: 50 } },
  _powerups: { [powerupId]: { x: 300, y: 400, type: 'health' } },
  _projectiles: { [projectileId]: { x: 150, y: 250, vx: 5, vy: 0 } },
})
```

### 2. Use Regular Collections for Static Data

```js
// Good: Use regular collections for static or derived data
client.mutateState({
  world: {
    level: 3,
    score: 1500,
    timeRemaining: 120,
  },
  gameState: {
    phase: 'playing',
    round: 1,
  },
})
```

### 3. Handle Tombstoned Entities Gracefully

```js
// Always check for null values when processing deltas
client.on('state-updated', (event) => {
  const { delta } = event.detail

  Object.entries(delta).forEach(([collectionName, changes]) => {
    if (collectionName.startsWith('_') && typeof changes === 'object') {
      // This is an entity collection
      Object.entries(changes).forEach(([entityId, entityData]) => {
        if (entityData === null) {
          // Entity was tombstoned - remove from game
          removeEntityFromGame(collectionName, entityId)
        } else if (entityData) {
          // Entity was created or updated
          updateEntityInGame(collectionName, entityId, entityData)
        }
      })
    }
  })
})
```

### 4. Avoid Resurrecting Tombstoned Entities

```js
// ❌ Don't do this - it will be ignored
client.mutateState({
  _mice: { [tombstonedMouseId]: { x: 100, y: 200 } },
})

// ✅ Instead, create a new entity with a new ID
const newMouseId = generateUUID()
client.mutateState({
  _mice: { [newMouseId]: { x: 100, y: 200 } },
})
```

## Common Patterns

### Spawn and Despawn

```js
// Spawn a new enemy
function spawnEnemy() {
  const enemyId = generateUUID()
  client.mutateState({
    _enemies: {
      [enemyId]: {
        x: Math.random() * 800,
        y: Math.random() * 600,
        health: 100,
        type: 'goblin',
      },
    },
  })
  return enemyId
}

// Despawn an enemy
function despawnEnemy(enemyId) {
  client.mutateState({
    _enemies: { [enemyId]: null },
  })
}
```

### Cleanup on Disconnect

```js
// Clean up player's entities when they disconnect
client.on('client-disconnected', (event) => {
  const disconnectedPlayerId = event.detail
  const state = client.state()

  // Find and remove all entities owned by the disconnected player
  Object.entries(state._mice || {}).forEach(([mouseId, mouse]) => {
    if (mouse.owner === disconnectedPlayerId) {
      client.mutateState({
        _mice: { [mouseId]: null },
      })
    }
  })
})
```

## Debugging Tombstoning

### Check if an Entity is Tombstoned

```js
// You can't directly check if an entity is tombstoned from the client
// But you can infer it from the state
const state = client.state()
const mouseExists = state._mice && state._mice[mouseId] !== undefined

if (!mouseExists) {
  console.log(`Mouse ${mouseId} either doesn't exist or is tombstoned`)
}
```

### Log Tombstoning Events

```js
client.on('state-updated', (event) => {
  const { delta } = event.detail

  if (delta._mice) {
    Object.entries(delta._mice).forEach(([mouseId, mouseData]) => {
      if (mouseData === null) {
        console.log(`🐭 Mouse ${mouseId} was tombstoned`)
      }
    })
  }
})
```

Tombstoning is a powerful feature that ensures your multiplayer games handle entity deletion correctly, preventing frustrating bugs and race conditions.

