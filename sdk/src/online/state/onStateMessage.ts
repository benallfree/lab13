import { StateBase } from '.'
import { labCommand, onCommandMessage } from '../command'

export const onStateMessage = <TStateShape extends StateBase>(
  callback: (state: TStateShape) => void,
  socket = window.socket
) => {
  const wrappedCallback = (data: string) => {
    const state = JSON.parse(data)
    callback(state as TStateShape)
  }
  onCommandMessage(labCommand(`s`), wrappedCallback, socket)
}
