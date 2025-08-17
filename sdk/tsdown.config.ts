/// <reference types="node" />

import { cpSync } from 'node:fs'
import { defineConfig } from 'tsdown'

export default defineConfig({
  onSuccess: () => {
    const destination = '../site/static/sdk'
    cpSync('dist', destination, { recursive: true, force: true })
    console.log('copied dist to site/static/sdk')
  },
})
