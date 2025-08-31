#!/usr/bin/env node
import { Command } from 'commander'
import { version } from '../package.json'
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
  .name('l13')
  .version(version)
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
  .option('--html-minify', 'Enable HTML minification', true)
  .option('--no-html-minify', 'Disable HTML minification')
  .option('--terser', 'Enable Terser minification', true)
  .option('--no-terser', 'Disable Terser minification')
  .option('--experimental', 'Enable experimental compression methods', toBoolean(process.env.EXPERIMENTAL))
  .option('--inline-css', 'Inline CSS assets into HTML', true)
  .option('--no-inline-css', 'Disable inlining CSS assets into HTML')
  .option('--inline-js', 'Inline JS assets into HTML', true)
  .option('--no-inline-js', 'Disable inlining JS assets into HTML')
  .option('--exclude <pattern>', 'Exclude files matching pattern (can be used multiple times)', collect, [])
  .option('--dev-bundle', `Build the zip bundle using Vite's dev mode`, false)
  .action((options) => runDev({ ...options, dev: options.devBundle }))

program
  .command('build')
  .description('Build the project with js13k Vite defaults')
  .option('--watch', 'Watch for file changes and rebuild')
  .option('--base <path>', 'Public base path when served in production')
  .option('--out <dir>', 'Output directory', 'dist')
  .option('--debug', 'Enable debug mode', toBoolean(process.env.DEBUG))
  .option('--roadroller', 'Enable roadroller', toBoolean(process.env.ROADROLLER))
  .option('--html-minify', 'Enable HTML minification', true)
  .option('--no-html-minify', 'Disable HTML minification')
  .option('--terser', 'Enable Terser minification', true)
  .option('--no-terser', 'Disable Terser minification')
  .option('--inline-css', 'Inline CSS assets into HTML', true)
  .option('--no-inline-css', 'Disable inlining CSS assets into HTML')
  .option('--inline-js', 'Inline JS assets into HTML', true)
  .option('--no-inline-js', 'Disable inlining JS assets into HTML')
  .option('--experimental', 'Enable experimental compression methods', toBoolean(process.env.EXPERIMENTAL))
  .option('--exclude <pattern>', 'Exclude files matching pattern (can be used multiple times)', collect, [])
  .option('--dev', `Build the zip bundle using Vite's dev mode`, false)
  .action((options) => runBuild(options))

program.command('preview').description('Serve the built dist/ directory with Express').action(runPreview)

program.command('create').description('Scaffold a new project from the official examples').action(runCreate)

program.parseAsync()
