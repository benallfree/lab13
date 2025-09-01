---
title: Position & Rotation Normalization
sidebar_position: 5
---

# Position & Rotation Normalization

Position and rotation normalization is a crucial optimization technique for multiplayer games. This tutorial explains how it works, why it matters, and how to use it effectively with the Lab13 SDK.

## Why Normalization Matters

### **The Problem: Floating Point Precision**

In multiplayer games, positions and rotations are often stored as floating-point numbers:

```typescript
// Without normalization - lots of precision
const position = {
  x: 123.45678901234567,
  y: 98.76543210987654,
  rotation: 1.2345678901234567,
}
```

This creates several issues:

1. **Large payloads**: Sending 15+ decimal places wastes bandwidth
2. **Meaningless precision**: 0.00000000000001 pixel differences aren't visible
3. **Network noise**: Tiny changes trigger unnecessary updates
4. **Compression inefficiency**: Random decimals don't compress well

### **The Solution: Normalization**

Normalization rounds values to meaningful precision:

```typescript
// With normalization - only meaningful precision
const position = {
  x: 123, // Rounded to integer
  y: 99, // Rounded to integer
  rotation: 1.23, // Rounded to 2 decimal places
}
```

## How the SDK's Delta System Works

The Lab13 SDK uses a **delta-based synchronization system** that only sends **changes** across the network:

```typescript
// SDK automatically detects and sends only changes
updateMyState({ x: 100, y: 200 }) // Only x and y are sent
updateMyState({ x: 101, y: 200 }) // Only x is sent (y didn't change)
updateMyState({ x: 101, y: 200 }) // Nothing is sent (no changes)
```

### **The Challenge: Floating Point Noise**

Without normalization, tiny floating-point differences trigger unnecessary updates:

```typescript
// ❌ Problem: Tiny changes trigger network updates
updateMyState({ x: 100.00000000000001 }) // Network update
updateMyState({ x: 100.00000000000002 }) // Network update
updateMyState({ x: 100.00000000000003 }) // Network update
// ... hundreds of meaningless updates
```

### **The Solution: Normalize Before Sending**

Normalization prevents meaningless updates:

```typescript
// ✅ Solution: Normalize to meaningful precision
const normalizePosition = createPositionNormalizer(0) // Round to integers

const { updateMyState } = useState({
  onBeforeSendDelta: (delta) => normalizePosition(delta),
})

updateMyState({ x: 100.00000000000001 }) // Sends: { x: 100 }
updateMyState({ x: 100.00000000000002 }) // Nothing sent (still 100)
updateMyState({ x: 100.00000000000003 }) // Nothing sent (still 100)
updateMyState({ x: 101.00000000000001 }) // Sends: { x: 101 }
```

## Using Normalizers

### **Position Normalization**

The `createPositionNormalizer` helper assumes your position properties are named `x`, `y`, and `z`:

```typescript
import { createPositionNormalizer } from 'lab13-sdk'

// Round positions to integers (most common)
const normalizePosition = createPositionNormalizer(0)

// Round to 1 decimal place (for smoother movement)
const normalizePosition = createPositionNormalizer(1)

// Round to 2 decimal places (for precise positioning)
const normalizePosition = createPositionNormalizer(2)
```

**Assumed property names**: `x`, `y`, `z`

### **Rotation Normalization**

The `createRotationNormalizer` helper assumes your rotation properties are named `rx`, `ry`, and `rz`:

```typescript
import { createRotationNormalizer } from 'lab13-sdk'

// Round rotations to 2 decimal places (most common)
const normalizeRotation = createRotationNormalizer(2)

// Round to 1 decimal place (for smoother rotation)
const normalizeRotation = createRotationNormalizer(1)

// Round to integers (for simple games)
const normalizeRotation = createRotationNormalizer(0)
```

**Assumed property names**: `rx`, `ry`, `rz`

### **Velocity Normalization**

