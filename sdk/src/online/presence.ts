import { labCommand, onCommandMessage, sendCommandMessageToClient } from './command'
import { onClientIdUpdated, onClientJoined } from './core-events'

export const sendIdentToClient = (recipientClientId: string, clientId: string, socket = window.socket) => {
  sendCommandMessageToClient(recipientClientId, labCommand(`i`), clientId, socket)
}
export const onIdentReceived = (callback: (fromClientId: string) => void, socket = window.socket) => {
  onCommandMessage(labCommand(`i`), callback, socket)
}
export const usePresence = (socket = window.socket) => {
  onClientJoined((clientId) => {
    console.log(`[${myClientId}] client joined`, clientId)
    if (myClientId) {
      sendIdentToClient(clientId, myClientId, socket)
    }
  }, socket)

  let myClientId: string | null = null
  onClientIdUpdated((clientId) => {
    console.log(`[${myClientId}] player id updated`, clientId)
    myClientId = clientId
  }, socket)
}
