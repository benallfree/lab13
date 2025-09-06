import express from 'express'
import { createServer as createHttpServer } from 'http'
import { createServer as createNetServer } from 'net'

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createNetServer()
    server.listen(port, () => {
      server.close(() => resolve(true))
    })
    server.on('error', () => resolve(false))
  })
}

async function findFreePort(startPort: number): Promise<number> {
  let port = startPort
  while (!(await isPortFree(port))) {
    port++
  }
  return port
}

export async function runPreview(): Promise<void> {
  const app = express()
  app.use(express.static('dist'))
  const startPort = Number(process.env.PORT) || 4173
  const port = await findFreePort(startPort)
  const server = createHttpServer(app)
  server.listen(port, () => {
    console.log(`Preview: http://localhost:${port}`)
  })
}
