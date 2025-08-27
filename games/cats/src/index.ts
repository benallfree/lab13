import {
  createPositionNormalizer,
  deepCopy,
  ENTITY_COLLECTION_PREFIX,
  generateUUID,
  onClientJoined,
  onClientLeft,
  onClose,
  onOpen,
  PLAYER_ENTITY_COLLECTION_KEY,
  StateBase,
  useMyId,
  useOnline,
  useState,
} from './online'

type PlayerState = {
  x: number
  y: number
  score: number
  name: string
}
type MouseState = {
  x: number
  y: number
  _vx: number
  _vy: number
  _owner: string
}
const MICE_ENTITY_COLLECTION_KEY = `${ENTITY_COLLECTION_PREFIX}mice`
type MouseEntityCollectionKey = typeof MICE_ENTITY_COLLECTION_KEY
type GameState = StateBase<PlayerState> & {
  [MICE_ENTITY_COLLECTION_KEY]: Record<string, MouseState>
}

useOnline('mewsterpiece/cats')
const { getMyId } = useMyId()
const normalizePosition = createPositionNormalizer<GameState>()
const { getState, getMyState, updateMyState, updateState } = useState<GameState>({
  onBeforeSendState: (state) => {
    return normalizePosition(state)
  },
  onBeforeSendDelta: (delta) => {
    // console.log('Before sending delta:', JSON.stringify(delta, null, 2))
    return normalizePosition(delta)
  },
})

// Create status indicator
const statusIndicator = document.createElement('div')
statusIndicator.className = 'status-indicator status-connecting'
statusIndicator.textContent = 'Connecting...'
document.body.appendChild(statusIndicator)

// Create score display and place in controls next to name input
const scoreDisplay = document.createElement('div')
scoreDisplay.className = 'score'
scoreDisplay.textContent = 'Mice Caught: 0'
const controlsEl = document.querySelector('.controls')
if (controlsEl) {
  controlsEl.appendChild(scoreDisplay)
} else {
  document.body.appendChild(scoreDisplay)
}

// Game state
let keys: Record<string, boolean> = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
}

let myScore = 0

// Canvas setup
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

// Help button and overlay
const helpButton = document.createElement('button')
helpButton.className = 'control-btn'
helpButton.textContent = 'Help'
helpButton.setAttribute('aria-expanded', 'false')
const controlsEl2 = document.querySelector('.controls')
if (controlsEl2) controlsEl2.appendChild(helpButton)

const helpOverlay = document.createElement('div')
helpOverlay.className = 'help-overlay'
helpOverlay.innerHTML = `
  <div><strong>🐱 Black Cats Chase MMO Mice! 🐭</strong></div>
  <div>Arrow keys to move your cat</div>
  <div>Catch the gray mice to score points</div>
  <div>Mice are shared across all players</div>
  <div>Each player gets a unique black cat</div>
  <div>Your cat label shows your name</div>
`
const gameContainer = document.querySelector('.game-container')
if (gameContainer) gameContainer.appendChild(helpOverlay)

let helpVisible = false
function toggleHelp() {
  helpVisible = !helpVisible
  helpOverlay.style.display = helpVisible ? 'block' : 'none'
  helpButton.setAttribute('aria-expanded', String(helpVisible))
}
helpButton.addEventListener('click', toggleHelp)

// Set canvas size to fixed 800x600
function resizeCanvas() {
  canvas.width = 800
  canvas.height = 600
}

// Initial resize
resizeCanvas()

// Resize on window resize
window.addEventListener('resize', resizeCanvas)

// Cat names for different players (not used directly; user provides name)
const catNames = ['Shadow', 'Midnight', 'Luna', 'Raven', 'Onyx', 'Coal', 'Smokey', 'Void']

