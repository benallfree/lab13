import inquirer from 'inquirer'
import fs from 'node:fs'
import path from 'node:path'
import tiged from 'tiged'

async function listRemoteExamples(): Promise<string[]> {
  const url = 'https://api.github.com/repos/benallfree/lab13/games'
  try {
    const res = await (globalThis as any).fetch(url, {
      headers: {
        'User-Agent': 'lab13',
        Accept: 'application/vnd.github+json',
      },
    })
    if (!res?.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data
      .filter((e: any) => e && e.type === 'dir' && typeof e.name === 'string')
      .map((e: any) => e.name as string)
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
      choices: examples,
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
