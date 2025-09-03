import type { PartySocket } from 'partysocket'
import { onClientIdUpdated } from './core-events'

export type UseMyIdOptions = {
  socket?: PartySocket
}

export const useMyId = (options?: Partial<UseMyIdOptions>) => {
  const { socket = window.socket } = options || {}
  // console.log('Socket ID:', socket.id)
  let myId: string = socket.id
  onClientIdUpdated((clientId) => {
    // console.log('My ID updated:', clientId)
    myId = clientId
  }, socket)
  return {
    getMyId: () => myId,
  }
}

export const onMyIdUpdated = onClientIdUpdated
