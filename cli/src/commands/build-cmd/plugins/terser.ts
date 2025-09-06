import { minify } from 'terser'
import type { Plugin } from 'vite'
import { terserOptions } from './terserOptions'

export type TerserPluginOptions = {
  debug?: boolean
  mangleProps?: boolean
}

export function terserPlugin(options: TerserPluginOptions = {}): Plugin {
  const { debug = false, mangleProps = false } = options
  const dbg = (...args: any[]) => (debug ? console.log(`[DEBUG] [terser]`, ...args) : undefined)

  return {
    name: 'js13k-terser',
    async generateBundle(options, bundle) {
      dbg('Minifying JS files with terser')

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.js') && chunk.type === 'chunk') {
          dbg(`Minifying ${fileName}`)

          try {
            const result = await minify(chunk.code, terserOptions({ mangleProps }))
            if (result.code) {
              chunk.code = result.code
              dbg(`Minified ${fileName}: ${chunk.code.length} bytes`)
            } else {
              dbg(`Warning: Terser returned no code for ${fileName}`)
            }
          } catch (error) {
            dbg(`Error minifying ${fileName}:`, error)
            // Keep original code if minification fails
          }
        }
      }
    },
  }
}
