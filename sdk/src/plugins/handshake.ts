import { labMessage, labQuery } from '..'

export type HandshakePluginOptions = {
  timeoutMs?: number
  prepareState?: (state: any) => Promise<any>
}

export type HandshakePluginApi = {
  state: () => any
  clientIds: () => string[]
}

export const handshake = (options: HandshakePluginOptions = {}) => {
  const { timeoutMs = 1000, prepareState = (state: any) => Promise.resolve(state) } = options

  let state: any = null
  let clientIds = new Set<string>()
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let stateRequested = false

  return (client: any) => {
    const socket = client.socket

    // Function to start timeout after we have our own ID
    const startTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        if (!state) {
          // Timeout reached without getting state, trigger handshake success anyway
          socket.dispatchEvent(new CustomEvent('handshake-success', { detail: null }))
        }
      }, timeoutMs)
    }
    startTimeout()

    const requestStateFromClient = (clientId: string) => {
      client.sendToClient(clientId, labQuery(`s${client.clientId()}`))
    }

    const onLabCommand = (command: string, callback: (event: any) => void) => {
      socket.addEventListener('lab-message', (event: any) => {
        const message = event.detail
        if (command === message[0]) {
          callback(message.slice(1))
        }
      })
    }

    const onLabSubcommand = (command: string, subcommand: string, callback: (event: any) => void) => {
      onLabCommand(command, (data) => {
        if (data[0] === subcommand) {
          callback(data.slice(1))
        }
      })
    }

    // Remote client ident
    onLabCommand('i', (newClientId) => {
      if (!newClientId) return
      // If this is the frist client we've seen, request state from them
      if (clientIds.size === 0) {
        requestStateFromClient(newClientId)
      }
      clientIds.add(newClientId)
      socket.dispatchEvent(new CustomEvent('client-ids-updated', { detail: Array.from(clientIds) }))
    })

    // Remote client state
    onLabCommand('s', (stateData) => {
      if (!stateData) return
      state = stateData
      socket.dispatchEvent(new CustomEvent('handshake-success', { detail: state }))
    })

    // Remote client state request
    onLabSubcommand('?', 's', (replyId) => {
      if (state) {
        return // we don't have any state, ignore
      }
      prepareState(state).then((preparedState) => {
        client.sendToClient(replyId, labMessage(`s${JSON.stringify(preparedState)}`))
      })
    })

    // A client has connected to the party, record their ID and send our ID to them
    socket.addEventListener('client-connected', (event: any) => {
      const newClientId = event.detail
      clientIds.add(newClientId)
      if (state) {
        // if we have state, we are ready to announce ourselves to the new client
        client.sendToClient(newClientId, labMessage(`i${client.clientId()}`)) // send our ID to the new client
      }
      socket.dispatchEvent(new CustomEvent('client-ids-updated', { detail: Array.from(clientIds) }))
    })

    socket.addEventListener('client-disconnected', (event: any) => {
      const disconnectedClientId = event.detail
      clientIds.delete(disconnectedClientId)
      socket.dispatchEvent(new CustomEvent('client-ids-updated', { detail: Array.from(clientIds) }))
    })

    // Extend the client with handshake functionality
    const handshakeApi: HandshakePluginApi = {
      state: () => state,
      clientIds: () => Array.from(clientIds),
    }

    return handshakeApi
  }
}
