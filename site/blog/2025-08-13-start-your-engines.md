---
slug: sdk-0-0-1-released
title: SDK v0.0.1 Released
authors: [benallfree]
tags: [js13k]
---

# 🚀 js13k-online v0.0.1 is Here!

We're excited to announce the first release of **js13k-online**, a complete multiplayer infrastructure for the JS13K game jam! This release brings everything you need to build tiny multiplayer games that fit within the 13KB limit.

## What's New in v0.0.1

### 🎮 Complete Multiplayer Infrastructure

- **State Relay Server**: Hosted at `online.js13kgames.com` - handles all the WebSocket complexity
- **Client SDK**: Simple JavaScript library that abstracts away connection management
- **Zero Server Logic**: Your game runs entirely on the client - the server just forwards state changes

### 📦 Client SDK Features

- **Automatic State Management**: Built-in state merging and synchronization
- **Player Lifecycle Handling**: Automatic connect/disconnect management
- **TypeScript Support**: Full type definitions included
- **Tiny Footprint**: The SDK doesn't count against your 13KB limit!

### 🎯 Key Benefits for JS13K

- **No Server Code**: Focus on your game, not infrastructure
- **Real-time Multiplayer**: Instant state synchronization between players
- **Simple API**: Just a few lines of code to get multiplayer working
- **Free Hosting**: The server is provided free for JS13K participants

## Quick Start

```javascript
import Js13kClient from 'https://esm.sh/js13k-online'

const client = new Js13kClient('my-awesome-game')

client.on('state', (state) => {
  // Update your game with new state
  renderGame(state)
})

client.updateMyState({ x: 100, y: 200 })
```

## Live Demos

Check out these working examples:

- 🎨 **[Paint Demo](/lobby/paint)** - Collaborative pixel art
- 🏎️ **[Cars Demo](/lobby/cars)** - Multiplayer racing
- 🐱 **[Black Cats Demo](/lobby/cats)** - Chase mice with black cats
- ✈️ **[Flight Simulator](/lobby/flight)** - 3D multiplayer flight

## Documentation

- 📖 **[Complete Documentation](/docs/intro)** - Everything you need to know
- 🛠️ **[Getting Started Guide](/docs/getting-started)** - Your first multiplayer game
- 🎮 **[Game State Management](/docs/tutorials/game-state)** - Advanced patterns

## What's Next

This is just the beginning! Future releases will include:

- Enhanced error handling and reconnection
- Performance optimizations
- Additional game templates
- Community showcase

## Get Building!

Ready to create your first JS13K multiplayer game? Head over to the [documentation](https://online.js13kgames.com) and start building! The infrastructure is ready - now it's your turn to make something amazing.

---

_js13k-online is built on [partysocket](https://github.com/partykit/partysocket) and designed specifically for the JS13K game jam. Happy coding! 🎮_
