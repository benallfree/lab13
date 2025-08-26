#!/usr/bin/env node
import { Command } from 'commander'
import { runBuild } from './commands/build-cmd'
import { runCreate } from './commands/create'
import { runDev } from './commands/dev'
import { runPreview } from './commands/preview'
import { toBoolean } from './util'

// Helper function to collect multiple values for the same option
function collect(value: string, previous: string[]): string[] {
  return previous.concat([value])
}

const program = new Command()

program
  .name('js13k')
  .description('CLI for js13kGames tooling')
  .showHelpAfterError()
  .configureHelp({ sortSubcommands: true, sortOptions: true })

program
  .command('dev')
  .description('Run the Vite dev server with js13k defaults')
  .option('--base <path>', 'Public base path when served in production')
  .option('--out <dir>', 'Output directory', 'dist')
  .option('--debug', 'Enable debug mode', toBoolean(process.env.DEBUG))
  .option('--roadroller', 'Enable roadroller', toBoolean(process.env.ROADROLLER))
  .option('--exclude <pattern>', 'Exclude files matching pattern (can be used multiple times)', collect, [])
  .action((options) => runDev(options))

program
  .command('build')
  .description('Build the project with js13k Vite defaults')
  .option('--watch', 'Watch for file changes and rebuild')
  .option('--base <path>', 'Public base path when served in production')
  .option('--out <dir>', 'Output directory', 'dist')
  .option('--debug', 'Enable debug mode', toBoolean(process.env.DEBUG))
  .option('--roadroller', 'Enable roadroller', toBoolean(process.env.ROADROLLER))
  .option('--exclude <pattern>', 'Exclude files matching pattern (can be used multiple times)', collect, [])
  .action((options) => runBuild(options))

program.command('preview').description('Serve the built dist/ directory with Express').action(runPreview)

program.command('create').description('Scaffold a new project from the official examples').action(runCreate)

program.parseAsync()
