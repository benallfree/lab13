import {
  onClientJoined,
  onClose,
  onCommandMessage,
  onError,
  onOpen,
  PLAYER_ENTITY_COLLECTION_KEY,
  sendCommandMessageToAll,
  sendCommandMessageToClient,
  useEasyState,
  useMyId,
  useOnline,
} from 'lab13-sdk'
import { playDrawSound, playPlopSound, playWhiteNoiseSound } from './fx'
import { levelEndSong, levels } from './levels'
import {
  addColorToHistory,
  clearAllCompletedPictures,
  deleteCompletedPicture,
  getCurrentGameState,
  localState,
  saveCompletedPicture,
  savePlayerName,
} from './state'
import './style.css'

useOnline('mewsterpiece')
// usePresence()

// Player state for remote cursors
type PlayerState = {
  mouseX: number
  mouseY: number
  brushSize: number
  brushColor: string
  playerName: string
}

type GameStateShape = {
  [PLAYER_ENTITY_COLLECTION_KEY]: { [key: string]: PlayerState }
}

const { getMyId } = useMyId()
const { updateMyState, getPlayerStates } = useEasyState<GameStateShape>({})

// Function to render all cursors (local and remote)
function renderAllCursors() {
  // Clear the cursor overlay canvas
  cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height)

  const playerStates = getPlayerStates() as { [playerId: string]: PlayerState }
  const canvasRect = canvas.getBoundingClientRect()

  // Draw all player cursors on overlay canvas
  Object.entries(playerStates).forEach(([playerId, playerState]) => {
    if (playerState.mouseX !== undefined && playerState.mouseY !== undefined) {
      cursorCtx.save()

      // Convert canvas-relative coordinates to viewport coordinates
      const viewportX = canvasRect.left + playerState.mouseX
      const viewportY = canvasRect.top + playerState.mouseY

      // Add subtle pulsing animation
      const time = Date.now() * 0.003
      const pulse = 0.95 + 0.05 * Math.sin(time + playerId.charCodeAt(0))

      // Draw cursor circle with pulse effect
      cursorCtx.beginPath()
      cursorCtx.arc(viewportX, viewportY, (playerState.brushSize || 5) * pulse, 0, Math.PI * 2)
      cursorCtx.strokeStyle = playerState.brushColor || '#000000'
      cursorCtx.lineWidth = 2
      cursorCtx.stroke()

      // Add player name label
      cursorCtx.globalAlpha = 1
      cursorCtx.fillStyle = '#ffffff'
      cursorCtx.strokeStyle = '#000000'
      cursorCtx.lineWidth = 2
      cursorCtx.font = '12px Arial'
      const text = playerState.playerName || `P${playerId.slice(-2)}` // Show player name or fallback to ID
      const textMetrics = cursorCtx.measureText(text)
      const textX = viewportX - textMetrics.width / 2
      const textY = viewportY - (playerState.brushSize || 5) - 5

      cursorCtx.strokeText(text, textX, textY)
      cursorCtx.fillText(text, textX, textY)

      cursorCtx.restore()
    }
  })
}

// Update all cursors from player states
function updateAllCursors() {
  renderAllCursors()
}

// Function to switch songs when level changes
function switchToLevelSong(levelIndex: number) {
  console.log('switchToLevelSong called for level', levelIndex, 'currentSong:', localState.currentSong)

  // Stop the current song if it exists
  if (localState.currentSong) {
    console.log('Stopping current song in switchToLevelSong')
    localState.currentSong.stop()
    localState.currentSong = null
  }

  // Start the new song for the level
  const newSong = levels[levelIndex].song
  console.log('Starting new song for level', levelIndex)
  newSong.play({})
  localState.currentSong = newSong
}

// Function to play level ending song
function playLevelEndSong() {
  console.log('playLevelEndSong called, currentSong:', localState.currentSong)

  // Stop the current level song if it exists
  if (localState.currentSong) {
    console.log('Stopping current song')
    localState.currentSong.stop()
    localState.currentSong = null
  }

  // Play the level ending song once (no loop)
  console.log('Playing level ending song')
  levelEndSong.play({ loop: false, noteLengthMs: 100 })
}

