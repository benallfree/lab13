import { StateBase, StateDelta } from '.'
import { labCommand, onCommandMessage } from '../command'
import { PartialDeep } from './merge'

export const onStateDeltaMessage = <TStateShape extends StateBase>(
  callback: (delta: StateDelta<TStateShape>) => void,
  socket = window.socket
) => {
  const wrappedCallback = (data: string) => {
    const delta = JSON.parse(data)
    callback(delta as PartialDeep<TStateShape>)
  }
  onCommandMessage(labCommand(`d`), wrappedCallback, socket)
}
