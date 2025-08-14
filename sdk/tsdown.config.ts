/// <reference types="node" />

import { copyFileSync } from 'node:fs'
import { defineConfig } from 'tsdown'

export default defineConfig({
  onSuccess: () => {
    copyFileSync('dist/index.js', '../site/static/sdk.js')
    console.log('copied sdk.js to site/static/sdk.js')
  },
})