The `createVelocityNormalizer` helper assumes your velocity properties are named `vx`, `vy`, and `vz`:

```typescript
import { createVelocityNormalizer } from 'lab13-sdk'

// Round velocities to 1 decimal place (most common)
const normalizeVelocity = createVelocityNormalizer(1)

// Round to 2 decimal places (for precise physics)
const normalizeVelocity = createVelocityNormalizer(2)

// Round to integers (for simple games)
const normalizeVelocity = createVelocityNormalizer(0)
```

**Assumed property names**: `vx`, `vy`, `vz`

### **Property Name Conventions**

The SDK's built-in normalizers follow these naming conventions:

- **Position**: `x`, `y`, `z` (Cartesian coordinates)
- **Rotation**: `rx`, `ry`, `rz` (Euler angles)
- **Velocity**: `vx`, `vy`, `vz` (velocity components)

If your game uses different property names, you'll need to create custom normalizers:

```typescript
// Example: Your game uses different property names
type PlayerState = {
  positionX: number // Not 'x'
  positionY: number // Not 'y'
  rotationZ: number // Not 'rz'
  speedX: number // Not 'vx'
  speedY: number // Not 'vy'
}

// You'll need custom normalizers for these property names
```

### **Combining Normalizers**

```typescript
import { createPositionNormalizer, createRotationNormalizer, createVelocityNormalizer } from 'lab13-sdk'

const normalizePosition = createPositionNormalizer(0)
const normalizeRotation = createRotationNormalizer(2)
const normalizeVelocity = createVelocityNormalizer(1)

const { updateMyState } = useState({
  onBeforeSendDelta: (delta) => {
    // Apply all normalizers
    return normalizePosition(normalizeRotation(normalizeVelocity(delta)))
  },
})
```

## Real-World Examples

### **Example 1: Simple Movement Game**

```typescript
import { useState, createPositionNormalizer } from 'lab13-sdk'

// Round positions to integers (good for pixel-perfect games)
const normalizePosition = createPositionNormalizer(0)

const { updateMyState } = useState({
  onBeforeSendDelta: (delta) => normalizePosition(delta),
})

// Game loop
function updatePlayer() {
  const myState = getPlayerStates()[getMyId()]
  if (!myState) return

  let newX = myState.x || 0
  let newY = myState.y || 0

  // Handle input
  if (keys['ArrowLeft']) newX -= 5
  if (keys['ArrowRight']) newX += 5
  if (keys['ArrowUp']) newY -= 5
  if (keys['ArrowDown']) newY += 5

  // Update state (automatically normalized)
  updateMyState({ x: newX, y: newY })
}
```

**Result**: Positions like `123.456789` become `123`, reducing payload size by ~70%.

### **Example 2: Smooth Movement Game**

```typescript
import { useState, createPositionNormalizer } from 'lab13-sdk'

// Round to 1 decimal place for smoother movement
const normalizePosition = createPositionNormalizer(1)

const { updateMyState } = useState({
  onBeforeSendDelta: (delta) => normalizePosition(delta),
})

// Game loop with smooth movement
function updatePlayer() {
  const myState = getPlayerStates()[getMyId()]
  if (!myState) return

  let newX = myState.x || 0
  let newY = myState.y || 0

  // Smooth movement with velocity
  if (keys['ArrowLeft']) newX -= 2.5
  if (keys['ArrowRight']) newX += 2.5
  if (keys['ArrowUp']) newY -= 2.5
  if (keys['ArrowDown']) newY += 2.5

  // Update state (normalized to 1 decimal place)
  updateMyState({ x: newX, y: newY })
}
```

**Result**: Positions like `123.456789` become `123.5`, still reducing payload size by ~50%.

### **Example 3: 3D Game with Rotation**

