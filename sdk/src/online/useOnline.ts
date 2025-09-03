import { generateUUID } from './generateUUID'
import { useHead } from './head'

export type OnlineOptions = {
  host?: string
  global?: boolean
}
export const useOnline = (room: string, options?: Partial<OnlineOptions>) => {
  useHead()
  const roomParts = room.split('/')
  const { host = 'relay.js13kgames.com', global = true } = options || {}
  const socket = new window.PartySocket({
    host,
    party: roomParts[0],
    room: roomParts.join('/'),
    id: generateUUID(),
  })
  if (global) {
    window.socket = socket
  }
  return socket
}
