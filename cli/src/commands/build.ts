import SevenZip from '7z-wasm'
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { build as viteBuild } from 'vite'

export async function runBuild(watch = false, base?: string, outDir = 'dist'): Promise<void> {
  const cwd = process.cwd()
  const packageJsonPath = path.join(cwd, 'package.json')

  // Read package.json to get name and version
  let gameName = 'game'
  let packageVersion = '1.0.0'

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    gameName = packageJson.name || 'game'
    packageVersion = packageJson.version || '1.0.0'
  } catch (error) {
    console.warn('Could not read package.json, using default values')
  }

  // Function to perform post-build tasks (zipping, size calculation)
  const performPostBuildTasks = async () => {
    const distPath = path.join(cwd, outDir)
    const zipName = `${gameName}-${packageVersion}.zip`
    const zipPath = path.join(cwd, zipName)

    // Clean up existing zip file if it exists
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath)
      console.log(`Cleaned up existing ${zipName}`)
    }

    if (fs.existsSync(distPath)) {
      try {
        // Initialize 7z-wasm
        const sevenZip = await SevenZip()

        // Create a temporary directory in the virtual filesystem
        const tempDir = '/temp'
        sevenZip.FS.mkdir(tempDir)

        // Copy dist folder contents to virtual filesystem
        const copyDirToFS = (srcPath: string, destPath: string) => {
          const items = fs.readdirSync(srcPath)
          for (const item of items) {
            const srcItemPath = path.join(srcPath, item)
            const destItemPath = path.join(destPath, item)
            const stats = fs.statSync(srcItemPath)

            if (stats.isDirectory()) {
              sevenZip.FS.mkdir(destItemPath)
              copyDirToFS(srcItemPath, destItemPath)
            } else {
              const content = fs.readFileSync(srcItemPath)
              const stream = sevenZip.FS.open(destItemPath, 'w+')
              sevenZip.FS.write(stream, content, 0, content.length)
              sevenZip.FS.close(stream)
            }
          }
        }

        copyDirToFS(distPath, tempDir)

        // Create zip archive
        sevenZip.callMain(['a', '-tzip', zipName, `${tempDir}/*`])

        // Read the created zip file from virtual filesystem
        const zipData = sevenZip.FS.readFile(zipName)
        fs.writeFileSync(zipPath, zipData)

        console.log(`Zipped ${outDir}/ to ${zipName}`)

        // Calculate and display size information
        const stats = fs.statSync(zipPath)
        const sizeInBytes = stats.size
        const sizeInKB = sizeInBytes / 1024
        const maxSize = 13 * 1024 // 13KB in bytes
        const remainingBytes = maxSize - sizeInBytes
        const remainingKB = remainingBytes / 1024
        const percentage = (sizeInBytes / maxSize) * 100

        console.log(`Size: ${sizeInKB.toFixed(2)}KB (${sizeInBytes} bytes)`)
        console.log(`Usage: ${percentage.toFixed(1)}% of 13KB limit`)

        // Create visual progress bar
        const blocks = 10 // 10 blocks = 10% each
        const filledBlocks = Math.min(Math.floor(percentage / 10), blocks)
        const emptyBlocks = blocks - filledBlocks
        const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks)
        console.log(`[${progressBar}] ${percentage.toFixed(1)}%`)

        if (remainingBytes > 0) {
          console.log(`Remaining: ${remainingKB.toFixed(2)}KB (${remainingBytes} bytes)`)
        } else {
          console.log(`⚠️  Exceeds 13KB limit by ${Math.abs(remainingKB).toFixed(2)}KB`)
        }
      } catch (error) {
        console.error('Error creating zip file:', error)
      }
    } else {
      console.warn(`${outDir}/ folder not found, skipping zip creation`)
    }
  }

  // Create plugin for post-build tasks
  const postBuildPlugin: Plugin = {
    name: 'js13k-post-build',
    closeBundle() {
      console.log('Build complete')
      performPostBuildTasks()
    },
  }

  try {
    // Run Vite build with post-build plugin
    await viteBuild({
      base,
      build: {
        outDir,
        emptyOutDir: true,
        watch: watch ? {} : undefined,
      },
      plugins: [postBuildPlugin],
    })
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}