// Splash page logic
function startGame() {
  // Get player name from input (if available)
  const playerName = playerNameInput?.value.trim() || 'Anonymous'
  console.log('Player name:', playerName)

  // Save player name to localStorage and update local state
  savePlayerName(playerName)

  // Hide splash page
  splashPage.classList.add('hidden')

  // Start the song for level 0
  switchToLevelSong(0)

  // Initialize canvas state
  localState.isInitialized = true

  // Initialize color history
  renderColorHistory()

  // Start the game loop
  updateGameState()

  // Initialize the game to start at level 1
  startLevel(localState.currentLevel)
}

// Event listener will be added after DOM elements are declared

const sendStateToClient = (clientId: string) => {
  const canvasDataUrl = canvas.toDataURL('image/webp')
  console.log('Sending state to client', clientId, 'canvas data length:', canvasDataUrl.length)
  sendCommandMessageToClient(clientId, `s`, JSON.stringify({ ...localState.shared, img: canvasDataUrl }))
}
const onStateMessage = (callback: (data: string) => void) => {
  onCommandMessage(`s`, callback)
}
onStateMessage((data) => {
  localState.shared = JSON.parse(data)
  const currentState = getCurrentGameState()
  console.log('Current state:', currentState)
  // Don't set localState.currentLevel here - let updateGameState() handle level transitions

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
  img.src = localState.shared.img
  console.log('Set image src, length:', localState.shared.img ? localState.shared.img.length : 'null/undefined')
})
onClientJoined((clientId) => {
  console.log('Client joined:', clientId)
  sendStateToClient(clientId)
})
const onPixelMessage = (callback: (data: string) => void) => {
  onCommandMessage(`p`, callback)
}
onPixelMessage((data) => {
  if (localState.isInBreak) return // Don't accept pixel events during breaks
  const [x, y, color, radius] = data.split('|')
  drawPixel(Number(x), Number(y), color, Number(radius))
})
export const sendPixelMessage = (x: number, y: number, color: string, radius: number) => {
  sendCommandMessageToAll(`p`, `${x}|${y}|${color}|${radius}`)
}
function requestPeerState() {
  sendCommandMessageToAll('?s', getMyId())
}

onCommandMessage('?s', (clientId) => {
  console.log('requestPeerState called', clientId)
  sendStateToClient(clientId)
})

// Canvas and painting setup
export const canvas = document.getElementById('canvas') as HTMLCanvasElement
export const ctx = canvas.getContext('2d')!

// Create overlay canvas for cursors
const cursorCanvas = document.createElement('canvas')
cursorCanvas.width = window.innerWidth
cursorCanvas.height = window.innerHeight
cursorCanvas.style.position = 'fixed'
cursorCanvas.style.top = '0'
cursorCanvas.style.left = '0'
cursorCanvas.style.pointerEvents = 'none'
cursorCanvas.style.zIndex = '10001'
const cursorCtx = cursorCanvas.getContext('2d')!
document.body.appendChild(cursorCanvas)

// Function to resize cursor overlay when window resizes
function resizeCursorOverlay() {
  cursorCanvas.width = window.innerWidth
  cursorCanvas.height = window.innerHeight
}

// Update cursor overlay size when window resizes
window.addEventListener('resize', resizeCursorOverlay)

const colorPicker = document.getElementById('colorPicker') as HTMLInputElement
const colorHistory = document.getElementById('colorHistory') as HTMLDivElement
const radiusSlider = document.getElementById('radiusSlider') as HTMLInputElement
const radiusValue = document.getElementById('radiusValue') as HTMLSpanElement
const statusIndicator = document.getElementById('statusIndicator') as HTMLDivElement
const statusText = document.getElementById('statusText') as HTMLSpanElement

// Splash page elements
const splashPage = document.getElementById('splashPage') as HTMLDivElement
const startGameBtn = document.getElementById('startGameBtn') as HTMLButtonElement
const playerNameInput = document.getElementById('playerNameInput') as HTMLInputElement

