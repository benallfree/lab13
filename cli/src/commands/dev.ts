import { createServer as createViteServer, type Plugin } from 'vite'
import { runBuild, type BuildOptions } from './build-cmd'
import { LAB13_BUILD_DIR } from './build-cmd/utils'

const devPlugin = (options: BuildOptions): Plugin => {
  const { debug = false } = options || {}
  const dbg = (...args: any[]) => (debug ? console.log(`[DEBUG]`, ...args) : undefined)

  let isBuilding = false
  return {
    name: 'js13k-dev',
    async watchChange(id, change) {
      if (id.endsWith(`.zip`)) return
      if (id.includes(`/${LAB13_BUILD_DIR}/`)) return
      if (isBuilding) return
      isBuilding = true
      dbg(`${id}`, change)
      await runBuild(options)
        .catch((err) => {
          console.error(`${err}`)
        })
        .finally(() => {
          setTimeout(() => {
            dbg(`${id} releasing lock`)
            isBuilding = false
          }, 100)
        })
    },
  }
}

export async function runDev(options: BuildOptions): Promise<void> {
  const { debug = false } = options || {}
  const server = await createViteServer({
    clearScreen: false,
    plugins: [devPlugin(options)],
  })
  await server.listen()

  if (typeof (server as any).printUrls === 'function') {
    ;(server as any).printUrls()
  }

  // Build initially on start
  await runBuild(options).catch((err) => {
    console.error(`Initial build failed: ${err}`)
  })
}
