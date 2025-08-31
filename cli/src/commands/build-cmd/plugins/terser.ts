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
          terserOptions: defaultTerserOptions,
        },
      }
    },
  }
}
