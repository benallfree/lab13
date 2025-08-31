import type { Plugin } from 'vite'
import { defaultTerserOptions } from './terser.config'

export function terserPlugin(): Plugin {
  return {
    name: 'js13k-terser',
    config(config) {
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
