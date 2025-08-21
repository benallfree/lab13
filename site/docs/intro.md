---
title: Overview
sidebar_position: 1
---

# 2025 Challenge: JS13K Online

We're thrilled to announce that our newest partner, Cloudflare, is sponsoring the **JS13K Online** category for this year's JS13K competition!

The JS13K Online category challenges developers to create MMO (Massively Multiplayer Online) versions of their games. This experimental category is powered by a JS13K-hosted version of [PartyServer](https://www.npmjs.com/package/partyserver), Cloudflare's PartyKit-inspired scalable server based on [Cloudflare Workers](https://developers.cloudflare.com/workers/).

## What is JS13K Online?

JS13K Online is a special category in the JS13K competition that focuses on multiplayer games. While the base [JS13K Online protocol](https://js13kgames.com/online) provides the core communication primitives, **Lab13's SDK extends this protocol** with additional conveniences and features to make multiplayer game development easier.

### Why a Centralized Server?

In previous JS13K contests, the server category posed challenges, as game servers often went offline, rendering games unplayable. This year, they're taking a different approach with the Online category. Thanks to Cloudflare's platform, JS13K will host a centralized game server that all submissions must utilize, ensuring the server remains online and accessible.

## Lab13 SDK: Extending the Protocol

The Lab13 SDK builds upon the base JS13K Online protocol and adds:

- **Player ID Management**: Automatic tracking and querying of connected players
- **Enhanced Events**: Rich event system for player connections, disconnections, and state updates
- **Bot Support**: Built-in support for monitoring and analytics bots
- **Protocol Extensions**: Additional message types for common multiplayer scenarios
- **Type Safety**: Full TypeScript support with proper event typing

## What You'll Learn

This documentation will guide you through:

- **Getting Started**: Setting up your first multiplayer game with the Lab13 SDK
- **JS13K Online Protocol**: Understanding the base protocol and how Lab13 extends it
- **Player Management**: Handling player connections, disconnections, and ID tracking
- **Bot Support**: Creating monitoring bots and analytics
- **Game State Management**: Designing and managing shared game state across multiple players
- **Advanced Features**: Delta evaluation, throttling, and performance optimization
- **Going Further**: Running your own server and customizing the experience

## Architecture Overview

The Lab13 system uses a **trusted shared state relay** architecture:

- **Client-side game logic**: All game rules and validation happen on the client
- **Server as relay**: The server simply broadcasts state changes between clients
- **Delta-based updates**: Only changes are sent, not full state snapshots
- **Automatic throttling**: Built-in performance optimization to prevent network spam
- **Bot support**: Monitoring bots are treated separately from human players

This approach allows you to focus on game development without server programming, while still enabling rich multiplayer experiences.

## Protocol Extensions

Lab13 extends the base JS13K Online protocol with:

1. **Player ID Queries** (`?i` messages) - Automatically track connected players
2. **Bot Support** (`b` messages) - Separate bot tracking for monitoring
3. **Enhanced Events** - Rich event system for player and bot management
4. **Type Safety** - Full TypeScript support with proper event typing
5. **Convenience Methods** - Higher-level APIs for common multiplayer patterns

## Key Features

- 🚀 **Zero server code required** - Focus purely on your game logic
- 📦 **Tiny footprint** - The SDK doesn't count against your 13KB limit
- 🔄 **Real-time synchronization** - Instant state updates across all players
- 🤖 **Bot support** - Built-in monitoring and analytics support
- 🎯 **TypeScript support** - Full type safety for your game state
- ⚡ **Performance optimized** - Built-in throttling and delta compression
- 🛡️ **Connection management** - Automatic reconnection and cleanup
- 🎮 **JS13K Online compliant** - Built on the official competition protocol

## Competition Rules

For the JS13K Online category:

- Your game must use the official JS13K Online server
- All game logic must run on the client side
- The server acts as a relay only - no server-side game logic allowed
- Bots are allowed for monitoring and analytics only

Ready to build your first MMO game? Let's [get started](./getting-started.mdx)!
