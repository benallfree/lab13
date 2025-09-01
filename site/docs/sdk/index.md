---
sidebar_position: 2
---

# Lab13 SDK

The Lab13 SDK is a **ultra-compact, tree-shakable** client library designed specifically for the [JS13K Online](https://js13kgames.com/online) challenge. It provides essential multiplayer functionality while maintaining the strict 13KB size constraint.

## Design Philosophy

### 🎯 **Size-First Design**

- **Ultra-compact**: Every byte counts in JS13K
- **Tree-shakable**: Only import what you use
- **Function composition**: No classes, pure functions for maximum compression
- **Zero dependencies**: Built-in functionality without external bloat

### 🔧 **Automatic Setup**

The SDK automatically handles the most common setup tasks:

```typescript
import { useOnline, useMyId } from 'lab13-sdk'

// Automatically loads PartySocket from JS13K CDN
// Automatically sets up global socket instance
useOnline('mewsterpiece/cats')

// Get your player ID
const { getMyId } = useMyId()
```

### 🌐 **JS13K Online Integration**

Built specifically for the JS13K Online protocol:

- **Automatic PartySocket loading** from `https://js13kgames.com/2025/online/partysocket.js`
- **Global socket management** via `window.socket`
- **Protocol-compliant** messaging and state synchronization

## Key Features

### 🚀 **Zero-Config Connection**

```typescript
import { useOnline } from 'lab13-sdk'

// Automatically:
// 1. Loads PartySocket from JS13K CDN
// 2. Creates WebSocket connection
// 3. Sets up global socket instance
useOnline('mewsterpiece/cats')
```

### 🎮 **State Management**

```typescript
import { useState } from 'lab13-sdk'

const { getState, updateMyState, getPlayerStates } = useState({
  onBeforeSendDelta: (delta) => {
    // Normalize data before sending
    return normalizePosition(delta)
  },
})
```

### 👥 **Player Tracking**

```typescript
import { useMyId, onClientJoined, onClientLeft } from 'lab13-sdk'

const { getMyId } = useMyId()

onClientJoined((clientId) => {
  console.log('Player joined:', clientId)
})

onClientLeft((clientId) => {
  console.log('Player left:', clientId)
})
```

### 📊 **Data Normalization**

Built-in utilities for efficient network transmission:

```typescript
import { createPositionNormalizer, createRotationNormalizer } from 'lab13-sdk'

const normalizePosition = createPositionNormalizer(0) // Round to integers
const normalizeRotation = createRotationNormalizer(2) // Round to 2 decimal places
```

## Automatic PartySocket Loading

The SDK automatically handles PartySocket setup:

1. **Imports PartySocket** from the official JS13K CDN
2. **Mounts to window** as `window.PartySocket`
3. **Creates global socket** as `window.socket`
4. **Provides TypeScript types** for full IDE support

```typescript
// This import automatically loads PartySocket
import { useOnline } from 'lab13-sdk'

// PartySocket is now available globally
declare global {
  interface Window {
    PartySocket: typeof PartySocket
    socket: PartySocket
  }
}
```

## Size Optimization

### **Tree Shaking**

Import only what you need:

```typescript
// Only these functions will be included in your bundle
import { useOnline, useMyId, useState } from 'lab13-sdk'
```

### **Function Composition**

No classes or inheritance - just pure functions:

```typescript
// ✅ Good: Function composition
const { getMyId } = useMyId()
const { getState } = useState()

// ❌ Avoid: Classes (not used in SDK)
```

### **Minimal Dependencies**

- **Zero runtime dependencies** in production
- **PartySocket loaded from CDN** (not bundled)
- **TypeScript types only** for development

## Protocol Compliance

The SDK implements the official JS13K Online protocol:

- **WebSocket messaging** via PartySocket
- **State synchronization** with delta updates
- **Player presence** tracking
- **Room-based** multiplayer
- **Automatic reconnection** handling

## Getting Started

See the [Getting Started](/docs/sdk/getting-started) guide for a complete tutorial, or explore the [API Reference](/docs/api/) for detailed function documentation.