```typescript
import { useState, createPositionNormalizer, createRotationNormalizer } from 'lab13-sdk'

// Round positions to integers, rotations to 2 decimal places
const normalizePosition = createPositionNormalizer(0)
const normalizeRotation = createRotationNormalizer(2)

const { updateMyState } = useState({
  onBeforeSendDelta: (delta) => {
    return normalizePosition(normalizeRotation(delta))
  },
})

// 3D game loop
function updatePlayer() {
  const myState = getPlayerStates()[getMyId()]
  if (!myState) return

  let newX = myState.x || 0
  let newY = myState.y || 0
  let newZ = myState.z || 0
  let newRotation = myState.rotation || 0

  // Handle input
  if (keys['ArrowLeft']) newRotation -= 0.1
  if (keys['ArrowRight']) newRotation += 0.1

  // Move in rotation direction
  newX += Math.cos(newRotation) * 2
  newZ += Math.sin(newRotation) * 2

  // Update state (normalized)
  updateMyState({
    x: newX,
    y: newY,
    z: newZ,
    rotation: newRotation,
  })
}
```

**Result**:

- Positions: `123.456789` → `123` (70% reduction)
- Rotations: `1.2345678901234567` → `1.23` (80% reduction)

## Performance Impact

### **Network Traffic Reduction**

| Precision  | Example Value        | Normalized | Size Reduction |
| ---------- | -------------------- | ---------- | -------------- |
| Full float | `123.45678901234567` | `123`      | ~85%           |
| 1 decimal  | `123.45678901234567` | `123.5`    | ~70%           |
| 2 decimal  | `123.45678901234567` | `123.46`   | ~60%           |

### **Update Frequency Reduction**

Without normalization:

```typescript
// Every tiny change triggers an update
updateMyState({ x: 100.00000000000001 }) // Update sent
updateMyState({ x: 100.00000000000002 }) // Update sent
updateMyState({ x: 100.00000000000003 }) // Update sent
// ... hundreds of updates per second
```

With normalization:

```typescript
// Only meaningful changes trigger updates
updateMyState({ x: 100.00000000000001 }) // Sends: { x: 100 }
updateMyState({ x: 100.00000000000002 }) // Nothing sent
updateMyState({ x: 100.00000000000003 }) // Nothing sent
// ... only when position actually changes
```

## Best Practices

### **1. Choose Appropriate Precision**

```typescript
// ✅ Good: Match precision to game needs
const normalizePosition = createPositionNormalizer(0) // Pixel-perfect games
const normalizePosition = createPositionNormalizer(1) // Smooth movement games
const normalizePosition = createPositionNormalizer(2) // Precise positioning games
```

### **2. Use Different Precision for Different Properties**

```typescript
// ✅ Good: Different precision for different needs
const normalizePosition = createPositionNormalizer(0) // Integer positions
const normalizeRotation = createRotationNormalizer(2) // 2-decimal rotations
const normalizeVelocity = createPositionNormalizer(1) // 1-decimal velocities
```

### **3. Test Network Impact**

```typescript
// Add logging to see normalization in action
const { updateMyState } = useState({
  onBeforeSendDelta: (delta) => {
    const normalized = normalizePosition(delta)
    console.log('Original:', delta, 'Normalized:', normalized)
    return normalized
  },
})
```

### **4. Monitor Update Frequency**

```typescript
let updateCount = 0
const { updateMyState } = useState({
  onBeforeSendDelta: (delta) => {
    updateCount++
    console.log(`Update #${updateCount}:`, delta)
    return normalizePosition(delta)
  },
})

