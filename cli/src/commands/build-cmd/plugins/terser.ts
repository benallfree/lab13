import type { Plugin } from 'vite'
import { defaultTerserOptions } from './terser.config'

export type TerserPluginOptions = {
  debug?: boolean
}

export function terserPlugin(options: TerserPluginOptions = {}): Plugin {
  const { debug = false } = options
  const dbg = (...args: any[]) => (debug ? console.log(`[DEBUG] [terser]`, ...args) : undefined)
  return {
    name: 'js13k-terser',
    config(config) {
      dbg('Configuring Terser')
      return {
        ...config,
        build: {
          ...config.build,
          minify: 'terser',
          target: 'es2022',
          modulePreload: { polyfill: false },
          assetsInlineLimit: 800,

          terserOptions: defaultTerserOptions,
        },
      }
    },
  }
}
