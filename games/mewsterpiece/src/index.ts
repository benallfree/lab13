/// <reference path="../partysocket.d.ts" />

import { cats, LEVEL_PAUSE_DURATION } from './constants'
import {
  onClientJoined,
  onClose,
  onCommandMessage,
  onError,
  onOpen,
  sendCommandMessageToAll,
  sendCommandMessageToClient,
  usePresence,
} from './online'
import { getCurrentGameState, state } from './state'
import './style.css'

// WebSocket connection
window.socket = new window.PartySocket({
  host: 'relay.js13kgames.com',
  party: 'mewsterpiece',
  room: 'mewsterpiece',
})

usePresence()

const sendStateToClient = (clientId: string) => {
  const canvasDataUrl = canvas.toDataURL('image/webp')
  console.log('Sending state to client', clientId, 'canvas data length:', canvasDataUrl.length)
  sendCommandMessageToClient(clientId, `s`, JSON.stringify({ ...state.shared, img: canvasDataUrl }))
}
const onStateMessage = (callback: (data: string) => void) => {
  onCommandMessage(`s`, callback)
}
onStateMessage((data) => {
  state.shared = JSON.parse(data)
  const currentState = getCurrentGameState()
  state.currentLevel = currentState.currentLevel

  const img = new Image()
  img.onload = () => {
    console.log('Image loaded successfully, drawing to canvas')
    ctx.drawImage(img, 0, 0)
  }
  img.onerror = (error) => {
    console.error('Failed to load image:', error)
  }
  img.src = state.shared.img
  console.log('Set image src, length:', state.shared.img ? state.shared.img.length : 'null/undefined')
})
onClientJoined((clientId) => {
  console.log('Client joined:', clientId)
  sendStateToClient(clientId)
})
const onPixelMessage = (callback: (data: string) => void) => {
  onCommandMessage(`p`, callback)
}
onPixelMessage((data) => {
  const [x, y, color, radius] = data.split('|')
  drawPixel(Number(x), Number(y), color, Number(radius))
})
export const sendPixelMessage = (x: number, y: number, color: string, radius: number) => {
  sendCommandMessageToAll(`p`, `${x}|${y}|${color}|${radius}`)
}

// Canvas and painting setup
export const canvas = document.getElementById('canvas') as HTMLCanvasElement
export const ctx = canvas.getContext('2d')!
const colorPicker = document.getElementById('colorPicker') as HTMLInputElement
const radiusSlider = document.getElementById('radiusSlider') as HTMLInputElement
const radiusValue = document.getElementById('radiusValue') as HTMLSpanElement
const statusIndicator = document.getElementById('statusIndicator') as HTMLDivElement
const statusText = document.getElementById('statusText') as HTMLSpanElement

// Level system elements
const timerDisplay = document.getElementById('timerDisplay') as HTMLSpanElement
const levelDisplay = document.getElementById('levelDisplay') as HTMLSpanElement
const catThumbnails = document.getElementById('catThumbnails') as HTMLDivElement

// Set up canvas for pixel-perfect drawing
ctx.imageSmoothingEnabled = false

// --- Custom cursor ---
function updateCursor() {
  const size = markRadius * 2
  const color = colorPicker.value

  // Create a canvas for the cursor
  const cursorCanvas = document.createElement('canvas')
  cursorCanvas.width = size
  cursorCanvas.height = size
  const cursorCtx = cursorCanvas.getContext('2d')!

  // Draw the cursor circle
  cursorCtx.beginPath()
  cursorCtx.arc(size / 2, size / 2, markRadius, 0, Math.PI * 2)
  cursorCtx.strokeStyle = color
  cursorCtx.lineWidth = 1
  cursorCtx.stroke()
  cursorCtx.globalAlpha = 0.3
  cursorCtx.fillStyle = color
  cursorCtx.fill()

  // Convert to data URL and set as cursor
  const dataURL = cursorCanvas.toDataURL()
  canvas.style.cursor = `url(${dataURL}) ${size / 2} ${size / 2}, crosshair`
}

