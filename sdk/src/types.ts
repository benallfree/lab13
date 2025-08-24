export type GameState = Record<string, any> & {
  _players?: Record<string, { id: string; [key: string]: any } | null>
  _bots?: Record<string, { id: string; [key: string]: any } | null>
}

export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P]
}
