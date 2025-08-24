import type { PartySocket } from 'partysocket'

declare global {
  interface Window {
    socket: PartySocket
  }
}

export const onOpen = (callback: () => void, socket = window.socket) => {
  socket.addEventListener('open', callback)
}
export const onClose = (callback: () => void, socket = window.socket) => {
  socket.addEventListener('close', callback)
}
export const onCommandMessage = (command: string, callback: (data: string) => void, socket = window.socket) => {
  socket.addEventListener('message', (event) => {
    const data = event.data.toString()
    if (data.startsWith(command)) {
      callback(data.slice(command.length))
    }
  })
}
export const sendMessage = (message: string, socket = window.socket) => {
  socket.send(message)
}
export const sendMessageToClient = (clientId: string, message: string, socket = window.socket) => {
  sendMessage(`@${clientId}|${message}`, socket)
}
export const sendCommandMessageToClient = (clientId: string, command: string, data: string, socket = window.socket) => {
  sendMessageToClient(clientId, `${command}${data}`, socket)
}
export const sendCommandMessageToAll = (command: string, data: string, socket = window.socket) => {
  sendMessage(`${command}${data}`, socket)
}
export const onClientJoined = (callback: (clientId: string) => void, socket = window.socket) => {
  onCommandMessage(`+`, callback, socket)
}
export const onClientLeft = (callback: (clientId: string) => void, socket = window.socket) => {
  onCommandMessage(`-`, callback, socket)
}
export const onClientIdUpdated = (callback: (myClientId: string) => void, socket = window.socket) => {
  onCommandMessage(`@`, callback, socket)
}
const labCommand = (command: string) => `_${command}`
export const sendIdentToClient = (recipientClientId: string, clientId: string, socket = window.socket) => {
  sendCommandMessageToClient(recipientClientId, labCommand(`i`), clientId, socket)
}
export const onIdentReceived = (callback: (fromClientId: string) => void, socket = window.socket) => {
  onCommandMessage(labCommand(`i`), callback, socket)
}

export {}