// Visual size of a painted mark (radius in pixels)
let markRadius = Number(radiusSlider?.value ?? 5)
if (radiusValue) radiusValue.textContent = String(markRadius)
radiusSlider?.addEventListener('input', () => {
  markRadius = Number(radiusSlider.value)
  if (radiusValue) radiusValue.textContent = String(markRadius)
  updateCursor()
})

colorPicker?.addEventListener('input', () => {
  updateCursor()
})

// Initialize cursor
updateCursor()

// Get mouse position relative to canvas
function getMousePos(e: MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  return {
    x: Math.floor(e.clientX - rect.left),
    y: Math.floor(e.clientY - rect.top),
  }
}

// Draw a single pixel
export function drawPixel(x: number, y: number, color: string, radius: number = markRadius) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x + 0.5, y + 0.5, radius, 0, Math.PI * 2)
  ctx.fill()
}

// Level system functions
function createCatThumbnail(cat: any, index: number) {
  const thumbnail = document.createElement('div')
  thumbnail.className = 'cat-thumbnail'
  thumbnail.dataset.level = String(index)

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 200 200')
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', cat.path)
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke', '#374151')
  path.setAttribute('stroke-width', '3')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('stroke-linejoin', 'round')
  svg.appendChild(path)

  const levelNumber = document.createElement('div')
  levelNumber.className = 'level-number'
  levelNumber.textContent = String(index + 1)

  thumbnail.appendChild(svg)
  thumbnail.appendChild(levelNumber)

  if (index > state.currentLevel) {
    thumbnail.classList.add('locked')
    const lockIcon = document.createElement('div')
    lockIcon.className = 'lock-icon'
    lockIcon.innerHTML = '🔒'
    thumbnail.appendChild(lockIcon)
  }

  thumbnail.addEventListener('click', () => {
    if (index <= state.currentLevel) {
      startLevel(index)
    }
  })

  return thumbnail
}

function updateThumbnails() {
  catThumbnails.innerHTML = ''
  cats.forEach((cat, index) => {
    const thumbnail = createCatThumbnail(cat, index)
    if (index === state.currentLevel) {
      thumbnail.classList.add('current')
    } else if (state.completedLevels.has(index)) {
      thumbnail.classList.add('completed')
    }
    catThumbnails.appendChild(thumbnail)
  })
}

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function startLevel(levelIndex: number) {
  state.currentLevel = levelIndex
  const cat = cats[levelIndex]

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Render the base outline for the level
  renderLevelBackground(levelIndex)

  // Update displays
  levelDisplay.textContent = `Level ${levelIndex + 1}: ${cat.name}`

  updateThumbnails()
}

function updateGameState() {
  const gameState = getCurrentGameState()

  // Update current level if it changed
  if (gameState.currentLevel !== state.currentLevel) {
    state.currentLevel = gameState.currentLevel
    const cat = cats[state.currentLevel]

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Render the base outline for the level
    renderLevelBackground(state.currentLevel)

    // Update displays
    levelDisplay.textContent = `Level ${state.currentLevel + 1}: ${cat.name}`
    updateThumbnails()
  }

  // Update timer display
  if (gameState.isInLevel) {
    state.timeRemaining = gameState.timeRemaining
    timerDisplay.textContent = formatTime(state.timeRemaining)
  } else if (gameState.isInPause) {
    timerDisplay.textContent = `Next level in ${Math.ceil(gameState.pauseTimeRemaining / 1000)}...`
  } else if (gameState.isInMatchPause) {
    timerDisplay.textContent = `Next match in ${Math.ceil(gameState.pauseTimeRemaining / 1000)}...`
  }

  // Continue the animation loop
  requestAnimationFrame(updateGameState)
}

function handleTimeUp() {
  // The deterministic system will handle the transition automatically
  // Just update the display to show we're waiting
  timerDisplay.textContent = `Time's up! Next level in ${Math.ceil(LEVEL_PAUSE_DURATION / 1000)}...`
}

function transitionToNextLevel() {
  if (state.currentLevel < cats.length - 1) {
    state.currentLevel++
    startLevel(state.currentLevel)
  } else {
    // All levels completed for this match!
    timerDisplay.textContent = 'Match complete! Next match starting soon...'
    levelDisplay.textContent = 'Match Complete!'
  }
}

