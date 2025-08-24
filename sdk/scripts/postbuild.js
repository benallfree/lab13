import { cpSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const source = join(__dirname, '../dist')
const destination = join(__dirname, '../../site/static/sdk')

try {
  // Remove destination directory if it exists
  try {
    rmSync(destination, { recursive: true, force: true })
  } catch (error) {
    // Directory doesn't exist, which is fine
  }

  // Copy fresh dist to destination
  cpSync(source, destination, { recursive: true })
  console.log('✅ Copied dist to site/static/sdk')
} catch (error) {
  console.error('❌ Failed to copy dist to site:', error.message)
  process.exit(1)
}
