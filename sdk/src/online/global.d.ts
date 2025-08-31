import type { PartySocket } from 'partysocket'

declare global {
  interface Window {
    PartySocket: typeof PartySocket
    socket: PartySocket
  }
}
