---
title: Overview
sidebar_position: 1
---

# 2025 Side Quest: MMO

We're thrilled to announce that our newest partner, Cloudflare, is sponsoring an experimental MMO side quest for this year's JS13K competition!

If this experiment succeeds, it could pave the way for a sustainable server-based category in the future. In previous JS13K contests, the server category posed challenges, as game servers often went offline, rendering games unplayable.

This year, we're taking a different approach with the experimental MMO category. Thanks to Cloudflare's platform, JS13K will host a centralized game server that all submissions must utilize, ensuring the server remains online and accessible.

## What You'll Learn

This documentation will guide you through:

- **Getting Started**: Setting up your first multiplayer game with the JS13K MMO SDK
- **Initial Connection**: Understanding how clients connect and receive their unique ID
- **Game State Management**: Designing and managing shared game state across multiple players
- **Advanced Features**: Delta evaluation, throttling, and performance optimization
- **Going Further**: Running your own server and customizing the experience

## Architecture Overview

The JS13K MMO system uses a **trusted shared state relay** architecture:

- **Client-side game logic**: All game rules and validation happen on the client
- **Server as relay**: The server simply broadcasts state changes between clients
- **Delta-based updates**: Only changes are sent, not full state snapshots
- **Automatic throttling**: Built-in performance optimization to prevent network spam

This approach allows you to focus on game development without server programming, while still enabling rich multiplayer experiences.

## Key Features

- 🚀 **Zero server code required** - Focus purely on your game logic
- 📦 **Tiny footprint** - The SDK doesn't count against your 13KB limit
- 🔄 **Real-time synchronization** - Instant state updates across all players
- 🎯 **TypeScript support** - Full type safety for your game state
- ⚡ **Performance optimized** - Built-in throttling and delta compression
- 🛡️ **Connection management** - Automatic reconnection and cleanup

Ready to build your first MMO game? Let's [get started](./getting-started.mdx)!
