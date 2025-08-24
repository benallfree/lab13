export type BotPluginApi = {
  botIds: () => string[]
  clientType: () => 'player' | 'bot'
}

export type BotPluginOptions = {
  isBot?: boolean
}

export const bot = (options: BotPluginOptions = {}) => {
  const { isBot: initialIsBot = false } = options
  const botIds = new Set<string>()
  let isBot = initialIsBot

  return (client: any) => {
    const socket = client.socket

    // Set up event listeners for bot management
    socket.addEventListener('lab-command', (event: any) => {
      const labCommand = event.detail
      switch (labCommand[0]) {
        case 'b':
          const botId = labCommand.slice(1)
          botIds.add(botId)
          console.log('got bot')
          socket.dispatchEvent(new CustomEvent('bot-ids-updated', { detail: Array.from(botIds) }))
          break
        case '.':
          if (labCommand[1] === 'i') {
            const responseData = labCommand.slice(2)
            const [newClientId, isBotFlag] = responseData.split('|')

            if (newClientId) {
              if (isBotFlag) {
                botIds.add(newClientId)
              } else {
                botIds.delete(newClientId)
              }

              socket.dispatchEvent(new CustomEvent('bot-ids-updated', { detail: Array.from(botIds) }))
            }
          }
          break
      }
    })

    socket.addEventListener('client-disconnected', (event: any) => {
      const disconnectedClientId = event.detail
      botIds.delete(disconnectedClientId)
      socket.dispatchEvent(new CustomEvent('bot-ids-updated', { detail: Array.from(botIds) }))
    })

    socket.addEventListener('player-id-updated', (event: any) => {
      const assignedPlayerId = event.detail
      if (isBot) {
        client.sendToAll(`_b${assignedPlayerId}`)
      }
    })

    // Set bot status
    const setBotStatus = (botStatus: boolean) => {
      isBot = botStatus
    }

    // Extend the client with bot functionality
    const botApi: BotPluginApi = {
      botIds: () => Array.from(botIds),
      clientType: () => (isBot ? 'bot' : 'player'),
    }

    // Return the plugin's public API
    return {
      ...botApi,
      setBotStatus,
    }
  }
}
