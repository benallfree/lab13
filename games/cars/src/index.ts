import {
  createPositionNormalizer,
  createRotationNormalizer,
  onClientLeft,
  onClose,
  onMyIdUpdated,
  onOpen,
  useMyId,
  useState,
} from 'lab13-sdk'
import type { PartySocket } from 'partysocket'

declare global {
  interface Window {
    PartySocket: typeof PartySocket
    socket: PartySocket
  }
}

// WebSocket connection
window.socket = new window.PartySocket({
  host: 'relay.js13kgames.com',
  party: 'mewsterpiece',
  room: 'cars',
})

const normalizePosition = createPositionNormalizer()
const normalizeRotation = createRotationNormalizer()
const { getState, getMyState, updateMyState, updatePlayerState, getPlayerStates } = useState({
  // onStateReceived: (currentState, newState) => {
  //   const myId = getMyId()
  //   if (myId) {
  //     newState._players[myId] = currentState._players[myId]
  //   }
  //   return newState
  // },
  onBeforeSendDelta: (delta) => {
    console.log('Before sending delta:', JSON.stringify(delta, null, 2))
    return normalizePosition(normalizeRotation(delta as any))
  },
  onDeltaReceived: (delta) => {
    console.log('Received delta:', delta)
    return delta
  },
})

onClientLeft((clientId) => {
  updatePlayerState(clientId, null)
})

const { getMyId } = useMyId()

// Create status indicator
const statusIndicator = document.createElement('div')
statusIndicator.className = 'status-indicator status-connecting'
statusIndicator.textContent = 'Connecting...'
document.body.appendChild(statusIndicator)

// Game state
let keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
}

// Canvas setup
const canvas = document.getElementById('gameCanvas')! as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

// Set canvas size to fill container
function resizeCanvas() {
  const container = canvas.parentElement!
  canvas.width = container.clientWidth
  canvas.height = container.clientHeight
}

// Initial resize
resizeCanvas()

// Resize on window resize
window.addEventListener('resize', resizeCanvas)

// Car colors for different players
const carColors = ['#ff0000', '#000000', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080']

// Draw a car
function drawCar(x: number, y: number, rz: number, color: string, isMyCar = false) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rz)

  // Car body
  ctx.fillStyle = color
  ctx.fillRect(-15, -8, 30, 16)

  // Car roof
  ctx.fillRect(-8, -12, 16, 8)

  // Wheels
  ctx.fillStyle = '#333'
  ctx.fillRect(-12, -10, 4, 20)
  ctx.fillRect(8, -10, 4, 20)

  // Headlights
  ctx.fillStyle = '#ffff00'
  ctx.fillRect(-12, -6, 3, 3)
  ctx.fillRect(-12, 3, 3, 3)

  // My car gets a special indicator
  if (isMyCar) {
    ctx.fillStyle = '#fff'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('YOU', 0, -20)
  }

  ctx.restore()
}

// Render the current state to canvas
function renderState() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw grass pattern
  ctx.fillStyle = '#1c5e1e'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw some road lines
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.setLineDash([20, 20])
  ctx.beginPath()
  ctx.moveTo(canvas.width / 2, 0)
  ctx.lineTo(canvas.width / 2, canvas.height)
  ctx.stroke()
  ctx.setLineDash([])

  // Render all cars from state
  const players = getPlayerStates()
  if (players) {
    for (const playerId in players) {
      const car = players[playerId]!
      const idx = Array.from(String(playerId)).reduce((a, c) => a + c.charCodeAt(0), 0) % carColors.length
      const color = carColors[idx]!
      const isMyCar = playerId === getMyId()
      drawCar(car.x, car.y, car.rz, color, isMyCar)
    }
  }
}

// Update car position based on keys
function updateCar() {
  const car = getMyState(true) // Get deep copy since we'll modify it
  if (!car) {
    return
  }

  let moved = false

  if (keys.ArrowUp) {
    car.x -= Math.cos(car.rz) * 3
    car.y -= Math.sin(car.rz) * 3
    moved = true
    console.log('Moving forward', car.x, car.y)
  }
  if (keys.ArrowDown) {
    car.x += Math.cos(car.rz) * 2
    car.y += Math.sin(car.rz) * 2
    moved = true
    console.log('Moving backward', car.x, car.y)
  }
  if (keys.ArrowLeft) {
    car.rz -= 0.1
    moved = true
    console.log('Turning left', car.rz)
  }
  if (keys.ArrowRight) {
    car.rz += 0.1
    moved = true
    console.log('Turning right', car.rz)
  }

  // Keep car within bounds
  car.x = Math.max(20, Math.min(canvas.width - 20, car.x))
  car.y = Math.max(20, Math.min(canvas.height - 20, car.y))

  if (moved) {
    // Send update to server
    updateMyState(car)
  }
}

onOpen(() => {
  console.log('open')
  statusIndicator.className = 'status-indicator status-connected'
  statusIndicator.textContent = 'Connected'
})

onClose(() => {
  console.log('close')
  statusIndicator.className = 'status-indicator status-disconnected'
  statusIndicator.textContent = 'Disconnected'
})

onMyIdUpdated((id) => {
  console.log('Received my ID from server:', id)

  // Initialize my car
  const initialCar = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    rz: 0,
  }
  console.log('Initialized my car:', initialCar)
  // Send initial position
  updateMyState(initialCar)
})

// Handle key events
document.addEventListener('keydown', (event) => {
  if (keys.hasOwnProperty(event.key)) {
    keys[event.key as keyof typeof keys] = true
    console.log('Key pressed:', event.key)
    event.preventDefault()
  }
})

document.addEventListener('keyup', (event) => {
  if (keys.hasOwnProperty(event.key)) {
    keys[event.key as keyof typeof keys] = false
    console.log('Key released:', event.key)
    event.preventDefault()
  }
})

// Game loop
function gameLoop() {
  updateCar()
  renderState()
  requestAnimationFrame(gameLoop)
}

// Start game loop
gameLoop()

// Help overlay toggle
const helpBtn = document.getElementById('helpBtn')
const instructionsEl = document.querySelector('.instructions')
if (helpBtn && instructionsEl) {
  helpBtn.addEventListener('click', () => {
    const isVisible = instructionsEl.classList.toggle('visible')
    helpBtn.classList.toggle('active', isVisible)
  })
}
