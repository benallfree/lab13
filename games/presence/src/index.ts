import type { PartySocket as PartySocketType } from 'partysocket'
import van from 'vanjs-core'
import {
  onClientIdUpdated,
  onClientJoined,
  onClientLeft,
  onClose,
  onIdentReceived,
  onOpen,
  sendIdentToClient,
} from './online'

declare global {
  interface Window {
    PartySocket: typeof PartySocketType
    socket: PartySocketType
  }
}

function setStatus(message: string, dot: string = `var(--ok)`) {
  console.log(`[${myClientId}] setStatus`, message, dot)
  status.val = {
    dot,
    message,
  }
}

window.socket = new window.PartySocket({
  host: 'relay.js13kgames.com',
  party: 'mewsterpiece',
  room: 'presence',
})

onClientJoined((clientId) => {
  console.log(`[${myClientId}] client joined`, clientId)
  clientIds.val = [...clientIds.val.filter((id) => id !== clientId), clientId]
  if (myClientId) {
    sendIdentToClient(clientId, myClientId)
  }
})
onClientLeft((clientId) => {
  console.log(`[${myClientId}] client left`, clientId)
  clientIds.val = clientIds.val.filter((id) => id !== clientId)
})

onIdentReceived((fromClientId) => {
  console.log(`[${myClientId}] ident received from`, fromClientId)
  clientIds.val = [...clientIds.val.filter((id) => id !== fromClientId), fromClientId]
})

let myClientId: string | null = null
onClientIdUpdated((clientId) => {
  console.log(`[${myClientId}] player id updated`, clientId)
  setStatus(`id: ${clientId}`)
  myClientId = clientId
})

onOpen(() => setStatus('Connected', `var(--ok)`))
onClose(() => setStatus('Disconnected', `var(--bad)`))

const clientIds = van.state<string[]>([])
const status = van.state({
  dot: `var(--warn)`,
  message: 'Connecting…',
})

const { div, main, span, h1, p } = van.tags

const App = () => {
  return main(
    { class: 'wrap' },
    h1('Presence Demo'),
    div(
      { class: 'status', role: 'status', 'aria-live': 'polite' },
      () => span({ id: 'status-dot', 'aria-hidden': 'true', style: `background: ${status.val.dot}` }),
      () => span({ id: 'status-text' }, status.val.message)
    ),
    p(
      'This demo shows how to register an active player with Lab 13 using minimal code. Opening this page establishes a WebSocket connection and registers your presence in the "presence" room.'
    ),
    p({ class: 'muted' }, 'Keep this tab open to remain online.'),
    div({ class: 'client-ids-section' }, span({ class: 'client-ids-title' }, 'Client Ids'), () =>
      div(
        { id: 'client-ids', class: 'client-ids-list' },
        ...clientIds.val.map((id) => div({ class: 'client-id-item' }, id))
      )
    )
  )
}
van.add(document.getElementById('app')!, App())
