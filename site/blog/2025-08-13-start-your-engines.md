---
slug: sdk-0-0-1-released
title: SDK v0.0.1 Released
authors: [benallfree]
tags: [js13k]
---

# 🚀 js13k SDK v0.0.1 - Start Your Engines!

We're thrilled to announce the first release of the **js13k SDK** - a complete multiplayer infrastructure designed specifically for the JS13K game jam! This release brings everything you need to build tiny multiplayer games that fit within the 13KB limit.

## What is js13k?

js13k is a multiplayer infrastructure that lets you focus on what matters most: your game. No server code, no deployment headaches, no infrastructure complexity. Just pure game development with real-time multiplayer capabilities.

## What's New in v0.0.1

### 🎮 Complete Multiplayer Infrastructure

- **State Relay Server**: Hosted at `online.js13kgames.com` - handles all WebSocket complexity
- **Client SDK**: Simple JavaScript library that abstracts away connection management
- **Zero Server Logic**: Your game runs entirely on the client - the server just forwards state changes
- **Free Hosting**: The entire infrastructure is provided free for JS13K participants

### 📦 Client SDK Features

- **Automatic State Management**: Built-in state merging and synchronization
- **Player Lifecycle Handling**: Automatic connect/disconnect management
- **TypeScript Support**: Full type definitions included
- **Tiny Footprint**: The SDK doesn't count against your 13KB limit!
- **Simple API**: Just a few lines of code to get multiplayer working

### 🎯 Key Benefits for JS13K

- **No Server Code**: Focus on your game, not infrastructure
- **Real-time Multiplayer**: Instant state synchronization between players
- **13KB Compliant**: Everything fits within the game jam limits
- **Zero Configuration**: Works out of the box with no setup required

## Quick Start

Getting started with js13k is incredibly simple:

```javascript
import Js13kClient from 'https://esm.sh/js13k'

const client = new Js13kClient('my-awesome-game')

client.on('state', (state) => {
  // Update your game with new state
  renderGame(state)
})

client.updateMyState({ x: 100, y: 200 })
```

That's it! Your game now has real-time multiplayer capabilities.

## Live Demos

See js13k in action with these working examples:

- 🎨 **[Mewsterpiece](/lobby/mewsterpiece)** - Collaborative cat coloring book
- 🏎️ **[Cars Demo](/lobby/cars)** - Multiplayer racing with physics
- 🐱 **[Black Cats Demo](/lobby/cats)** - Chase mice with black cats
- ✈️ **[Flight Simulator](/lobby/flight)** - 3D multiplayer flight simulation

Each demo showcases different multiplayer patterns and demonstrates how easy it is to build engaging multiplayer experiences.

## Documentation

Everything you need to build your first multiplayer game:

- 📖 **[Complete Documentation](/docs)** - Everything you need to know
- 🛠️ **[Getting Started Guide](/docs/getting-started)** - Your first multiplayer game
- 🎮 **[Game State Management](/docs/tutorials/game-state)** - Advanced patterns
- 🤖 **[Bot Support](/docs/bot-support)** - Add AI players to your games
- 📊 **[Performance Monitoring](/docs/tutorials/performance-monitoring)** - Optimize your games

## Community & Support

Join the growing js13k community:

- **Game Lobby**: [Browse and play games](/lobby) built with js13k
- **Documentation**: Comprehensive guides and tutorials
- **Examples**: Working demos to learn from
- **Free Infrastructure**: No cost, no limits

## What's Next

This is just the beginning! Future releases will include:

- Enhanced error handling and reconnection
- Performance optimizations and monitoring
- Additional game templates and examples
- Community showcase and game submissions
- Advanced multiplayer patterns and tutorials

## Get Building!

Ready to create your first JS13K multiplayer game? The infrastructure is ready - now it's your turn to make something amazing!

- 🚀 **[Start Building](/docs/getting-started)** - Your first multiplayer game
- 📖 **[Read the Docs](/docs)** - Complete API reference
- 🎮 **[Try the Demos](/lobby)** - See what's possible

The JS13K game jam just got a whole lot more exciting with real-time multiplayer capabilities. Happy coding! 🎮

---

_js13k is built on [partyserver](https://www.npmjs.com/package/partyserver) and designed specifically for the JS13K game jam. Build tiny games, make big connections!_
