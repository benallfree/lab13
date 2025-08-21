#!/usr/bin/env node
import { Command } from 'commander'
import { runBuild } from './commands/build'
import { runCreate } from './commands/create'
import { runDev } from './commands/dev'
import { runPreview } from './commands/preview'
import { runRelay } from './commands/relay'

const program = new Command()

program
  .name('js13k')
  .description('CLI for js13kGames tooling')
  .showHelpAfterError()
  .configureHelp({ sortSubcommands: true, sortOptions: true })

program.command('dev').description('Run the Vite dev server with js13k defaults').action(runDev)

program.command('build').description('Build the project with js13k Vite defaults').action(runBuild)

program.command('preview').description('Serve the built dist/ directory with Express').action(runPreview)

program.command('create').description('Scaffold a new project from the official examples').action(runCreate)

program.command('relay').description('WebSocket relay at /parties/relay/<room>').action(runRelay)

program.parseAsync()