function completeLevel() {
  state.completedLevels.add(state.currentLevel)

  if (state.currentLevel < cats.length - 1) {
    state.currentLevel++
    startLevel(state.currentLevel)
  } else {
    // All levels completed!
    alert("Congratulations! You've completed all the cats!")
  }
}

// Render level background
function renderLevelBackground(levelIndex: number) {
  console.log('Rendering base image for level', levelIndex, '- single player mode')
  const cat = cats[levelIndex]

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Calculate actual drawing bounds
  const boundsWidth = cat.bounds.maxX - cat.bounds.minX
  const boundsHeight = cat.bounds.maxY - cat.bounds.minY

  // Scale to fit canvas while maintaining aspect ratio
  const scaleX = canvas.width / boundsWidth
  const scaleY = canvas.height / boundsHeight
  const scale = Math.min(scaleX, scaleY) * 0.8 // 80% of max scale for padding

  // Center the drawing using bounds
  const offsetX = (canvas.width - boundsWidth * scale) / 2 - cat.bounds.minX * scale
  const offsetY = (canvas.height - boundsHeight * scale) / 2 - cat.bounds.minY * scale

  ctx.save()
  ctx.translate(offsetX, offsetY)
  ctx.scale(scale, scale)

  // Create Path2D from SVG path data
  const path = new Path2D(cat.path)

  // Draw the path
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 3 / scale // Adjust line width for scaling
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke(path)

  ctx.restore()
}

// Initialize canvas state
function initializeCanvasState() {
  // Canvas is not part of shared state, just mark as initialized
  state.isInitialized = true
}

// Status management function
function setStatus(status: 'searching' | 'connected', text?: string) {
  if (!statusIndicator || !statusText) return

  // Remove all status classes
  statusIndicator.classList.remove('searching', 'connected')

  // Add the appropriate class
  statusIndicator.classList.add(status)

  // Update the text
  if (text) {
    statusText.textContent = text
  } else {
    switch (status) {
      case 'searching':
        statusText.textContent = 'Searching for other players...'
        break
      case 'connected':
        statusText.textContent = 'Connected'
        break
    }
  }

  // Show the indicator
  statusIndicator.classList.remove('hidden')
}

function startNewMatch() {
  state.shared.matchNumber++
  state.shared.startedAt = Date.now()
  state.currentLevel = 0
  state.completedLevels.clear()
  startLevel(0)
}

// Mouse event handlers
canvas.addEventListener('mousedown', (e) => {
  if (!state.isInitialized) return
  state.isDrawing = true
  const pos = getMousePos(e)
  const color = colorPicker.value
  drawPixel(pos.x, pos.y, color, markRadius)
  sendPixelMessage(pos.x, pos.y, color, markRadius)
})

canvas.addEventListener('mousemove', (e) => {
  if (!state.isInitialized) return
  const pos = getMousePos(e)
  if (state.isDrawing) {
    const color = colorPicker.value
    drawPixel(pos.x, pos.y, color, markRadius)
    sendPixelMessage(pos.x, pos.y, color, markRadius)
  }
})

canvas.addEventListener('mouseup', () => {
  state.isDrawing = false
})

canvas.addEventListener('mouseleave', () => {
  state.isDrawing = false
})

// Add keyboard shortcut to complete level (for testing)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    completeLevel()
  }
})

// Connection status
onOpen(() => {
  console.log('WebSocket connected')
  setStatus('connected')
  initializeCanvasState()
})

onClose(() => {
  setStatus('searching')
})

onError(() => {
  setStatus('searching')
})

// Set initial status to searching
setStatus('searching')

// Set up connection timeout - if no connection after 5 seconds, keep searching
setTimeout(() => {
  // Keep searching for connection
  if (statusIndicator && statusIndicator.classList.contains('searching')) {
    setStatus('searching')
  }
}, 5000)

// Initialize the game to start at level 1
state.currentLevel = 0
startLevel(state.currentLevel)

// Start the RAF loop that updates based on state.startedAt
updateGameState()
