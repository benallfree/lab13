---
title: Size Optimization
sidebar_position: 40
---

# Size Optimization for JS13K

The Lab13 SDK is designed for ultra-compact JS13K games. This guide covers techniques to minimize your game size while using the SDK effectively.

## SDK Size Characteristics

### **Tree-Shakable Design**

The SDK is built for maximum tree-shaking:

```typescript
// ✅ Only these functions will be included in your bundle
import { useOnline, useMyId, useState } from 'lab13-sdk'

// ❌ Avoid importing unused functions
import * as Lab13 from 'lab13-sdk' // Imports everything!
```

### **Function Composition**

No classes or inheritance - pure functions for maximum compression:

```typescript
// ✅ Good: Function composition
const { getMyId } = useMyId()
const { getState } = useState()

// ❌ Avoid: Classes (not used in SDK)
```

## Import Optimization

### **Selective Imports**

Only import what you need:

```typescript
// ✅ Minimal imports
import { useOnline, useMyId } from 'lab13-sdk'

// ✅ Add more as needed
import { useState, onClientJoined } from 'lab13-sdk'

// ❌ Avoid bulk imports
import * as Lab13 from 'lab13-sdk'
```

### **Import Patterns by Game Type**

**Simple Connection Only:**

```typescript
import { useOnline, useMyId } from 'lab13-sdk'
```

**Basic Multiplayer:**

```typescript
import { useOnline, useMyId, useState, onClientJoined, onClientLeft } from 'lab13-sdk'
```

**Advanced Multiplayer:**

```typescript
import {
  useOnline,
  useMyId,
  useState,
  createPositionNormalizer,
  generateUUID,
  ENTITY_COLLECTION_PREFIX,
} from 'lab13-sdk'
```

## State Management Optimization

### **Minimal State Structure**

Keep your state types as simple as possible:

```typescript
// ✅ Good: Simple, flat structure
type PlayerState = {
  x: number
  y: number
  s: number // score (short name)
}

// ❌ Avoid: Complex nested structures
type PlayerState = {
  position: { x: number; y: number }
  statistics: { score: number; level: number }
  inventory: { items: string[] }
}
```

### **Use Short Property Names**

Shorter names = smaller JSON payloads:

```typescript
// ✅ Good: Short names
type PlayerState = {
  x: number // position.x
  y: number // position.y
  s: number // score
  n: string // name
}

// ❌ Avoid: Long names
type PlayerState = {
  positionX: number
  positionY: number
  playerScore: number
  playerName: string
}
```

### **Avoid Redundant Data**

Don't store data that can be computed:

```typescript
// ✅ Good: Store only essential data
type PlayerState = {
  x: number
  y: number
  s: number
}

// ❌ Avoid: Storing computed values
type PlayerState = {
  x: number
  y: number
  s: number
  distanceFromOrigin: number // Can be computed
  isAtCenter: boolean // Can be computed
}
```

## Network Optimization

### **Use Normalizers**

Normalize data to reduce payload size:

```typescript
import { createPositionNormalizer } from 'lab13-sdk'

// Round positions to integers (saves ~50% size)
const normalizePosition = createPositionNormalizer(0)

const { updateMyState } = useState({
  onBeforeSendDelta: (delta) => normalizePosition(delta),
})
```

### **Throttle Updates**

Limit update frequency to reduce network traffic:

```typescript
const { updateMyState } = useState({
  deltaThrottleMs: 100, // 10 updates per second max
})
```

### **Send Only Changes**

Only update what actually changed:

```typescript
// ✅ Good: Only send changed data
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

## Code Optimization

### **Minimize Function Calls**

Reduce function call overhead:

```typescript
// ✅ Good: Direct property access
const players = getPlayerStates()
const myState = players[getMyId()]

// ❌ Avoid: Multiple function calls
const myState = getPlayerStates()[getMyId()]
const myX = myState?.x || 0
const myY = myState?.y || 0
```

### **Use Short Variable Names**

Shorter names compress better:

```typescript
// ✅ Good: Short, clear names
const p = getPlayerStates()
const m = p[getMyId()]
const x = m?.x || 0

// ❌ Avoid: Long variable names
const playerStates = getPlayerStates()
const myPlayerState = playerStates[getMyId()]
const playerPositionX = myPlayerState?.x || 0
```

### **Inline Simple Logic**

Avoid unnecessary functions for simple operations:

```typescript
// ✅ Good: Inline simple logic
updateMyState({ x: keys['ArrowLeft'] ? x - 5 : x + 5 })

// ❌ Avoid: Separate function for simple logic
function updatePosition() {
  if (keys['ArrowLeft']) {
    updateMyState({ x: x - 5 })
  } else {
    updateMyState({ x: x + 5 })
  }
}
```

## Bundle Optimization

### **Use Tree Shaking**

Ensure your bundler can tree-shake effectively:

```typescript
// ✅ Good: Named imports
import { useOnline, useMyId } from 'lab13-sdk'

