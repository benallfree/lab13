---
sidebar_position: 3
---

# W Library Utilities

The Lab13 SDK provides several utilities specifically designed to work with the [W WebGL framework](https://xem.github.io/W/). These utilities handle common tasks like canvas resizing, input handling, and animation timing.

> **Note**: This tutorial covers the W utilities in the Lab13 SDK. For a complete W library tutorial, see the [official W documentation](https://xem.github.io/W/).

## Overview

The Lab13 SDK includes these W-specific utilities:

- **`useResizer`** - Automatic canvas resizing and WebGL viewport updates
- **`useSpeedThrottledRaf`** - Speed-throttled animation frames for consistent movement
- **`usePointerLock`** - Mouse pointer lock for first-person camera control
- **`useKeyboard`** - Keyboard input handling

## useResizer

Automatically handles canvas resizing and WebGL viewport updates when the window is resized.

```typescript
import { useResizer } from 'lab13-sdk'

// Initialize W
W.reset(c)
W.light({ y: -1 })
W.ambient(0.2)

// Automatically resizes canvas to fill window
// Updates WebGL viewport and projection matrix
useResizer()
```

### What it does:

- Resizes the canvas to `window.innerWidth` × `window.innerHeight`
- Updates the WebGL viewport with the new dimensions
- Recalculates the projection matrix with the new aspect ratio
- Listens for window resize events

### Example with custom FOV:

```typescript
import { useResizer } from 'lab13-sdk'

W.reset(c)
W.camera({ fov: 45 }) // Custom field of view
useResizer() // Will maintain your 45° FOV when resizing
```

## useSpeedThrottledRaf

Provides speed-throttled animation frames for consistent movement regardless of frame rate.

```typescript
import { useSpeedThrottledRaf } from 'lab13-sdk'

const MOVE_SPEED = 20 // units per second

useSpeedThrottledRaf(MOVE_SPEED, (speed) => {
  // This function is called with consistent speed values
  // regardless of frame rate (60fps, 30fps, etc.)

  if (isKeyPressed('w')) {
    W.move({
      n: 'player',
      z: player.z - speed,
      a: 16,
    })
  }
})
```

### How it works:

- Calculates delta time between frames
- Multiplies your move speed by delta time
- Ensures consistent movement speed regardless of frame rate
- Uses `requestAnimationFrame` internally

### Example with multiple movements:

```typescript
import { useSpeedThrottledRaf } from 'lab13-sdk'

const MOVE_SPEED = 15
const ROTATION_SPEED = 90 // degrees per second

useSpeedThrottledRaf(MOVE_SPEED, (speed) => {
  const rotationSpeed = (ROTATION_SPEED * speed) / MOVE_SPEED

  // Handle movement
  if (isKeyPressed('w')) {
    W.move({ n: 'player', z: player.z - speed, a: 16 })
  }

  // Handle rotation
  if (isKeyPressed('q')) {
    W.move({ n: 'player', ry: player.ry - rotationSpeed, a: 16 })
  }
  if (isKeyPressed('e')) {
    W.move({ n: 'player', ry: player.ry + rotationSpeed, a: 16 })
  }
})
```

## usePointerLock

Handles mouse pointer lock for first-person camera control.

```typescript
import { usePointerLock } from 'lab13-sdk'

let cameraY = 0
let cameraX = 0

usePointerLock({
  onMove: (e) => {
    cameraY -= e.movementX * 0.1
    cameraX -= e.movementY * 0.1
    cameraX = Math.max(-90, Math.min(90, cameraX)) // Clamp vertical rotation

    W.move({
      n: 'camera',
      rx: cameraX,
      ry: cameraY,
      a: 16,
    })
  },
  element: c, // canvas element
})
```

### Options:

```typescript
interface PointerLockOptions {
  onMove: (e: MouseEvent) => void
  element: HTMLElement // defaults to document.body
}
```

### Example with sensitivity control:

```typescript
import { usePointerLock } from 'lab13-sdk'

const MOUSE_SENSITIVITY = 0.05

usePointerLock({
  onMove: (e) => {
    const deltaX = e.movementX * MOUSE_SENSITIVITY
    const deltaY = e.movementY * MOUSE_SENSITIVITY

    updateMyState({
      ry: me().ry - deltaX,
      rx: Math.max(-90, Math.min(90, me().rx - deltaY)),
    })
  },
  element: c,
})
```

## useKeyboard

Provides keyboard input handling with a simple API.

```typescript
import { useKeyboard } from 'lab13-sdk'

const { isKeyPressed, getKeys } = useKeyboard()

// Check if a key is currently pressed
if (isKeyPressed('w')) {
  // Move forward
}

// Get all pressed keys
const keys = getKeys()
console.log(
  'Pressed keys:',
  Object.keys(keys).filter((k) => keys[k])
)
```

### API:

- **`isKeyPressed(key: string)`** - Returns `true` if the key is currently pressed
- **`getKeys()`** - Returns an object with all key states

### Example with WASD movement:

```typescript
import { useKeyboard } from 'lab13-sdk'

const { isKeyPressed } = useKeyboard()

const updatePlayerMovement = (speed: number) => {
  const angle = (me().ry * Math.PI) / 180
  const forwardX = Math.sin(angle) * speed
  const forwardZ = Math.cos(angle) * speed

  if (isKeyPressed('w')) {
    updateMyState({ x: me().x - forwardX, z: me().z - forwardZ })
  }
  if (isKeyPressed('s')) {
    updateMyState({ x: me().x + forwardX, z: me().z + forwardZ })
  }
  if (isKeyPressed('a')) {
    updateMyState({ x: me().x - forwardZ, z: me().z + forwardX })
  }
  if (isKeyPressed('d')) {
    updateMyState({ x: me().x + forwardZ, z: me().z - forwardX })
  }
}
```

## Complete Example

Here's a complete example using all the W utilities with a multiplayer game:

```typescript
import { useOnline, useEasyState, useResizer, useKeyboard, usePointerLock, useSpeedThrottledRaf } from 'lab13-sdk'

// Initialize multiplayer
useOnline('mygame/room')

// Initialize W
W.reset(c)
W.light({ y: -1 })
W.ambient(0.2)
W.clearColor('#87CEEB')

// Create world
W.plane({
  n: 'ground',
  y: -1,
  w: 20,
  h: 1,
  d: 20,
  b: '#228B22',
})

// Setup utilities
useResizer()

const { isKeyPressed } = useKeyboard()

usePointerLock({
  onMove: (e) => {
    updateMyState({ ry: me().ry - e.movementX * 0.1 })
  },
  element: c,
})

// Player state management
const { updateMyState, getPlayerStates } = useEasyState({
  onPlayerStateAvailable: (id, state) => {
    // Create player when they join
    W.group({ n: id })
    W.cube({
      g: id,
      n: `${id}-body`,
      y: 0.5,
      w: 1,
      h: 1,
      d: 0.5,
      b: state.b,
    })
  },
})

// Camera follows player
W.camera({ g: 'me', x: 0, y: 1.5, z: 2.5 })

// Game loop with speed-throttled movement
useSpeedThrottledRaf(20, (speed) => {
  // Handle input
  const angle = (me().ry * Math.PI) / 180
  const forwardX = Math.sin(angle) * speed
  const forwardZ = Math.cos(angle) * speed

  if (isKeyPressed('w')) {
    updateMyState({ x: me().x - forwardX, z: me().z - forwardZ })
  }
  if (isKeyPressed('s')) {
    updateMyState({ x: me().x + forwardX, z: me().z + forwardZ })
  }
  if (isKeyPressed('a')) {
    updateMyState({ x: me().x - forwardZ, z: me().z + forwardX })
  }
  if (isKeyPressed('d')) {
    updateMyState({ x: me().x + forwardZ, z: me().z - forwardX })
  }

  // Update all players
  const players = getPlayerStates()
  for (const [id, state] of Object.entries(players)) {
    W.move({
      n: id,
      x: state.x,
      z: state.z,
      ry: state.ry,
      a: 16,
    })
  }
})
```

## Integration Tips

### Performance Optimization

- Use `useSpeedThrottledRaf` instead of raw `requestAnimationFrame` for consistent movement
- Keep animation durations short (16ms) for real-time movement
- Use groups to move complex objects efficiently

### Multiplayer Best Practices

- Update player positions in the speed-throttled loop
- Use `onPlayerStateAvailable` to create player objects when they join
- Keep state updates minimal to reduce network traffic

### Input Handling

- Use `usePointerLock` for first-person games
- Use `useKeyboard` for consistent key detection
- Combine input handling with speed-throttled updates

## Learn More

- **[Official W Documentation](https://xem.github.io/W/)** - Complete W library tutorial and API reference
- **[W Examples](https://xem.github.io/W/)** - Interactive examples and demos
- **[Lab13 SDK Documentation](/docs/sdk/)** - Other SDK utilities and features
