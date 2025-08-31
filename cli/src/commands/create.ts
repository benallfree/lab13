import inquirer from 'inquirer'
import fs from 'node:fs'
import path from 'node:path'
import tiged from 'tiged'

type GameExample = {
  name: string
  description: string
  slug: string
}

// Function to strip workspace: prefixes from package.json files
function stripWorkspacePrefixes(targetDir: string): void {
  const packageJsonPath = path.join(targetDir, 'package.json')

  if (fs.existsSync(packageJsonPath)) {
    try {
      const content = fs.readFileSync(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)

      // Strip workspace: prefix from dependencies and devDependencies
      ;['dependencies', 'devDependencies'].forEach((section) => {
        if (packageJson[section]) {
          Object.keys(packageJson[section]).forEach((dep) => {
            if (packageJson[section][dep].startsWith('workspace:')) {
              packageJson[section][dep] = packageJson[section][dep].replace('workspace:', '')
            }
          })
        }
      })

      // Write back the modified package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
    } catch (error) {
      console.warn('Warning: Could not process package.json:', error)
    }
  }
}

async function listRemoteExamples(): Promise<GameExample[]> {
  const url = 'https://raw.githubusercontent.com/benallfree/lab13/refs/heads/main/games/meta.json'
  try {
    const res = await (globalThis as any).fetch(url, {
      headers: {
        'User-Agent': 'lab13',
      },
    })
    if (!res?.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map((game: any) => {
      // Extract slug from repository URL
      const repoUrl = game.repository || ''
      const match = repoUrl.match(/\/games\/([^\/]+)$/)
      const slug = match ? match[1] : game.name.toLowerCase().replace(/\s+/g, '-')
      return {
        name: game.name,
        description: game.description,
        slug,
      }
    })
  } catch {
    return []
  }
}

export async function runCreate(): Promise<void> {
  const cwd = process.cwd()
  const examples = await listRemoteExamples()
  if (examples.length === 0) {
    console.error('No examples found')
    process.exit(1)
  }

  const { exampleName } = await inquirer.prompt<{ exampleName: string }>([
    {
      name: 'exampleName',
      type: 'list',
      message: 'Select an example to scaffold:',
      choices: examples.map((example) => ({
        name: `${example.name} - ${example.description}`,
        value: example.slug,
      })),
    },
  ])

  const { targetDir } = await inquirer.prompt<{ targetDir: string }>([
    {
      name: 'targetDir',
      type: 'input',
      message: 'Target directory:',
      default: exampleName,
    },
  ])

  const repo = 'benallfree/lab13'
  const templatePath = `games/${exampleName}`
  const source = `${repo}/${templatePath}`
  const emitter = tiged(source, { force: true, verbose: true })

  const absTarget = path.resolve(cwd, targetDir)
  await emitter.clone(absTarget)

  // Strip workspace: prefixes from package.json after cloning
  stripWorkspacePrefixes(absTarget)

  const lockfiles = ['bun.lockb', 'bun.lock', 'pnpm-lock.yaml', 'package-lock.json', 'yarn.lock']
  const found = lockfiles.find((f) => fs.existsSync(path.join(absTarget, f)))
  let installHint = ''
  if (found === 'bun.lockb' || found === 'bun.lock') installHint = 'bun install'
  else if (found === 'pnpm-lock.yaml') installHint = 'pnpm install'
  else if (found === 'package-lock.json') installHint = 'npm install'
  else if (found === 'yarn.lock') installHint = 'yarn'
  else installHint = 'bun install'

  console.log(`\nScaffolded ${exampleName} into ${path.relative(cwd, absTarget)}\n`)
  console.log(`Next steps:`)
  console.log(`  cd ${path.relative(cwd, absTarget)}`)
  console.log(`  ${installHint}`)
}
