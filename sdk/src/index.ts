import { Js13kClient } from './Js13kClient'

export { Js13kClient } from './Js13kClient'
export { connectToJs13kLobby, Js13kLobby } from './Js13kLobby'
export type * from './types'
export { deepClone, generateUUID, mergeState } from './util'

export default Js13kClient

// Also make available globally for non-module usage
declare global {
  interface Window {
    Js13kClient: typeof Js13kClient
  }
}

if (typeof window !== 'undefined') {
  window.Js13kClient = Js13kClient
}
