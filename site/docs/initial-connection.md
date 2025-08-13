---
sidebar_priority: 4
---

# Initial Connection

When you first connect to the JS13K MMO Server, it sends two things:

1. Your Connection ID
2. A current game state dump

## Obtaining your Connection ID

Upon connecting to the JS13K MMO server, the server will send a unique connection ID. This connection ID identifies your WebSocket connection as unique from all others connected to the same room.

```js
let myId = null

socket.addEventListener('message', (event) => {
  try {
    const data = JSON.parse(event.data)

    if (data.id) {
      // Received my own ID from server
      myId = data.id
      console.log('Received my ID from server:', myId)
    }
  } catch (e) {
    console.warn(`Unable to parse message`)
  }
})
```

Your connection ID will be useful for maintaining shared game state in the future.

## Receiving the initial state dump

The JS13K MMO server gives you an initial full state dump when you connect. You should initialize your game state and avoid modifying it until after you receive the initial state dump.

```js
let myState = {}

socket.addEventListener('message', (event) => {
  try {
    const data = JSON.parse(event.data)

    if (data.state) {
      // Received my own ID from server
      myState = data.state
      console.log('Received initial state dump from server:', myState)
    }
  } catch (e) {
    console.warn(`Unable to parse message`)
  }
})
```
