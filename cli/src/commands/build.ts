import SevenZip from '7z-wasm'
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { build as viteBuild } from 'vite'

export async function runBuild(watch = false, base?: string, outDir = 'dist', debug = false): Promise<void> {
  const dbg = (...args: any[]) => (debug ? console.log(`[DEBUG]`, ...args) : undefined)

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
    dbg(`CWD is ${cwd}`)
    const distPath = path.join(cwd, outDir)
    dbg(`DIST PATH is ${distPath}`)
    if (fs.existsSync(distPath)) {
      dbg(`DIST PATH exists`)
      try {
        // Initialize 7z-wasm
        const sevenZip = await SevenZip()

        // Create a temporary directory in the virtual filesystem
        const tempDir = '/temp'
        sevenZip.FS.mkdir(tempDir)

        // Copy dist folder contents to virtual filesystem
        const copyDirToFS = (srcPath: string, destPath: string) => {
          dbg(`Copying directory ${srcPath} to VFS ${destPath}`)
          const items = fs.readdirSync(srcPath)
          for (const item of items) {
            const srcItemPath = path.join(srcPath, item)
            // Convert Windows paths to Unix-style for virtual filesystem
            const destItemPath = path.join(destPath, item).replace(/\\/g, '/')
            const stats = fs.statSync(srcItemPath)
            dbg(`Item ${srcItemPath} is ${stats.isDirectory() ? 'a directory' : 'a file'}`)
            if (stats.isDirectory()) {
              dbg(`Creating directory in VFS: ${destItemPath}`)
              sevenZip.FS.mkdir(destItemPath)
              copyDirToFS(srcItemPath, destItemPath)
            } else {
              dbg(`Copying item ${srcItemPath} to ${destItemPath}`)
              const content = fs.readFileSync(srcItemPath)
              const stream = sevenZip.FS.open(destItemPath, 'w+')
              sevenZip.FS.write(stream, content, 0, content.length)
              sevenZip.FS.close(stream)
              dbg(`Successfully copied ${srcItemPath} to VFS`)
            }
          }
        }

        copyDirToFS(distPath, tempDir)

        // Compression methods to test
        const compressionMethods = [
          { name: 'deflate', flag: '' },
          { name: 'lzma', flag: '-m0=lzma' },
          { name: 'ppmd', flag: '-m0=ppmd' },
          { name: 'bzip2', flag: '-m0=bzip2' },
        ]

        const results: Array<{ method: string; size: number; path: string }> = []

        // Create zip archives with different compression methods
        for (const method of compressionMethods) {
          dbg(`Creating zip archive with method ${method.name}`)
          const zipName = `${gameName}-${packageVersion}.${method.name}.zip`
          const zipPath = path.join(cwd, zipName)
          dbg(`ZIP PATH is ${zipPath}`)
          // Clean up existing zip file if it exists
          if (fs.existsSync(zipPath)) {
            dbg(`Removing existing zip file ${zipPath}`)
            fs.unlinkSync(zipPath)
          }

          // Create zip archive silently
          const args = [
            'a',
            '-tzip',
            '-bd',
            '-bso0',
            '-bsp0',
            ...(method.flag ? [method.flag] : []),
            zipName,
            `${tempDir}/*`,
          ]
          dbg(`Calling 7z with args ${args.join(' ')}`)
          sevenZip.callMain(args)

          // Read the created zip file from virtual filesystem
          const zipData = sevenZip.FS.readFile(zipName)
          fs.writeFileSync(zipPath, zipData)
          dbg(`Wrote zip file ${zipPath}`)

          // Calculate size
          const stats = fs.statSync(zipPath)
          dbg(`Stats for ${zipPath} are ${stats.size} bytes`)
          results.push({
            method: method.name,
            size: stats.size,
            path: zipPath,
          })

          console.log(`Created ${zipName}: ${stats.size} bytes`)
        }

        // Find the best compression (smallest size)
        const bestResult = results.reduce((best, current) => (current.size < best.size ? current : best))

        console.log('\n=== Compression Results ===')
        results.forEach((result) => {
          const isBest = result.method === bestResult.method
          const marker = isBest ? '🏆 ' : '   '
          console.log(`${marker}${result.method.toUpperCase()}: ${result.size} bytes`)
        })

        // Display final results using the best compression
        const sizeInBytes = bestResult.size
        const sizeInKB = sizeInBytes / 1024
        const maxSize = 13 * 1024 // 13312 bytes limit
        const remainingBytes = maxSize - sizeInBytes
        const remainingKB = remainingBytes / 1024
        const percentage = (sizeInBytes / maxSize) * 100

        // Create visual progress bar
        const blocks = 10 // 10 blocks = 10% each
        const filledBlocks = Math.min(Math.floor(percentage / 10), blocks)
        const emptyBlocks = blocks - filledBlocks
        const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks)

        const sizeInfo = `${sizeInBytes} bytes`
        const usageInfo = `${percentage.toFixed(1)}% of 13312 bytes`
        const remainingInfo =
          remainingBytes > 0 ? `+${remainingBytes} bytes remaining` : `⚠️ ${Math.abs(remainingBytes)} bytes over limit`

        console.log(
          `\n🏆 ${bestResult.method.toUpperCase()}: ${sizeInfo} | [${progressBar}] ${usageInfo} | ${remainingInfo}`
        )

        // Create a symlink or copy of the best result as the main zip
        const mainZipPath = path.join(cwd, `${gameName}-${packageVersion}.zip`)
        if (fs.existsSync(mainZipPath)) {
          fs.unlinkSync(mainZipPath)
        }
        fs.copyFileSync(bestResult.path, mainZipPath)
        console.log(
          `\n📦 Main zip file created: ${gameName}-${packageVersion}.zip (using ${bestResult.method.toUpperCase()})`
        )
      } catch (error) {
        console.error('Error creating zip files:', error)
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
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            //     pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
            passes: 3,
            //     unsafe: true,
            //     toplevel: true,
            //     booleans_as_integers: true,
            //     typeofs: false,
            //     keep_fargs: false,
            //     keep_infinity: false,
            //     negate_iife: true,
            //     pure_getters: 'strict',
          },
          //   mangle: {
          //     eval: true,
          //     toplevel: true,
          //     properties: {
          //       regex: /.*/,
          //     },
          //   },
          //   format: {
          //     comments: false,
          //   },
          //   toplevel: true,
        },
      },
      plugins: [postBuildPlugin],
    })
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}
