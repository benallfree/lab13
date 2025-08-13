---
title: Understanding Game State
sidepar_position: 3
---

# Designing your shared game state

One of the central design decisions of the JS13K MMO server is a **trusted shared state relay** architecture.

In simple terms, this means each player is responsible for maintaining their own copy of the game state and the server simply relays changes to each player.

This philosophy shifts the game logic to the client (frontend) and away from the server, which is a departure from traditional game server design.

We opted for this approach so JS13K devs don't need to do any server programming or hosting to participate. The caveat is that the JS13K MMO server trusts that each state change communicated to it is valid or can be validated by the clients.

## Game state is a pure JS object

In practical terms, your game state is a simple JavaScript object:

```js
const gameState = {}
```

## Storing player data

You are free to design the shape of the game state any way you see fit. Typically, you will want to store player data:

```js
const gameState = {
  players: {
    'player-1-id': {...},
    'player-2-id': {...},
  },
}
```

> `gameState.players` is a special collection recognized by the JS13K MMO server. The server doesn't care what is stored in player states, but it will manage connects and disconnects and relay state changes to all connected players based on changes to connection status. More on that later.

Often, storing the state of other players is enough to make an entire game. However, you are free to store other information in your shared game state:

```js
const gameState = {
  players: {},
  world: {
    cells: {
      1: { 1: { terrain: 'dirt' } },
      1: { 2: { terrain: 'water' } },
      //...,
      2: { 4: { items: ['coin'] } },
    },
  },
}
```