// Pre-populate player name input with saved value
if (playerNameInput && localState.playerName && localState.playerName !== 'Anonymous') {
  playerNameInput.value = localState.playerName
}

// Add event listener for start game button
startGameBtn.addEventListener('click', startGame)

// Level system elements
const timerDisplay = document.getElementById('timerDisplay') as HTMLSpanElement
const levelDisplay = document.getElementById('levelDisplay') as HTMLSpanElement

// Tab elements
const drawTab = document.getElementById('drawTab') as HTMLButtonElement
const archiveTab = document.getElementById('archiveTab') as HTMLButtonElement
const drawContent = document.getElementById('drawContent') as HTMLDivElement
const archiveContent = document.getElementById('archiveContent') as HTMLDivElement
const galleryGrid = document.getElementById('galleryGrid') as HTMLDivElement

// Create break overlay
const breakOverlay = document.createElement('div')
breakOverlay.style.position = 'absolute'
breakOverlay.style.top = '50%'
breakOverlay.style.left = '50%'
breakOverlay.style.transform = 'translate(-50%, -50%)'
breakOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'
breakOverlay.style.color = 'white'
breakOverlay.style.padding = '30px'
breakOverlay.style.borderRadius = '12px'
breakOverlay.style.fontSize = '16px'
breakOverlay.style.fontWeight = 'bold'
breakOverlay.style.zIndex = '100'
breakOverlay.style.display = 'none'
breakOverlay.style.textAlign = 'center'
breakOverlay.style.minWidth = '300px'
breakOverlay.style.maxWidth = '500px'
canvas.parentElement?.appendChild(breakOverlay)

// Break overlay content elements
const breakTitle = document.createElement('div')
breakTitle.style.fontSize = '20px'
breakTitle.style.marginBottom = '15px'
breakTitle.textContent = 'BREAK TIME - No Drawing Allowed'

const breakMessage = document.createElement('div')
breakMessage.style.fontSize = '14px'
breakMessage.style.marginBottom = '20px'
breakMessage.style.color = '#e5e7eb'

const breakThumbnail = document.createElement('img')
breakThumbnail.style.maxWidth = '200px'
breakThumbnail.style.maxHeight = '150px'
breakThumbnail.style.borderRadius = '8px'
breakThumbnail.style.marginBottom = '15px'
breakThumbnail.style.border = '2px solid #374151'
breakThumbnail.style.backgroundColor = 'white'
breakThumbnail.style.padding = '10px'
breakThumbnail.style.display = 'block'
breakThumbnail.style.marginLeft = 'auto'
breakThumbnail.style.marginRight = 'auto'

const downloadButton = document.createElement('button')
downloadButton.style.backgroundColor = '#10b981'
downloadButton.style.color = 'white'
downloadButton.style.border = 'none'
downloadButton.style.padding = '10px 20px'
downloadButton.style.borderRadius = '6px'
downloadButton.style.fontSize = '14px'
downloadButton.style.fontWeight = 'bold'
downloadButton.style.cursor = 'pointer'
downloadButton.style.marginBottom = '10px'
downloadButton.style.display = 'block'
downloadButton.style.marginLeft = 'auto'
downloadButton.style.marginRight = 'auto'
downloadButton.textContent = '⬇️ Download Image'

breakOverlay.appendChild(breakTitle)
breakOverlay.appendChild(breakMessage)
breakOverlay.appendChild(breakThumbnail)
breakOverlay.appendChild(downloadButton)

// Set up canvas for pixel-perfect drawing
ctx.imageSmoothingEnabled = false

// --- Custom cursor ---
function updateCursor() {
  // Use default crosshair cursor since we're rendering cursors on canvas
  canvas.style.cursor = 'crosshair'
}

