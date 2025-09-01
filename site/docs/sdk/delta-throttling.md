---
title: Delta Throttling
sidebar_position: 6
---

# Delta Throttling

Delta throttling is a key optimization feature in the Lab13 SDK that batches rapid state changes to reduce network traffic. This tutorial explains how it works, why it's important, and how to design your state for optimal performance.

## How Delta Throttling Works

### **The Problem: Rapid State Changes**

In multiplayer games, state can change rapidly:

```typescript
// ❌ Problem: Rapid changes create network spam
function gameLoop() {
  updateMyState({ x: 100.1 }) // Network update
  updateMyState({ x: 100.2 }) // Network update
  updateMyState({ x: 100.3 }) // Network update
  updateMyState({ x: 100.4 }) // Network update
  // ... 60+ updates per second!
}
```

This creates several issues:

- **Network spam**: Hundreds of tiny updates per second
- **Bandwidth waste**: Sending redundant data
- **Server overload**: Excessive relay traffic
- **Poor performance**: Network congestion

### **The Solution: Delta Throttling**

The SDK automatically throttles updates by batching changes, but only when there's already a pending delta:

```typescript
// ✅ Solution: First change sent immediately, subsequent changes batched
function gameLoop() {
  updateMyState({ x: 100.1 }) // Sent immediately (no pending delta)
  updateMyState({ x: 100.2 }) // Queued (overwrites previous)
  updateMyState({ x: 100.3 }) // Queued (overwrites previous)
  updateMyState({ x: 100.4 }) // Queued (overwrites previous)
  // ... only the final value (100.4) is sent after 50ms
}
```

## Default Behavior

### **50ms Throttling (Default)**

By default, the SDK throttles updates to every 50ms:

```typescript
import { useState } from 'lab13-sdk'

// Default: 50ms throttling
const { updateMyState } = useState()
// Equivalent to: useState({ deltaThrottleMs: 50 })
```

### **Custom Throttling**

You can customize the throttling interval:

```typescript
// Fast updates (20ms = 50 updates per second)
const { updateMyState } = useState({ deltaThrottleMs: 20 })

// Slow updates (100ms = 10 updates per second)
const { updateMyState } = useState({ deltaThrottleMs: 100 })

// No throttling (not recommended)
const { updateMyState } = useState({ deltaThrottleMs: 0 })
```

## How Batching Works

### **Change Queuing**

When you call `updateMyState()`, the SDK checks if there's already a pending delta:

**If no pending delta exists:**

- The delta is sent immediately
- A 50ms timer starts

**If a pending delta exists:**

- The new delta is merged with the pending delta
- The timer continues (doesn't reset)

```typescript
// Timeline: 0ms
updateMyState({ x: 100, y: 200 }) // Sent immediately, timer starts

// Timeline: 10ms (timer still active)
updateMyState({ x: 101, y: 200 }) // Queued, x overwrites previous x

// Timeline: 20ms (timer still active)
updateMyState({ x: 102, y: 201 }) // Queued, both x and y overwrite

// Timeline: 50ms (timer expires)
// Final delta sent: { x: 102, y: 201 }
```

### **Deep Merging**

The SDK performs deep merging of queued changes:

```typescript
// Initial state: { position: { x: 100, y: 200 }, score: 0 }

updateMyState({ position: { x: 101 } }) // Queued
updateMyState({ position: { y: 201 } }) // Queued
updateMyState({ score: 10 }) // Queued

// After 50ms, final delta sent:
// { position: { x: 101, y: 201 }, score: 10 }
```

## Real-World Examples

### **Example 1: Position Updates**

```typescript
// ✅ Good: Send absolute positions
function updatePosition(x: number, y: number) {
  updateMyState({ x, y }) // Absolute position
}

// Game loop - rapid updates
updatePosition(100, 200) // Queued
updatePosition(101, 200) // Queued
updatePosition(102, 201) // Queued
// Final: { x: 102, y: 201 } sent after 50ms
```

### **Example 2: Score Tracking**

```typescript
// ✅ Good: Track total score
let totalScore = 0

function addScore(points: number) {
  totalScore += points
  updateMyState({ score: totalScore }) // Send total, not increment
}

// Multiple rapid additions
addScore(10) // Queued: { score: 10 }
addScore(10) // Queued: { score: 20 }
addScore(10) // Queued: { score: 30 }
// Final: { score: 30 } sent - correct!
```

### **Example 3: Health System**

```typescript
// ✅ Good: Send current health
let currentHealth = 100

function takeDamage(damage: number) {
  currentHealth = Math.max(0, currentHealth - damage)
  updateMyState({ health: currentHealth }) // Send current health
}

function heal(amount: number) {
  currentHealth = Math.min(100, currentHealth + amount)
  updateMyState({ health: currentHealth }) // Send current health
}

// Rapid damage/healing
takeDamage(10) // Queued: { health: 90 }
takeDamage(10) // Queued: { health: 80 }
heal(5) // Queued: { health: 85 }
// Final: { health: 85 } sent - correct!
```

## Performance Impact

### **Network Traffic Reduction**

| Throttling     | Updates/Second | Network Reduction |
| -------------- | -------------- | ----------------- |
| No throttling  | 60+            | 0%                |
| 50ms (default) | 20             | ~67%              |
| 100ms          | 10             | ~83%              |
| 200ms          | 5              | ~92%              |

### **Bandwidth Savings**

```typescript
// Without throttling: 60 updates/second
// Each update: { x: 100.1, y: 200.2 } = ~20 bytes
// Total: 60 × 20 = 1,200 bytes/second

// With 50ms throttling: 20 updates/second
// Each update: { x: 100.1, y: 200.2 } = ~20 bytes
// Total: 20 × 20 = 400 bytes/second
// Savings: 67% reduction
```

### **Immediate vs. Batched Updates**

It's important to understand that **the first update is sent immediately**:

```typescript
// Timeline: 0ms
updateMyState({ x: 100 }) // Sent immediately (no pending delta)

// Timeline: 10ms (within 50ms window)
updateMyState({ x: 101 }) // Queued (pending delta exists)
updateMyState({ x: 102 }) // Queued (pending delta exists)

// Timeline: 50ms (timer expires)
// Final delta sent: { x: 102 }
```

**Key Points:**

- **First update**: Sent immediately when no pending delta exists
- **Subsequent updates**: Queued and batched until timer expires
- **Timer doesn't reset**: Each new update extends the existing timer
- **No artificial delay**: Updates aren't held back unnecessarily

## Choosing the Right Throttling

### **High-Frequency Games (Racing, Action)**

```typescript
// Fast updates for responsive gameplay
const { updateMyState } = useState({ deltaThrottleMs: 20 }) // 50 FPS
```

### **Medium-Frequency Games (RPG, Strategy)**

```typescript
// Balanced updates for most games
const { updateMyState } = useState({ deltaThrottleMs: 50 }) // 20 FPS (default)
```

### **Low-Frequency Games (Turn-based, Puzzle)**

```typescript
// Slow updates for efficiency
const { updateMyState } = useState({ deltaThrottleMs: 100 }) // 10 FPS
```

### **Chat/UI Updates**

```typescript
// Very slow updates for non-critical data
const { updateMyState } = useState({ deltaThrottleMs: 500 }) // 2 FPS
```

## Advanced Patterns

### **Multiple Throttling Levels**

Use different throttling for different types of data:

```typescript
// Fast updates for position
const { updateMyState } = useState({ deltaThrottleMs: 20 })

// Slow updates for UI state
function updateUIState(uiData: any) {
  // Use a separate state system for UI updates
  updateSharedState({ ui: uiData }) // Different throttling
}
```

### **Conditional Throttling**

Adjust throttling based on game state:

```typescript
const { updateMyState } = useState({
  deltaThrottleMs: gameMode === 'fast' ? 20 : 50,
})
```

### **Debugging Throttling**

Monitor throttling behavior:

```typescript
let updateCount = 0
const { updateMyState } = useState({
  deltaThrottleMs: 50,
  onBeforeSendDelta: (delta) => {
    updateCount++
    console.log(`Update #${updateCount}:`, delta)
    return delta
  },
})

