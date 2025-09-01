import {
  onClientJoined,
  onClose,
  onCommandMessage,
  onError,
  onOpen,
  sendCommandMessageToAll,
  sendCommandMessageToClient,
  usePresence,
} from 'lab13-sdk'
import type { PartySocket } from 'partysocket'
import { cats } from './cats'
import {
  clearAllCompletedPictures,
  deleteCompletedPicture,
  getCurrentGameState,
  saveCompletedPicture,
  state,
} from './state'
import './style.css'

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
  console.log('Current state:', currentState)
  state.currentLevel = currentState.currentLevel

  const img = new Image()
  img.onload = () => {
    console.log('Image loaded successfully, drawing to canvas')
    // Clear canvas before drawing the new image
    ctx.clearRect(0, 0, canvas.width, canvas.height)
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
  if (state.isInBreak) return // Don't accept pixel events during breaks
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

// Tab elements
const drawTab = document.getElementById('drawTab') as HTMLButtonElement
const finishedTab = document.getElementById('finishedTab') as HTMLButtonElement
const drawContent = document.getElementById('drawContent') as HTMLDivElement
const finishedContent = document.getElementById('finishedContent') as HTMLDivElement
const galleryGrid = document.getElementById('galleryGrid') as HTMLDivElement

// Create break overlay
const breakOverlay = document.createElement('div')
breakOverlay.style.position = 'absolute'
breakOverlay.style.top = '50%'
breakOverlay.style.left = '50%'
breakOverlay.style.transform = 'translate(-50%, -50%)'
breakOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
breakOverlay.style.color = 'white'
breakOverlay.style.padding = '20px'
breakOverlay.style.borderRadius = '8px'
breakOverlay.style.fontSize = '18px'
breakOverlay.style.fontWeight = 'bold'
breakOverlay.style.zIndex = '100'
breakOverlay.style.display = 'none'
breakOverlay.textContent = 'BREAK TIME - No Drawing Allowed'
canvas.parentElement?.appendChild(breakOverlay)

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

  // Mark that pixels have been drawn on this level
  state.hasDrawnPixels = true
}

// Tab functionality
function switchTab(tabName: 'draw' | 'finished') {
  // Update tab buttons
  drawTab.classList.toggle('active', tabName === 'draw')
  finishedTab.classList.toggle('active', tabName === 'finished')

  // Update tab content
  drawContent.classList.toggle('active', tabName === 'draw')
  finishedContent.classList.toggle('active', tabName === 'finished')

  // Update gallery if switching to finished tab
  if (tabName === 'finished') {
    updateGallery()
  }
}

// Gallery functionality
function updateGallery() {
  galleryGrid.innerHTML = ''

  // Add clear all button if there are pictures
  if (state.completedPictures.size > 0) {
    const clearAllBtn = document.createElement('button')
    clearAllBtn.textContent = 'Clear All Pictures'
    clearAllBtn.className = 'clear-all-btn'
    clearAllBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all completed pictures? This cannot be undone.')) {
        clearAllCompletedPictures()
        updateGallery()
      }
    })
    galleryGrid.appendChild(clearAllBtn)
  }

  if (state.completedPictures.size === 0) {
    galleryGrid.innerHTML = `
      <div class="gallery-empty">
        <h3>No completed pictures yet</h3>
        <p>Complete some levels to see your artwork here!</p>
      </div>
    `
    return
  }

  // Convert to array and sort by completion date (newest first)
  const completedPictures = Array.from(state.completedPictures.entries()).sort(
    ([, a], [, b]) => b.completedAt - a.completedAt
  ) // Sort by completion date, newest first

  completedPictures.forEach(([pictureId, completedPicture]) => {
    const galleryItem = createGalleryItem(
      pictureId,
      completedPicture.imageData,
      completedPicture.catName,
      completedPicture.completedAt,
      completedPicture.levelIndex
    )
    galleryGrid.appendChild(galleryItem)
  })
}

function createGalleryItem(
  pictureId: string,
  imageData: string,
  catName: string,
  completedAt: number,
  levelIndex: number
) {
  const item = document.createElement('div')
  item.className = 'gallery-item'

  const img = document.createElement('img')
  img.src = imageData
  img.alt = `${catName} - Level ${levelIndex + 1}`

  const info = document.createElement('div')
  info.className = 'gallery-item-info'

  const title = document.createElement('h3')
  title.className = 'gallery-item-title'
  title.textContent = `Level ${levelIndex + 1}: ${catName}`

  const date = document.createElement('p')
  date.className = 'gallery-item-date'
  date.textContent = new Date(completedAt).toLocaleDateString()

  const actions = document.createElement('div')
  actions.className = 'gallery-item-actions'

  const downloadBtn = document.createElement('button')
  downloadBtn.className = 'gallery-action-btn'
  downloadBtn.innerHTML = '⬇️'
  downloadBtn.title = 'Download'
  downloadBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    downloadImage(imageData, `mewsterpiece-level-${levelIndex + 1}-${catName}.png`)
  })

  const deleteBtn = document.createElement('button')
  deleteBtn.className = 'gallery-action-btn'
  deleteBtn.innerHTML = '🗑️'
  deleteBtn.title = 'Delete'
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this picture?')) {
      deleteCompletedPicture(pictureId)
      updateGallery()
    }
  })

  actions.appendChild(downloadBtn)
  actions.appendChild(deleteBtn)
  info.appendChild(title)
  info.appendChild(date)
  item.appendChild(img)
  item.appendChild(info)
  item.appendChild(actions)

  // Click to view full size
  item.addEventListener('click', () => {
    showCompletedPicture(levelIndex, imageData, catName)
  })

  return item
}