// Visual size of a painted mark (radius in pixels)
let markRadius = Number(radiusSlider?.value ?? 5)
if (radiusValue) radiusValue.textContent = String(markRadius)
radiusSlider?.addEventListener('input', () => {
  markRadius = Number(radiusSlider.value)
  if (radiusValue) radiusValue.textContent = String(markRadius)
  updateCursor()

  // Update player state with new brush size
  updateMyState({
    brushSize: markRadius,
    playerName: localState.playerName,
  })
})

colorPicker?.addEventListener('change', () => {
  playPlopSound()
  updateCursor()

  // Add color to history (only when picker is closed)
  addColorToHistory(colorPicker.value)
  renderColorHistory()

  // Update player state with new brush color
  updateMyState({
    brushColor: colorPicker.value,
    playerName: localState.playerName,
  })
})

// Color history functions
function renderColorHistory() {
  colorHistory.innerHTML = ''

  localState.colorHistory.forEach((color) => {
    const colorItem = document.createElement('div')
    colorItem.className = 'color-history-item'
    colorItem.style.backgroundColor = color
    colorItem.title = color

    colorItem.addEventListener('click', () => {
      colorPicker.value = color
      playPlopSound()
      updateCursor()

      // Update player state with new brush color
      updateMyState({
        brushColor: color,
        playerName: localState.playerName,
      })
    })

    colorHistory.appendChild(colorItem)
  })
}

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
  localState.hasDrawnPixels = true
}

// Tab functionality
function switchTab(tabName: 'draw' | 'archive') {
  // Update tab buttons
  drawTab.classList.toggle('active', tabName === 'draw')
  archiveTab.classList.toggle('active', tabName === 'archive')

  // Update tab content
  drawContent.classList.toggle('active', tabName === 'draw')
  archiveContent.classList.toggle('active', tabName === 'archive')

  // Update gallery if switching to archive tab
  if (tabName === 'archive') {
    updateGallery()
  }
}

