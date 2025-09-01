---
title: Create Command
sidebar_position: 1
---

# `l13 create`

Scaffold a new JS13K game project from official examples.

## Usage

```bash
npx l13 create
```

## Description

The `create` command interactively scaffolds a new game project by cloning one of the official Lab13 examples. It fetches the latest examples from the Lab13 repository and allows you to choose which template to use.

## Interactive Prompts

1. **Select Example**: Choose from available game examples
2. **Target Directory**: Specify where to create the project (defaults to example name)

## Examples

```bash
# Create a new project interactively
npx l13 create

# The command will prompt you to:
# 1. Select an example (e.g., "cars", "cats", "flight", etc.)
# 2. Choose target directory (e.g., "my-awesome-game")
```

## What Gets Created

- Complete project structure from the selected example
- All source files, assets, and configuration
- `package.json` with proper dependencies
- Build configuration optimized for JS13K
- README and documentation

## Available Examples

The CLI fetches examples from the [Lab13 repository](https://github.com/benallfree/lab13/tree/main/games), including:

- **cars** - Racing game example
- **cats** - Simple game example
- **flight** - Flight simulation example
- **gotron** - Retro game example
- **hello-mmo** - Multiplayer example
- **mewsterpiece** - Art game example
- **presence** - Presence system example

## Notes

- Examples are fetched from the main branch of the Lab13 repository
- The command automatically strips workspace prefixes from dependencies
- If network issues occur, the command will fail gracefully with an error message
