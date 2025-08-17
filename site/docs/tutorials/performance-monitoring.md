---
title: Performance Monitoring
sidebar_position: 7
---

# Performance Monitoring

Track client-side metrics:

```js
class PerformanceMonitor {
  constructor(client) {
    this.client = client
    this.metrics = {
      messagesReceived: 0,
      messagesSent: 0,
      averageLatency: 0,
      stateSize: 0,
    }

    this.setupMonitoring()
  }

  setupMonitoring() {
    // Track messages
    this.client.on('delta', () => {
      this.metrics.messagesReceived++
      this.metrics.stateSize = JSON.stringify(this.client.getState()).length
    })

    // Measure latency
    setInterval(() => {
      const start = performance.now()
      this.client.updateMyState({ ping: start })
    }, 5000)

    this.client.on('delta', (delta) => {
      if (delta._players?.[this.client.getMyId()]?.ping) {
        const latency = performance.now() - delta._players[this.client.getMyId()].ping
        this.metrics.averageLatency = (this.metrics.averageLatency + latency) / 2
      }
    })
  }

  getReport() {
    return {
      ...this.metrics,
      playersConnected: Object.keys(this.client.getState()._players).length,
      connectionStatus: this.client.isConnected(),
    }
  }
}

// Usage
const monitor = new PerformanceMonitor(client)
setInterval(() => {
  console.log('📊 Performance:', monitor.getReport())
}, 10000)
```
