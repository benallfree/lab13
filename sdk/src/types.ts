// Type definitions
export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P]
}

export type DeltaEvaluator<TState = GameState> = (
  delta: PartialDeep<TState>,
  remoteState: PartialDeep<TState>,
  playerId?: string
) => boolean

export type DeltaNormalizer<TState = GameState> = (delta: PartialDeep<TState>) => PartialDeep<TState>

export interface ClientOptions<TState = GameState> {
  host?: string
  party?: string
  deltaNormalizer?: DeltaNormalizer<TState>
  deltaEvaluator?: DeltaEvaluator<TState>
  throttleMs?: number
  debug?: boolean
}

export interface MessageData {
  id?: string
  connect?: string
  disconnect?: string
  state?: any
  delta?: any
}

export type GameState = Record<string, any>

export type GetPlayerState<TState extends GameState> = TState['players'][string]

export type EventCallback = (data?: any) => void
