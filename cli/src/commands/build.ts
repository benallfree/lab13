import { js13kViteConfig } from 'js13k-vite-plugins'
import { build as viteBuild } from 'vite'

export async function runBuild(): Promise<void> {
  const config = js13kViteConfig()
  await viteBuild(config as any)
  console.log('Build complete')
}
