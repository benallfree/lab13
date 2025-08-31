import { onCommandMessage } from './command'

export const onClientJoined = (callback: (clientId: string) => void, socket = window.socket) => {
  onCommandMessage(`+`, callback, socket)
}
export const onClientLeft = (callback: (clientId: string) => void, socket = window.socket) => {
  onCommandMessage(`-`, callback, socket)
}
export const onClientIdUpdated = (callback: (myClientId: string) => void, socket = window.socket) => {
  onCommandMessage(`@`, callback, socket)
}
export const onMyIdUpdated = onClientIdUpdated