// Draw a black cat
function drawCat(x: number, y: number, isMyCat = false, score: number, name: string) {
  ctx.save()
  ctx.translate(x, y)

  // Cat body (black)
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.ellipse(0, 0, 12, 8, 0, 0, 2 * Math.PI)
  ctx.fill()

  // Cat head
  ctx.beginPath()
  ctx.arc(0, -8, 8, 0, 2 * Math.PI)
  ctx.fill()

  // Cat ears
  ctx.beginPath()
  ctx.moveTo(-6, -14)
  ctx.lineTo(-2, -8)
  ctx.lineTo(-4, -12)
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(6, -14)
  ctx.lineTo(2, -8)
  ctx.lineTo(4, -12)
  ctx.fill()

  // Cat eyes (glowing green)
  ctx.fillStyle = '#00ff00'
  ctx.beginPath()
  ctx.arc(-3, -10, 2, 0, 2 * Math.PI)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(3, -10, 2, 0, 2 * Math.PI)
  ctx.fill()

  // Cat tail
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(12, 0)
  ctx.quadraticCurveTo(20, -5, 25, 0)
  ctx.stroke()

  // Label: my cat shows name (you); others show name (score)
  ctx.fillStyle = '#ff6b6b'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  if (isMyCat) {
    const label = name && name.trim().length > 0 ? `${name} (you)` : 'YOU'
    ctx.fillText(label, 0, -25)
  } else {
    const safeName = name && name.trim().length > 0 ? name : 'Cat'
    const safeScore = score != null ? score : 0
    ctx.fillText(`${safeName} (${safeScore})`, 0, -25)
  }

  ctx.restore()
}

// Draw a mouse
function drawMouse(x: number, y: number) {
  ctx.save()
  ctx.translate(x, y)

  // Mouse body (gray)
  ctx.fillStyle = '#808080'
  ctx.beginPath()
  ctx.ellipse(0, 0, 6, 4, 0, 0, 2 * Math.PI)
  ctx.fill()

  // Mouse head
  ctx.beginPath()
  ctx.arc(0, -4, 4, 0, 2 * Math.PI)
  ctx.fill()

  // Mouse ears
  ctx.fillStyle = '#a0a0a0'
  ctx.beginPath()
  ctx.arc(-2, -6, 2, 0, 2 * Math.PI)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(2, -6, 2, 0, 2 * Math.PI)
  ctx.fill()

  // Mouse eyes (red)
  ctx.fillStyle = '#ff0000'
  ctx.beginPath()
  ctx.arc(-1, -5, 1, 0, 2 * Math.PI)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(1, -5, 1, 0, 2 * Math.PI)
  ctx.fill()

  // Mouse tail
  ctx.strokeStyle = '#808080'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(6, 0)
  ctx.lineTo(12, -2)
  ctx.stroke()

  ctx.restore()
}

// Generate a new mouse
function spawnMouse() {
  const mouseId = generateUUID()
  const newMouse: MouseState = {
    x: Math.random() * (canvas.width - 40) + 20,
    y: Math.random() * (canvas.height - 40) + 20,
    _vx: (Math.random() - 0.5) * 2,
    _vy: (Math.random() - 0.5) * 2,
    _owner: getMyId(),
  }

  updateState({
    [MICE_ENTITY_COLLECTION_KEY]: {
      [mouseId]: newMouse,
    },
  })
}

// Update mice positions (only for mice you own)
function updateMice() {
  const state = getState()
  if (!state[MICE_ENTITY_COLLECTION_KEY]) return

  const allMyMice = Object.entries(state[MICE_ENTITY_COLLECTION_KEY])
    .filter((entry): entry is [string, GameState[MouseEntityCollectionKey][string]] => entry[1]?._owner === getMyId())
    .map((entry): [string, GameState[MouseEntityCollectionKey][string]] => [entry[0], deepCopy(entry[1])])

  // console.log('All my mice', JSON.stringify(allMyMice, null, 2))
  allMyMice.forEach(([mouseId, mouse]) => {
    // Update position
    mouse.x = (mouse.x ?? 0) + (mouse._vx ?? 0)
    mouse.y = (mouse.y ?? 0) + (mouse._vy ?? 0)

    // Bounce off walls
    if (mouse.x < 10 || mouse.x > canvas.width - 10) {
      mouse._vx = -(mouse._vx ?? 0)
    }
    if (mouse.y < 10 || mouse.y > canvas.height - 10) {
      mouse._vy = -(mouse._vy ?? 0)
    }

    // Keep mice in bounds
    mouse.x = Math.max(10, Math.min(canvas.width - 10, mouse.x))
    mouse.y = Math.max(10, Math.min(canvas.height - 10, mouse.y))

    // console.log('Updating mouse', JSON.stringify({ mouseId, mouse }, null, 2))
    // Send updated position
    updateState({
      [MICE_ENTITY_COLLECTION_KEY]: {
        [mouseId]: mouse,
      },
    })
  })
}

