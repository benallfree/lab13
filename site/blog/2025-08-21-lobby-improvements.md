---
slug: lobby-improvements
title: Lab13 Lobby - Real-time Game Discovery
authors: [benallfree]
tags: [js13k, lab13]
---

# 🎮 Lab13 Lobby - Real-time Game Discovery

Lab13 now features a lobby showing the player count and online status of all JS13K Online games! The new lobby provides real-time visibility into game activity, making it easy to find active games and join the fun.

## What's New

### 🟢 Now Playing Section

Games with active players are prominently displayed in a dedicated "Now Playing" section. Each game card shows the current player count, making it easy to jump into games that are already in progress.

### 🔵 Needs Players Section

Games waiting for players are organized in a separate "Needs Players" section. This helps new players find games they can start fresh, and existing players can easily see which games need more participants.

### 📊 Real-time Monitoring

The lobby connects to each game room and monitors player in/out activity in real-time. Player counts update automatically as people join and leave games, giving you the most current information about game activity.

## Technical Implementation

This is accomplished by connecting to your game room and monitoring player in/out activity. The lobby establishes WebSocket connections to each game's relay server and listens for player lifecycle events.

### Enhanced Reporting with Lab13 SDK

If your game uses the Lab13 SDK, reporting will be better because:

- **Roll Call Support**: The client knows how to respond to roll calls
- **Agent Filtering**: Connections that are monitoring agents are properly filtered out
- **Accurate Counts**: More precise player tracking and reporting

## Getting Your Game Listed

You just need to add your game via a PR and we will then list it in the lobby and track online status. The process is simple:

1. Submit a pull request with your game metadata
2. We'll add it to the lobby automatically
3. Your game will start appearing in the appropriate section based on player activity

## Try It Out

Head over to the [Lab13 Lobby](https://lab13.benallfree.com/lobby) to see the improvements in action! You'll notice the difference immediately - games are now organized by activity level, making it much easier to find your next multiplayer adventure.

## What's Next

Presence is up and running again with the new JS13K Online relay! The infrastructure is more robust and ready to handle the growing community of multiplayer games.

Whether you're looking to jump into an active game or start something new with friends, the improved lobby makes game discovery a breeze.

---

_Ready to build your own multiplayer game? Check out our [getting started guide](/docs/getting-started) and join the JS13K community! 🚀_