// Log update frequency
setInterval(() => {
  console.log(`Updates per second: ${updateCount}`)
  updateCount = 0
}, 1000)
```

## Common Mistakes

### **1. Over-Normalization**

```typescript
// ❌ Bad: Too much precision loss
const normalizePosition = createPositionNormalizer(0) // For smooth movement game
// Result: Jerky movement, poor user experience
```

### **2. Under-Normalization**

```typescript
// ❌ Bad: Not enough precision loss
const normalizePosition = createPositionNormalizer(10) // For pixel-perfect game
// Result: Still sending unnecessary precision, wasting bandwidth
```

### **3. Inconsistent Normalization**

```typescript
// ❌ Bad: Different precision for same type of data
const normalizePosition = createPositionNormalizer(0)
const normalizeVelocity = createPositionNormalizer(2) // Should be consistent
```

### **4. Forgetting to Normalize**

```typescript
// ❌ Bad: No normalization at all
const { updateMyState } = useState() // Missing onBeforeSendDelta
// Result: Sending full floating-point precision, wasting bandwidth
```

## Advanced Techniques

### **Custom Normalizers**

The built-in normalizers assume specific property names (`x`, `y`, `z` for position and `rx`, `ry`, `rz` for rotation). If your game uses different property names, you can create custom normalizers:

```typescript
// Custom normalizer for different property names
function createCustomPositionNormalizer(precision = 0) {
  return (delta: any) => {
    // Normalize positionX, positionY, positionZ
    if (delta.positionX !== undefined) {
      delta.positionX = Math.round(delta.positionX * Math.pow(10, precision)) / Math.pow(10, precision)
    }
    if (delta.positionY !== undefined) {
      delta.positionY = Math.round(delta.positionY * Math.pow(10, precision)) / Math.pow(10, precision)
    }
    if (delta.positionZ !== undefined) {
      delta.positionZ = Math.round(delta.positionZ * Math.pow(10, precision)) / Math.pow(10, precision)
    }
    return delta
  }
}

// Custom normalizer for grid-based movement
function createGridNormalizer(gridSize: number) {
  return (delta: any) => {
    if (delta.x !== undefined) delta.x = Math.round(delta.x / gridSize) * gridSize
    if (delta.y !== undefined) delta.y = Math.round(delta.y / gridSize) * gridSize
    return delta
  }
}

// Custom normalizer for velocity properties
function createVelocityNormalizer(precision = 1) {
  return (delta: any) => {
    if (delta.vx !== undefined) {
      delta.vx = Math.round(delta.vx * Math.pow(10, precision)) / Math.pow(10, precision)
    }
    if (delta.vy !== undefined) {
      delta.vy = Math.round(delta.vy * Math.pow(10, precision)) / Math.pow(10, precision)
    }
    if (delta.vz !== undefined) {
      delta.vz = Math.round(delta.vz * Math.pow(10, precision)) / Math.pow(10, precision)
    }
    return delta
  }
}

// Usage examples
const normalizeGrid = createGridNormalizer(32) // 32-pixel grid
const normalizeVelocity = createVelocityNormalizer(1) // 1 decimal place
const normalizeCustomPosition = createCustomPositionNormalizer(0) // integers

const { updateMyState } = useState({
  onBeforeSendDelta: (delta) => {
    // Apply multiple custom normalizers
    return normalizeGrid(normalizeVelocity(delta))
  },
})
```

### **Conditional Normalization**

Normalize differently based on game state:

```typescript
const { updateMyState } = useState({
  onBeforeSendDelta: (delta) => {
    // Use different precision based on game mode
    if (gameMode === 'precise') {
      return createPositionNormalizer(2)(delta)
    } else {
      return createPositionNormalizer(0)(delta)
    }
  },
})
```

## Summary

Position and rotation normalization is essential for efficient multiplayer games:

1. **Reduces network traffic** by 50-85%
2. **Prevents meaningless updates** from floating-point noise
3. **Improves compression** of network payloads
4. **Enhances performance** by reducing update frequency

The Lab13 SDK's delta system automatically detects changes, but normalization ensures only **meaningful changes** are sent across the network. This is crucial for staying under the 13KB limit while providing smooth multiplayer experiences.

**Key Takeaway**: Always use normalization with the SDK's `onBeforeSendDelta` option to maximize network efficiency and minimize game size.