// Check collision between cat and mouse
function checkCollision(catX: number, catY: number, mouseX: number, mouseY: number) {
  const distance = Math.sqrt((catX - mouseX) ** 2 + (catY - mouseY) ** 2)
  return distance < 20
}

// Render the current state to canvas
function renderState() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw spooky background
  ctx.fillStyle = '#2d1810'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw some spooky trees
  ctx.fillStyle = '#1a0f0a'
  for (let i = 0; i < 8; i++) {
    const x = (canvas.width / 8) * i
    const y = canvas.height - 30
    ctx.fillRect(x - 5, y, 10, 30)
    ctx.beginPath()
    ctx.arc(x, y - 10, 15, 0, 2 * Math.PI)
    ctx.fill()
  }

  // Draw textured moon
  const moonX = canvas.width - 50
  const moonY = 50
  const moonR = 20

  // Base gradient
  const baseGrad = ctx.createRadialGradient(moonX - moonR * 0.4, moonY - moonR * 0.4, moonR * 0.2, moonX, moonY, moonR)
  baseGrad.addColorStop(0, '#ffffff')
  baseGrad.addColorStop(0.55, '#f0f0f0')
  baseGrad.addColorStop(1, '#d8d8d8')

  ctx.save()
  ctx.beginPath()
  ctx.arc(moonX, moonY, moonR, 0, 2 * Math.PI)
  ctx.fillStyle = baseGrad
  ctx.fill()

  // Clip to moon and add craters
  ctx.clip()
  const craters = [
    { dx: -6, dy: -2, r: 4 },
    { dx: 3, dy: 2, r: 3 },
    { dx: -2, dy: 6, r: 2.5 },
    { dx: 6, dy: -4, r: 2 },
    { dx: 0, dy: -7, r: 1.8 },
  ]
  craters.forEach((c) => {
    // darker crater body
    ctx.globalAlpha = 0.28
    ctx.fillStyle = '#bdbdbd'
    ctx.beginPath()
    ctx.arc(moonX + c.dx, moonY + c.dy, c.r, 0, 2 * Math.PI)
    ctx.fill()

    // subtle highlight rim
    ctx.globalAlpha = 0.18
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(moonX + c.dx - c.r * 0.2, moonY + c.dy - c.r * 0.2, c.r * 0.75, 0, 2 * Math.PI)
    ctx.stroke()
  })

  // Soft terminator shadow
  const shadowGrad = ctx.createRadialGradient(
    moonX + moonR * 0.5,
    moonY + moonR * 0.2,
    moonR * 0.2,
    moonX + moonR * 0.9,
    moonY + moonR * 0.5,
    moonR * 1.15
  )
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0)')
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0.25)')
  ctx.fillStyle = shadowGrad
  ctx.globalAlpha = 1
  ctx.beginPath()
  ctx.arc(moonX, moonY, moonR, 0, 2 * Math.PI)
  ctx.fill()
  ctx.restore()

  // Draw mice from state
  const state = getState()
  if (state[MICE_ENTITY_COLLECTION_KEY]) {
    Object.values(state[MICE_ENTITY_COLLECTION_KEY]).forEach((mouse) => {
      if (!mouse) return
      drawMouse(mouse.x ?? 0, mouse.y ?? 0)
    })
  }

  // Render all cats from state
  if (state[PLAYER_ENTITY_COLLECTION_KEY]) {
    for (const playerId in state[PLAYER_ENTITY_COLLECTION_KEY]) {
      const cat = state[PLAYER_ENTITY_COLLECTION_KEY][playerId]
      if (!cat) continue
      const isMyCat = playerId === getMyId()
      drawCat(cat.x ?? 0, cat.y ?? 0, isMyCat, cat.score ?? 0, cat.name ?? '')
    }
  }
}