// Gallery functionality
function updateGallery() {
  galleryGrid.innerHTML = ''

  // Add clear all button if there are pictures
  if (localState.completedPictures.size > 0) {
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

  if (localState.completedPictures.size === 0) {
    galleryGrid.innerHTML = `
      <div class="gallery-empty">
        <h3>No completed pictures yet</h3>
        <p>Complete some levels to see your artwork here!</p>
      </div>
    `
    return
  }

  // Convert to array and sort by completion date (newest first)
  const completedPictures = Array.from(localState.completedPictures.entries()).sort(
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

// Update break modal with saved image
function updateBreakModal(imageData: string, catName: string, levelIndex: number) {
  breakMessage.textContent = `Your ${catName} image has been saved! You can download it below.`
  breakThumbnail.src = imageData
  breakThumbnail.alt = `Level ${levelIndex + 1}: ${catName}`

  // Set up download button functionality
  downloadButton.onclick = () => {
    downloadImage(imageData, `mewsterpiece-level-${levelIndex + 1}-${catName}.png`)
  }
}

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function startLevel(levelIndex: number) {
  localState.currentLevel = levelIndex
  localState.hasDrawnPixels = false // Reset drawn pixels flag for new level
  const cat = levels[levelIndex].cat

  console.log('startLevel called', levelIndex)
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Render the base outline for the level
  renderLevelBackground(levelIndex)

  // Update displays
  levelDisplay.textContent = `Level ${levelIndex + 1}: ${cat.name}`

  requestPeerState()
}

function updateGameState() {
  const gameState = getCurrentGameState()

  // Update current level if it changed
  if (gameState.currentLevel !== localState.currentLevel) {
    console.log('Level changing from', localState.currentLevel, 'to', gameState.currentLevel)

    localState.currentLevel = gameState.currentLevel
    localState.hasDrawnPixels = false // Reset drawn pixels flag for new level
    const cat = levels[localState.currentLevel].cat

    // Switch to the new level's song
    switchToLevelSong(localState.currentLevel)

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Render the base outline for the level
    renderLevelBackground(localState.currentLevel)

    // Update displays
    levelDisplay.textContent = `Level ${localState.currentLevel + 1}: ${cat.name}`
  }

  // Update timer display
  if (gameState.isInLevel) {
    localState.timeRemaining = gameState.timeRemaining
    localState.isInLevel = true
    localState.isInBreak = false
    timerDisplay.textContent = formatTime(localState.timeRemaining)
    canvas.style.opacity = '1'
    breakOverlay.style.display = 'none'
  } else if (gameState.isInBreak) {
    // Check if we just transitioned from level to break (level just ended)
    if (!localState.isInBreak) {
      console.log('Level ended, playing ending song')
      playLevelEndSong()

      // Save the completed picture to local storage at the beginning of break
      if (localState.isInitialized) {
        const canvasDataUrl = canvas.toDataURL('image/webp')
        const cat = levels[localState.currentLevel].cat
        saveCompletedPicture(localState.currentLevel, canvasDataUrl, cat.name)

        // Update break modal with saved image
        updateBreakModal(canvasDataUrl, cat.name, localState.currentLevel)

        // Update gallery if we're on the archive tab
        if (archiveContent.classList.contains('active')) {
          updateGallery()
        }
      }
    }

    localState.isInLevel = false
    localState.isInBreak = true
    localState.breakTimeRemaining = gameState.breakTimeRemaining
    timerDisplay.textContent = `Next level in ${Math.ceil(localState.breakTimeRemaining / 1000)}...`
    canvas.style.opacity = '0.5'
    breakOverlay.style.display = 'block'
  }

  // Auto-complete level when timer runs out
  if (
    gameState.isInLevel &&
    gameState.timeRemaining <= 0 &&
    !Array.from(localState.completedPictures.values()).some((p) => p.levelIndex === gameState.currentLevel)
  ) {
    completeLevel()
  }

  // Update remote cursors
  updateAllCursors()

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
  console.log('completeLevel called')
  // Play level ending song
  playLevelEndSong()

  localState.currentLevel = (localState.currentLevel + 1) % levels.length
  startLevel(localState.currentLevel)

  // Switch to the new level's song
  switchToLevelSong(localState.currentLevel)
}

// Render level background
function renderLevelBackground(levelIndex: number) {
  console.log('Rendering base image for level', levelIndex, '- single player mode')
  const cat = levels[levelIndex].cat

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
  if (!localState.isInitialized || localState.isInBreak) return
  localState.isDrawing = true
  const pos = getMousePos(e)
  const color = colorPicker.value
  drawPixel(pos.x, pos.y, color, markRadius)
  playDrawSound(0.2)
  sendPixelMessage(pos.x, pos.y, color, markRadius)

  // Update player state
  updateMyState({
    mouseX: pos.x,
    mouseY: pos.y,
    brushSize: markRadius,
    brushColor: color,
    playerName: localState.playerName,
  })
})

canvas.addEventListener('mousemove', (e) => {
  if (!localState.isInitialized || localState.isInBreak) return
  const pos = getMousePos(e)
  if (localState.isDrawing) {
    const color = colorPicker.value
    drawPixel(pos.x, pos.y, color, markRadius)
    playWhiteNoiseSound.start(0.005, 5)
    sendPixelMessage(pos.x, pos.y, color, markRadius)
  }

  // Always update player state for cursor position
  updateMyState({
    mouseX: pos.x,
    mouseY: pos.y,
    brushSize: markRadius,
    brushColor: colorPicker.value,
    playerName: localState.playerName,
  })
})

canvas.addEventListener('mouseup', () => {
  localState.isDrawing = false
  playWhiteNoiseSound.stop()

  // Update player state
  updateMyState({
    playerName: localState.playerName,
  })
})

canvas.addEventListener('mouseleave', () => {
  localState.isDrawing = false

  // Update player state
  updateMyState({
    playerName: localState.playerName,
  })
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

  // Initialize player state with current brush settings
  updateMyState({
    mouseX: 0,
    mouseY: 0,
    brushSize: markRadius,
    brushColor: colorPicker.value,
    playerName: localState.playerName,
  })
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
archiveTab.addEventListener('click', () => switchTab('archive'))

// Initialize color history on page load
renderColorHistory()

// Game initialization is now handled by the splash page startGame function
