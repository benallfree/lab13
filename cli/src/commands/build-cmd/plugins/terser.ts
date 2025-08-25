import type { Plugin } from 'vite'

export function terserPlugin(): Plugin {

  return {
    name: 'js13k-terser',
    config(config) {
      return {
        ...config,
        build: {
          ...config.build,
          minify: 'terser',
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              passes: 3,
              // Aggressive optimizations (commented out by default)
              // unsafe: true,
              // toplevel: true,
              // booleans_as_integers: true,
              // typeofs: false,
              // keep_fargs: false,
              // keep_infinity: false,
              // negate_iife: true,
              // pure_getters: 'strict',
            },
            // Mangle options (commented out by default)
            // mangle: {
            //   eval: true,
            //   toplevel: true,
            //   properties: {
            //     regex: /.*/,
            //   },
            // },
            // format: {
            //   comments: false,
            // },
            // toplevel: true,
          },
        },
      }
    },
  }
}
