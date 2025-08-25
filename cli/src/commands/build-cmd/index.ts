import fs from 'node:fs'
import path from 'node:path'
import { build as viteBuild } from 'vite'
import { archivePlugin } from './plugins/archive'
import { terserPlugin } from './plugins/terser'

export async function runBuild(watch = false, base?: string, outDir = 'dist', debug = false): Promise<void> {
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
        // roadrollerPlugin(),
        archivePlugin({
          gameName,
          packageVersion,
          debug,
        }),
      ],
    })
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}
