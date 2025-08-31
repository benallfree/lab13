import { sendMessage, sendMessageToClient } from './message'

export const onCommandMessage = (command: string, callback: (data: string) => void, socket = window.socket) => {
  socket.addEventListener('message', (event) => {
    const data = event.data.toString()
    if (data.startsWith(command)) {
      callback(data.slice(command.length))
    }
  })
}

export const sendCommandMessageToClient = (clientId: string, command: string, data: string, socket = window.socket) => {
  sendMessageToClient(clientId, `${command}${data}`, socket)
}
export const sendCommandMessageToAll = (command: string, data: string, socket = window.socket) => {
  sendMessage(`${command}${data}`, socket)
}
export const labCommand = (command: string) => `_${command}`
