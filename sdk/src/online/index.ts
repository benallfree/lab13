export * from './command'
export * from './core-events'
export * from './deepCopy'
export * from './generateUUID'
export * from './message'
export * from './myId'
export * from './presence'
export * from './socket'
export * from './state'

export type OnlineOptions = {
  host?: string
  global?: boolean
}
export const useOnline = (room: string, options?: Partial<OnlineOptions>) => {
  const roomParts = room.split('/')
  const { host = 'relay.js13kgames.com', global = true } = options || {}
  const socket = new window.PartySocket({
    host,
    party: roomParts[0],
    room: roomParts.join('/'),
  })
  if (global) {
    window.socket = socket
  }
  return socket
}
