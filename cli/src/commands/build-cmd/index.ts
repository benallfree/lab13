import fs from 'node:fs'
import path from 'node:path'
import { build as viteBuild } from 'vite'
import { archivePlugin } from './plugins/archive'
import { htmlMinifyPlugin } from './plugins/html-minify'
import { inlineCssPlugin } from './plugins/inline-css'
import { inlineJsPlugin } from './plugins/inline-js'
import { roadrollerPlugin } from './plugins/roadroller'
import { terserPlugin } from './plugins/terser'

export type BuildOptions = {
  watch?: boolean
  base?: string
  out?: string
  debug?: boolean
  roadroller?: boolean
  htmlMinify?: boolean
  terser?: boolean
  experimental?: boolean
  exclude?: string[]
  dev?: boolean
  inlineCss?: boolean
  inlineJs?: boolean
}
export async function runBuild(options: BuildOptions): Promise<void> {
  const { watch, base, out, debug, roadroller, htmlMinify, terser, experimental, exclude, dev, inlineCss, inlineJs } =
    options

  // Roadroller and inline-js are incompatible - roadroller needs the JS file to be external
  const effectiveInlineJs = roadroller ? false : inlineJs

  const dbg = (...args: any[]) => (debug ? console.log(`[DEBUG]`, ...args) : undefined)

  // Handle exclude option - it might be a string or array
  const excludePatterns = Array.isArray(exclude) ? exclude : exclude ? [exclude] : []

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

  // Run Vite build with post-build plugin
  await viteBuild({
    base,
    define: dev
      ? {}
      : {
          'import.meta.env.DEV': 'false',
          'import.meta.env.PROD': 'true',
        },
    build: {
      outDir: out,
      emptyOutDir: true,
      watch: watch ? {} : undefined,
      assetsDir: '',
      rollupOptions: {
        output: {
          // inlineDynamicImports: true,
          manualChunks: undefined,
          // assetFileNames: `[name].[ext]`,
        },
      },
    },
    plugins: [
      terser !== false ? terserPlugin() : undefined,
      htmlMinify !== false ? htmlMinifyPlugin() : undefined,
      inlineCss !== false ? inlineCssPlugin() : undefined,
      effectiveInlineJs !== false ? inlineJsPlugin() : undefined,
      roadroller ? roadrollerPlugin() : undefined,
      archivePlugin({
        gameName,
        packageVersion,
        debug,
        experimental,
        exclude: excludePatterns,
      }),
    ].filter(Boolean),
  })
}
