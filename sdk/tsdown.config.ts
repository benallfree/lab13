import { copyFile } from 'fs/promises'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm'],
  dts: true,
  clean: true,
  async onSuccess() {
    // Copy w.d.ts to dist
    await copyFile('src/w/w.d.ts', 'dist/w.d.ts')
  },
})
