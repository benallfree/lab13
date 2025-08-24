import { PartySocket as PartySocketType } from 'partysocket'

declare global {
  interface Window {
    PartySocket: typeof PartySocketType
  }
}

export {}
