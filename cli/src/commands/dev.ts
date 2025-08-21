import { js13kViteConfig } from 'js13k-vite-plugins'
import { createServer as createViteServer } from 'vite'

export async function runDev(): Promise<void> {
  const config = js13kViteConfig()
  const server = await createViteServer(config as any)
  await server.listen()

  if (typeof (server as any).printUrls === 'function') {
    ;(server as any).printUrls()
  }
}
