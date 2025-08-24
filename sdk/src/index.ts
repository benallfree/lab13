import { PartySocket } from 'partysocket'
import { GameState } from './types'

export type Lab13ClientApi = ReturnType<typeof Lab13Client>

export type Lab13ClientOptions<T extends GameState> = {
  plugins?: Array<(client: any) => any>
}

export const labQuery = (query: string) => {
  return labMessage(`?${query}`)
}

export const labReply = (reply: string) => {
  return labMessage(`.${reply}`)
}

export const labMessage = (message: string) => {
  return `_${message}`
}

export const Lab13Client = <T extends GameState>(socket: PartySocket, options?: Partial<Lab13ClientOptions<T>>) => {
  const { plugins = [] } = options || {}
  let clientId: string | null = null

  // Create base client object
  const baseClient = {
    socket,
    clientId: () => clientId,
    sendToClient: (clientId: string, message: string) => {
      socket.send(`@${clientId}|${message}`)
    },
    sendToAll: (message: string) => {
      socket.send(`${message}`)
    },
    on(event: string, callback: (event: Event) => void) {
      socket.addEventListener(event, callback as EventListener)
    },
    off(event: string, callback: (event: Event) => void) {
      socket.removeEventListener(event, callback as EventListener)
    },
  }

  // Apply all plugins
  const pluginResults = plugins.map((plugin) => plugin(baseClient))

  // Merge all plugin APIs into the client
  const client = {
    ...baseClient,
    ...Object.assign({}, ...pluginResults),
  }

  // Bot status is now handled by the bot plugin itself

  // Set up message handling
  socket.addEventListener('message', (event) => {
    const msg = event.data.toString()

    const topCommand = msg[0]
    const topData = msg.slice(1)

    console.log('got message', msg.slice(0, 1))
    switch (topCommand) {
      case '@':
        const assignedClientId = topData
        clientId = assignedClientId
        socket.dispatchEvent(new CustomEvent('client-id-updated', { detail: assignedClientId }))
        break
      case '+':
        const newClientId = topData
        socket.dispatchEvent(new CustomEvent('client-connected', { detail: newClientId }))
        break
      case '-':
        const disconnectedClientId = topData
        socket.dispatchEvent(new CustomEvent('client-disconnected', { detail: disconnectedClientId }))
        break
      case '_':
        const detail = topData
        socket.dispatchEvent(new CustomEvent('lab-message', { detail }))
        break
    }
  })

  return client
}

declare global {
  interface Window {
    Lab13Client: typeof Lab13Client
  }
}

if (typeof window !== 'undefined') {
  window.Lab13Client = Lab13Client
}