function downloadImage(imageData: string, filename: string) {
  const link = document.createElement('a')
  link.href = imageData
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function startLevel(levelIndex: number) {
  state.currentLevel = levelIndex
  state.hasDrawnPixels = false // Reset drawn pixels flag for new level
  const cat = cats[levelIndex]

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Render the base outline for the level
  renderLevelBackground(levelIndex)

  // Update displays
  levelDisplay.textContent = `Level ${levelIndex + 1}: ${cat.name}`
}

function updateGameState() {
  const gameState = getCurrentGameState()

  // Update current level if it changed
  if (gameState.currentLevel !== state.currentLevel) {
    // Save the current canvas state before changing levels
    if (state.isInitialized) {
      const canvasDataUrl = canvas.toDataURL('image/webp')
      const cat = cats[state.currentLevel]
      saveCompletedPicture(state.currentLevel, canvasDataUrl, cat.name)

      // Update gallery if we're on the finished tab
      if (finishedContent.classList.contains('active')) {
        updateGallery()
      }
    }

    state.currentLevel = gameState.currentLevel
    state.hasDrawnPixels = false // Reset drawn pixels flag for new level
    const cat = cats[state.currentLevel]

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Render the base outline for the level
    renderLevelBackground(state.currentLevel)

    // Update displays
    levelDisplay.textContent = `Level ${state.currentLevel + 1}: ${cat.name}`
  }

  // Update timer display
  if (gameState.isInLevel) {
    state.timeRemaining = gameState.timeRemaining
    state.isInLevel = true
    state.isInBreak = false
    timerDisplay.textContent = formatTime(state.timeRemaining)
    canvas.style.opacity = '1'
    breakOverlay.style.display = 'none'
  } else if (gameState.isInBreak) {
    state.isInLevel = false
    state.isInBreak = true
    state.breakTimeRemaining = gameState.breakTimeRemaining
    timerDisplay.textContent = `Next level in ${Math.ceil(state.breakTimeRemaining / 1000)}...`
    canvas.style.opacity = '0.5'
    breakOverlay.style.display = 'block'
  }

  // Auto-complete level when timer runs out
  if (
    gameState.isInLevel &&
    gameState.timeRemaining <= 0 &&
    !Array.from(state.completedPictures.values()).some((p) => p.levelIndex === gameState.currentLevel)
  ) {
    completeLevel()
  }

  // Continue the animation loop
  requestAnimationFrame(updateGameState)
}

function showCompletedPicture(levelIndex: number, imageData: string, catName: string) {
  // Create a simple modal to show the completed picture
  const modal = document.createElement('div')
  modal.style.position = 'fixed'
  modal.style.top = '0'
  modal.style.left = '0'
  modal.style.width = '100%'
  modal.style.height = '100%'
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
  modal.style.display = 'flex'
  modal.style.justifyContent = 'center'
  modal.style.alignItems = 'center'
  modal.style.zIndex = '1000'

  const content = document.createElement('div')
  content.style.backgroundColor = 'white'
  content.style.padding = '20px'
  content.style.borderRadius = '8px'
  content.style.maxWidth = '80%'
  content.style.maxHeight = '80%'
  content.style.overflow = 'auto'

  const title = document.createElement('h3')
  title.textContent = `Level ${levelIndex + 1}: ${catName}`
  title.style.marginBottom = '10px'

  const img = document.createElement('img')
  img.src = imageData
  img.style.maxWidth = '100%'
  img.style.height = 'auto'

  const closeButton = document.createElement('button')
  closeButton.textContent = 'Close'
  closeButton.style.marginTop = '10px'
  closeButton.style.padding = '8px 16px'
  closeButton.style.backgroundColor = '#374151'
  closeButton.style.color = 'white'
  closeButton.style.border = 'none'
  closeButton.style.borderRadius = '4px'
  closeButton.style.cursor = 'pointer'

  closeButton.addEventListener('click', () => {
    document.body.removeChild(modal)
  })

  content.appendChild(title)
  content.appendChild(img)
  content.appendChild(closeButton)
  modal.appendChild(content)

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal)
    }
  })

  document.body.appendChild(modal)
}

function completeLevel() {
  // Save the completed picture to local storage
  const canvasDataUrl = canvas.toDataURL('image/webp')
  const cat = cats[state.currentLevel]
  saveCompletedPicture(state.currentLevel, canvasDataUrl, cat.name)

  // Update gallery if we're on the finished tab
  if (finishedContent.classList.contains('active')) {
    updateGallery()
  }

  if (state.currentLevel < cats.length - 1) {
    state.currentLevel++
    startLevel(state.currentLevel)
  } else {
    // All levels completed! Loop back to level 0
    state.currentLevel = 0
    startLevel(state.currentLevel)
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

// Mouse event handlers
canvas.addEventListener('mousedown', (e) => {
  if (!state.isInitialized || state.isInBreak) return
  state.isDrawing = true
  const pos = getMousePos(e)
  const color = colorPicker.value
  drawPixel(pos.x, pos.y, color, markRadius)
  sendPixelMessage(pos.x, pos.y, color, markRadius)
})

canvas.addEventListener('mousemove', (e) => {
  if (!state.isInitialized || state.isInBreak) return
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

// Tab event listeners
drawTab.addEventListener('click', () => switchTab('draw'))
finishedTab.addEventListener('click', () => switchTab('finished'))

// Initialize the game to start at level 1
state.currentLevel = 0
startLevel(state.currentLevel)

// Start the RAF loop that updates based on state.startedAt
updateGameState()
