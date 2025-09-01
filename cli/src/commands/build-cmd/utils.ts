import fs from 'node:fs'
import path from 'node:path'

export const LAB13_BUILD_DIR = '.lab13'

// Directory helper functions
export const getLab13BuildDir = (cwd: string) => path.join(cwd, LAB13_BUILD_DIR)

export const ensureLab13BuildDir = (cwd: string, debug = false) => {
  const dbg = (...args: any[]) => (debug ? console.log(`[DEBUG]`, ...args) : undefined)
  const lab13BuildDir = getLab13BuildDir(cwd)

  if (fs.existsSync(lab13BuildDir)) {
    // Clear contents but keep the directory
    const files = fs.readdirSync(lab13BuildDir)
    for (const file of files) {
      const filePath = path.join(lab13BuildDir, file)
      const stat = fs.statSync(filePath)
      if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true })
      } else {
        fs.unlinkSync(filePath)
      }
    }
    dbg('Cleared .lab13-build directory contents')
  } else {
    fs.mkdirSync(lab13BuildDir, { recursive: true })
    dbg('Created .lab13-build directory')
  }
  return lab13BuildDir
}
