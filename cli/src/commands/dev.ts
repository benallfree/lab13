import { createServer as createViteServer } from 'vite'

export async function runDev(): Promise<void> {
  const server = await createViteServer({})
  await server.listen()

  if (typeof (server as any).printUrls === 'function') {
    ;(server as any).printUrls()
  }
}
