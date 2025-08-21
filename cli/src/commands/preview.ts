import express from 'express'
import { createServer as createHttpServer } from 'http'

export async function runPreview(): Promise<void> {
  const app = express()
  app.use(express.static('dist'))
  const port = Number(process.env.PORT) || 4173
  const server = createHttpServer(app)
  server.listen(port, () => {
    console.log(`Preview: http://localhost:${port}`)
  })
}
