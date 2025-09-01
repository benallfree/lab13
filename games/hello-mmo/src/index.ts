import { onClose, onError, onMyIdUpdated, onOpen, useMyId, useOnline } from 'lab13-sdk'
import './style.css'

useOnline(`mewsterpiece/empty`)
const { getMyId } = useMyId()

// Status indicator state
let connectionStatus = 'Connecting...'
let clientId = getMyId()

// Create status indicator UI
const statusIndicator = document.createElement('div')
statusIndicator.className = 'status-indicator'
statusIndicator.innerHTML = `
  <div class="status-dot"></div>
  <div class="status-text">
    <div class="connection-status">${connectionStatus}</div>
    <div class="client-id">ID: ${clientId}</div>
  </div>
`
document.body.appendChild(statusIndicator)

// Update status display function
const updateStatus = () => {
  const statusDot = statusIndicator.querySelector('.status-dot') as HTMLElement
  const statusText = statusIndicator.querySelector('.connection-status') as HTMLElement
  const clientIdText = statusIndicator.querySelector('.client-id') as HTMLElement

  statusText.textContent = connectionStatus
  clientIdText.textContent = `ID: ${clientId}`

  // Update dot color based on status
  statusDot.className = 'status-dot'
  if (connectionStatus === 'Connected') {
    statusDot.classList.add('connected')
  } else if (connectionStatus === 'Disconnected' || connectionStatus === 'Error') {
    statusDot.classList.add('disconnected')
  } else {
    statusDot.classList.add('connecting')
  }
}

onOpen(() => {
  console.log('Connected to server')
  connectionStatus = 'Connected'
  updateStatus()
})

onClose(() => {
  console.log('Disconnected from server')
  connectionStatus = 'Disconnected'
  updateStatus()
})

onError(() => {
  console.log('Error')
  connectionStatus = 'Error'
  updateStatus()
})

onMyIdUpdated((myId) => {
  console.log('My ID updated', myId)
  clientId = myId
  updateStatus()
})
