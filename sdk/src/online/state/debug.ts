export const mkdbg =
  (id: string, debug: boolean) =>
  (...args: any[]) => {
    if (!debug) return
    console.log(`[${id}]`, ...args)
  }
