declare module 'tiged' {
  interface TigedOptions {
    force?: boolean
    verbose?: boolean
    cache?: boolean
    mode?: 'tar' | 'git'
    [key: string]: any
  }

  interface TigedEmitter {
    clone(dest: string): Promise<void>
    on(event: string, listener: (...args: any[]) => void): TigedEmitter
    removeListener(event: string, listener: (...args: any[]) => void): TigedEmitter
  }

  function tiged(source: string, options?: TigedOptions): TigedEmitter

  export default tiged
}