// Log throttling stats
setInterval(() => {
  console.log(`Updates per second: ${updateCount * 20}`) // 1000ms / 50ms = 20
  updateCount = 0
}, 1000)
```

## Common Mistakes

### **1. Incremental Updates**

```typescript
// ❌ Bad: Incremental changes get lost
function incrementScore() {
  const currentScore = getPlayerStates()[getMyId()]?.score || 0
  updateMyState({ score: currentScore + 1 }) // Wrong approach
}

// ✅ Good: Track total locally
let totalScore = 0
function incrementScore() {
  totalScore++
  updateMyState({ score: totalScore }) // Correct approach
}
```

### **2. Velocity-Based Movement**

```typescript
// ❌ Bad: Velocity changes get lost
function updateVelocity(vx: number, vy: number) {
  updateMyState({ vx, vy }) // Velocity changes may be lost
}

// ✅ Good: Update position directly
function updatePosition(x: number, y: number) {
  updateMyState({ x, y }) // Position is idempotent
}
```

### **3. State Accumulation**

```typescript
// ❌ Bad: Accumulating state
function addToInventory(item: string) {
  const inventory = getPlayerStates()[getMyId()]?.inventory || []
  inventory.push(item)
  updateMyState({ inventory }) // Array changes may be lost
}

// ✅ Good: Send complete state
let localInventory: string[] = []
function addToInventory(item: string) {
  localInventory.push(item)
  updateMyState({ inventory: [...localInventory] }) // Send complete array
}
```

## Best Practices

### **1. Design for Idempotency**

Always send the final state, not incremental changes:

```typescript
// ✅ Good: Send absolute values
updateMyState({
  position: { x: 100, y: 200 },
  score: 150,
  health: 75,
})
```

### **2. Use Local State Tracking**

Track state locally and send complete values:

```typescript
// Local state tracking
let localScore = 0
let localHealth = 100

function addScore(points: number) {
  localScore += points
  updateMyState({ score: localScore })
}

function takeDamage(damage: number) {
  localHealth = Math.max(0, localHealth - damage)
  updateMyState({ health: localHealth })
}
```

### **3. Choose Appropriate Throttling**

Match throttling to your game's needs:

```typescript
// Responsive games: 20-50ms
// Standard games: 50ms (default)
// Efficient games: 100ms+
```

### **4. Test Throttling Behavior**

Verify that rapid changes produce the expected final state:

```typescript
// Test rapid updates
for (let i = 0; i < 10; i++) {
  updateMyState({ x: i })
}

// After 50ms, should only send: { x: 9 }
```

## Summary

Delta throttling is a powerful optimization that:

1. **Reduces network traffic** by 67-92%
2. **Batches rapid changes** into single updates
3. **Improves performance** by reducing server load
4. **Maintains responsiveness** with configurable intervals

**Key Design Principle**: State should represent valid game state at all times, not be used as an event system. Send current state values, not event-like data, because rapid-fire events will get lost due to throttling.

**Key Behavior**: The first update is sent immediately when no pending delta exists. Only subsequent updates within the throttling window are batched. This ensures responsive initial updates while still optimizing rapid changes.

**Key Takeaway**: The default 50ms throttling is optimal for most games, but you can adjust it based on your specific needs. Just remember that rapid changes within the throttling window will be batched into a single update.
