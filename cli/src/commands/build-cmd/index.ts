import fs from 'node:fs'
import path from 'node:path'
import { build as viteBuild } from 'vite'
import { archivePlugin } from './plugins/archive'
import { roadrollerPlugin } from './plugins/roadroller'
import { terserPlugin } from './plugins/terser'

export type BuildOptions = {
  watch?: boolean
  base?: string
  outDir?: string
  debug?: boolean
  roadroller?: boolean
}
export async function runBuild(options: BuildOptions): Promise<void> {
  const { watch, base, outDir, debug, roadroller } = options
  const dbg = (...args: any[]) => (debug ? console.log(`[DEBUG]`, ...args) : undefined)

  const cwd = process.cwd()
  const packageJsonPath = path.join(cwd, 'package.json')

  // Read package.json to get name and version
  let gameName = 'game'
  let packageVersion = '1.0.0'

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    gameName = packageJson.name || 'game'
    packageVersion = packageJson.version || '1.0.0'
  } catch (error) {
    console.warn('Could not read package.json, using default values')
  }

  try {
    // Run Vite build with post-build plugin
    await viteBuild({
      base,
      build: {
        outDir,
        emptyOutDir: true,
        watch: watch ? {} : undefined,
      },
      plugins: [
        terserPlugin(),
        roadroller ? roadrollerPlugin() : undefined,
        archivePlugin({
          gameName,
          packageVersion,
          debug,
        }),
      ].filter(Boolean),
    })
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}