// ❌ Avoid: Default imports
import Lab13 from 'lab13-sdk'
```

### **Minimize Dependencies**

Only use essential dependencies:

```typescript
// ✅ Good: Minimal dependencies
import { useOnline } from 'lab13-sdk'
// No other dependencies needed

// ❌ Avoid: Heavy dependencies
import { useOnline } from 'lab13-sdk'
import lodash from 'lodash' // Too heavy for JS13K
```

## Game-Specific Optimizations

### **Simple Multiplayer Games**

For basic multiplayer (like chat, presence):

```typescript
// Minimal setup - ~200 bytes
import { useOnline, useMyId } from 'lab13-sdk'
useOnline('room')
const { getMyId } = useMyId()
```

### **Movement-Based Games**

For games with player movement:

```typescript
// Movement setup - ~500 bytes
import { useOnline, useMyId, useState, createPositionNormalizer } from 'lab13-sdk'

useOnline('room')
const { getMyId } = useMyId()
const normalize = createPositionNormalizer(0)
const { updateMyState } = useState({ onBeforeSendDelta: normalize })
```

### **Entity-Based Games**

For games with multiple entity types:

```typescript
// Entity setup - ~800 bytes
import {
  useOnline,
  useMyId,
  useState,
  createPositionNormalizer,
  generateUUID,
  ENTITY_COLLECTION_PREFIX,
} from 'lab13-sdk'

useOnline('room')
const { getMyId } = useMyId()
const normalize = createPositionNormalizer(0)
const { updateMyState, updateState } = useState({ onBeforeSendDelta: normalize })
```

## Size Monitoring

### **Track Bundle Size**

Monitor your bundle size during development:

```bash
# Check bundle size
npx l13 build --debug

# Look for size information in output
```

### **Analyze Imports**

Check what's being included:

```typescript
// Add this temporarily to see what's imported
console.log('SDK functions:', { useOnline, useMyId, useState })
```

## Common Pitfalls

### **1. Over-Engineering**

Keep it simple:

```typescript
// ✅ Good: Simple and direct
updateMyState({ x: newX, y: newY })

// ❌ Avoid: Over-engineered
const movementSystem = {
  updatePosition: (x, y) => updateMyState({ x, y }),
}
movementSystem.updatePosition(newX, newY)
```

### **2. Unnecessary Abstractions**

Avoid abstractions that add size:

```typescript
// ✅ Good: Direct state updates
updateMyState({ score: score + 10 })

// ❌ Avoid: Unnecessary wrapper
function addScore(points) {
  updateMyState({ score: getCurrentScore() + points })
}
addScore(10)
```

### **3. Redundant State**

Don't store what you can compute:

```typescript
// ✅ Good: Store only essential data
type PlayerState = { x: number; y: number; s: number }

// ❌ Avoid: Storing computed values
type PlayerState = {
  x: number
  y: number
  s: number
  distance: number // Can be computed from x,y
}
```

## Size Budget Breakdown

For a 13KB game, consider this rough budget:

- **SDK Core**: ~2-3KB (useOnline, useMyId, useState)
- **Game Logic**: ~5-7KB
- **Assets**: ~2-3KB
- **HTML/CSS**: ~1KB

**Total**: ~10-14KB

## Quick Size Checklist

- [ ] Use selective imports only
- [ ] Minimize state structure
- [ ] Use short property names
- [ ] Normalize data with normalizers
- [ ] Throttle frequent updates
- [ ] Send only changed data
- [ ] Use short variable names
- [ ] Inline simple logic
- [ ] Avoid unnecessary abstractions
- [ ] Monitor bundle size regularly

## Example: Optimized Game

Here's an example of a size-optimized multiplayer game:

```typescript
import { useOnline, useMyId, useState, createPositionNormalizer } from 'lab13-sdk'

// Connect
useOnline('game')

// Setup
const { getMyId } = useMyId()
const n = createPositionNormalizer(0)
const { updateMyState, getPlayerStates } = useState({ onBeforeSendDelta: n })

// Game loop
function loop() {
  const p = getPlayerStates()
  const m = p[getMyId()]
  if (m) {
    const x = m.x || 0
    const y = m.y || 0
    updateMyState({
      x: keys['ArrowLeft'] ? x - 5 : keys['ArrowRight'] ? x + 5 : x,
      y: keys['ArrowUp'] ? y - 5 : keys['ArrowDown'] ? y + 5 : y,
    })
  }
  requestAnimationFrame(loop)
}

loop()
```

This approach keeps your game under the 13KB limit while providing full multiplayer functionality.
