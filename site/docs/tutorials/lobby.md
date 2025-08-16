---
title: Integrate the JS13K Lobby in Your Game
sidebar_position: 9
---

# Integrate the JS13K Lobby

The JS13K Lobby is a central service where games register so the discovery tool can surface live player counts. Integrating it is a single line and does not change your game state or networking.

## Quick start: one‑liner

```html
<script type="module">
  import { connectToJs13kLobby } from 'https://esm.sh/js13k-online'

  // Register this player
  connectToJs13kLobby('cats')
</script>
```

## With options

It accepts the same `ClientOptions` as `Js13kClient`:

```html
<script type="module">
  import { connectToJs13kLobby } from 'https://esm.sh/js13k-online'

  connectToJs13kLobby('cats', {
    host: 'https://online.js13kgames.com',
    debug: true,
  })
</script>
```

## Discussion

When a player starts your game and connects to the JS13K Lobby, their presence is registered. This updates both the Lobby and your game's player counts, making it easier for others to discover and join active games.