// Update cat position based on keys
function updateCat() {
  const myCat = getMyState(true)
  if (!myCat) {
    return
  }

  let moved = false

  if (keys.ArrowUp) {
    myCat.y = (myCat.y ?? 0) - 4
    moved = true
  }
  if (keys.ArrowDown) {
    myCat.y = (myCat.y ?? 0) + 4
    moved = true
  }
  if (keys.ArrowLeft) {
    myCat.x = (myCat.x ?? 0) - 4
    moved = true
  }
  if (keys.ArrowRight) {
    myCat.x = (myCat.x ?? 0) + 4
    moved = true
  }

  // Keep cat within bounds
  myCat.x = Math.max(20, Math.min(canvas.width - 20, myCat.x ?? 0))
  myCat.y = Math.max(20, Math.min(canvas.height - 20, myCat.y ?? 0))

  // Check for mouse collisions
  const state = getState()
  if (state[MICE_ENTITY_COLLECTION_KEY]) {
    Object.entries(state[MICE_ENTITY_COLLECTION_KEY]).forEach(([mouseId, mouse]) => {
      if (!mouse) return
      if (checkCollision(myCat.x ?? 0, myCat.y ?? 0, mouse.x ?? 0, mouse.y ?? 0)) {
        // Remove the caught mouse
        updateState({ [MICE_ENTITY_COLLECTION_KEY]: { [mouseId]: null } })

        // Increase score
        myScore++
        myCat.score = myScore
        scoreDisplay.textContent = `Mice Caught: ${myScore}`
      }
    })
  }

  if (moved || myCat.score !== undefined) {
    updateMyState(myCat)
  }
}

// Handle SDK events
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

const CAT_NAMES = [
  'Shadow',
  'Midnight',
  'Luna',
  'Raven',
  'Onyx',
  'Coal',
  'Smokey',
  'Void',
  'Pumpkin',
  'Salem',
  'Jet',
  'Licorice',
  'Ash',
  'Eclipse',
  'Night',
  'Storm',
  'Cinder',
  'Sable',
  'Pepper',
  'Ink',
  'Charcoal',
  'Graphite',
  'Obsidian',
  'Phantom',
  'Cosmo',
  'Misty',
  'Twilight',
  'Dusky',
  'Ember',
  'Fang',
  'Gloom',
  'Hallow',
  'Hex',
  'Jinx',
  'Magic',
  'Moonlight',
  'Mystic',
  'Noir',
  'Poe',
  'Shade',
  'Silhouette',
  'Specter',
  'Spooky',
  'Vesper',
  'Wisp',
  'Zephyr',
]

const randomCatName = () => {
  return CAT_NAMES[Math.floor(Math.random() * CAT_NAMES.length)]!
}

const initCat = () => {
  // Initialize my cat
  const nameInputEl = document.getElementById('name-input') as HTMLInputElement
  const initialCat = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    score: 0,
    name: nameInputEl && 'value' in nameInputEl ? (nameInputEl.value as string) || '' : '',
  }
  console.log('Initialized my cat:', initialCat)
  updateMyState(initialCat)
}

onClientJoined((playerId) => {
  console.log('Client connected:', playerId)
})

onClientLeft((playerId) => {
  console.log('Client disconnected:', playerId)
})

// Handle key events
document.addEventListener('keydown', (event) => {
  if (keys.hasOwnProperty(event.key)) {
    keys[event.key] = true
    event.preventDefault()
  }
})

document.addEventListener('keyup', (event) => {
  if (keys.hasOwnProperty(event.key)) {
    keys[event.key] = false
    event.preventDefault()
  }
})

// Name input handling
const nameInput = document.getElementById('name-input') as HTMLInputElement
if (nameInput) {
  nameInput.value = randomCatName()
  nameInput.addEventListener('input', (event) => {
    const value = event.target && 'value' in event.target ? `${event.target.value}` : ''
    updateMyState({ name: value })
  })
}

initCat()
// Game loop
function gameLoop() {
  updateMice()
  updateCat()
  renderState()
  requestAnimationFrame(gameLoop)
}

// Spawn a new mouse after a short delay to prevent conflicts
setInterval(() => {
  const currentState = getState()
  // console.log('Current state:', JSON.stringify(currentState, null, 2))
  if (Object.keys(currentState[MICE_ENTITY_COLLECTION_KEY] || {}).length < 1) {
    spawnMouse()
  }
}, 1000)

// Start game loop
gameLoop()
