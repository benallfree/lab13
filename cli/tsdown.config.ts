import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  external: [
    /node_modules/,
    'fsevents',
    'rollup',
    'vite',
    'commander',
    'clean-css',
    'html-minifier-terser',
    'roadroller',
  ],
})
