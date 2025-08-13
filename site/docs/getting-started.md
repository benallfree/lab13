---
sidebar_position: 2
---

# Getting Started

The experimental MMO category is powered by our hosted version of [PartyServer](https://www.npmjs.com/package/partyserver), Cloudflare's PartyKit-inspired scalable server based on [Cloudflare Workers](https://developers.cloudflare.com/workers/). But don't worry; for JS13K you only need to write your game as you normally would and you don't need to know anything about server technologies. Just think of the MMO capability as "Powered by Cloudflare".

## Importing PartySocket

To get started, create an `index.html` and import [PartySocket](https://www.npmjs.com/package/partysocket). For the MMO category, PartySocket is free and does not count against your bundle size.

```html
<!-- index.html -->
<script type="module">
  import PartySocket from 'https://esm.sh/partysocket'
  window.PartySocket = PartySocket
</script>
```

## Connecting to the JS13K MMO Server

Once PartySocket is imported, you must connect to the JS13K MMO server powered by Cloudflare.

```js
const socket = new PartySocket({
  host: window.location.host,
  party: 'js13k',
  room: 'your-unique-room-slug', // This must be unique to your game
})
```

`your-room-slug` is the way you create a private "room" for your game. All of your game communication and data will be isolated to this room, so choose a unique slug that is unlikely to collide with anyone else's.

A simple name is probably good enough, but if you want to be really sure your room name is unique, just paste this UUID generator code into your browser console:

```js
console.log(
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  )
)
```
