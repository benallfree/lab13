import SevenZip from '7z-wasm'
import ect from 'ect-bin'
import { globSync } from 'glob'
import { minimatch } from 'minimatch'
import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

interface ArchivePluginOptions {
  gameName?: string
  packageVersion?: string
  debug?: boolean
  exclude?: string[]
  experimental?: boolean
}

export function archivePlugin(options: ArchivePluginOptions = {}): Plugin {
  const { gameName = 'game', packageVersion = '1.0.0', debug = false, exclude = [], experimental = false } = options
  const dbg = (...args: any[]) => (debug ? console.log(`[DEBUG] [archive]`, ...args) : undefined)

  // Function to check if a file should be excluded based on patterns
  const shouldExclude = (filePath: string): boolean => {
    if (exclude.length === 0) return false

    // Get the relative path from the dist directory
    const relativePath = path.relative(outDir, filePath)

    return exclude.some((pattern) => {
      const isMatch = minimatch(relativePath, pattern, { dot: true })
      if (isMatch) {
        dbg(`Excluding ${relativePath} (matches pattern: ${pattern})`)
      }
      return isMatch
    })
  }

  let outDir = path.join(process.cwd(), 'dist')
  return {
    name: 'js13k-archive',
    configResolved(config) {
      outDir = path.isAbsolute(config.build.outDir)
        ? config.build.outDir
        : path.join(process.cwd(), config.build.outDir)
      dbg('Output directory:', outDir)
      // Use outDir as needed
    },
    async closeBundle() {
      const cwd = process.cwd()
      const distPath = outDir

      dbg(`CWD is ${cwd}`)
      dbg(`DIST PATH is ${distPath}`)

      if (!fs.existsSync(distPath)) {
        console.warn(`${outDir}/ folder not found, skipping zip creation`)
        return
      }

      dbg(`DIST PATH exists`)

      const allFiles = globSync('**/*', { cwd: outDir, absolute: true })
      dbg(`All files: ${allFiles.join('\n')}`)

      try {
        // Initialize 7z-wasm
        const sevenZip = await SevenZip()

        // Create a temporary directory in the virtual filesystem
        const tempDir = '/temp'
        sevenZip.FS.mkdir(tempDir)

        for (const file of allFiles) {
          const destItemPath = path.join(tempDir, path.relative(outDir, file).replace(/\\/g, '/'))
          dbg(`Copying file ${file} to ${destItemPath}`)
          const content = fs.readFileSync(file)
          const stream = sevenZip.FS.open(destItemPath, 'w+')
          sevenZip.FS.write(stream, content, 0, content.length)
          sevenZip.FS.close(stream)
        }

        // Compression methods to test
        const compressionMethods: { name: string; flags: string[] }[] = [
          { name: 'ect', flags: [] },
          { name: 'deflate', flags: [] },
          ...(experimental
            ? [
                { name: 'lzma', flags: ['-m0=lzma'] },
                { name: 'ppmd', flags: ['-m0=ppmd'] },
                { name: 'bzip2', flags: ['-m0=bzip2'] },
              ]
            : []),
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

          if (method.name === 'ect') {
            // Use ECT for compression
            try {
              const args = ['-strip', '-zip', '-10009', zipName, ...allFiles]
              dbg(`Calling ECT with args ${args.join(' ')}`)

              // Use ECT binary from ect-bin package
              await new Promise<void>((resolve, reject) => {
                execFile(ect, args, (err) => {
                  if (err) {
                    reject(err)
                  } else {
                    dbg('ECT compression completed successfully')
                    resolve()
                  }
                })
              })
            } catch (err) {
              console.error(`ECT error for ${method.name}:`, err)
              // Fall back to deflate if ECT fails
              method.name = 'deflate'
              method.flags = []
            }
          } else {
            // Use 7z for compression
            // Create zip archive silently
            const args = ['a', '-tzip', '-bd', '-bso0', '-bsp0', '-mx9', ...method.flags, zipName, `${tempDir}/*`]
            dbg(`Calling 7z with args ${args.join(' ')}`)
            sevenZip.callMain(args)

            // Read the created zip file from virtual filesystem
            const zipData = sevenZip.FS.readFile(zipName)
            fs.writeFileSync(zipPath, zipData)
            dbg(`Wrote zip file ${zipPath}`)
          }

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
        const maxSize = 13 * 1024 // 13312 bytes limit
        const remainingBytes = maxSize - sizeInBytes
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

        // Suggest roadroller if over 13KB
        if (sizeInBytes > maxSize) {
          console.log(`\n💡 Consider using --roadroller for better compression!`)
        }

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
    },
  }
}
