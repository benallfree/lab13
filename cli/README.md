## Lab13 CLI

Command‑line tools for building and serving js13kGames projects.

### Quick start

```bash
npx l13 --help
```

Run a specific command:

```bash
npx l13 <command>
```

### Commands

- **dev**: Run the Vite dev server with l13 defaults.

  ```bash
  npx l13 dev
  ```

- **build**: Build the project with l13 Vite defaults (outputs to `dist/`).

  ```bash
  npx l13 build
  ```

  Options:
  - `--watch`: Watch for file changes and rebuild
  - `--base <path>`: Public base path when served in production
  - `--out <dir>`: Output directory (default: `dist`)

  The build process automatically:
  - Creates a zip file named `<package-name>-<version>.zip`
  - Calculates and displays size information
  - Shows a progress bar indicating usage of the 13KB limit
  - Reports remaining space or if the limit is exceeded

- **preview**: Serve the built `dist/` directory with Express.

  ```bash
  npx l13 preview
  ```

  - **PORT**: Set the port via the `PORT` env var (default: `4173`).

- **create**: Scaffold a new project from the official examples.

  ```bash
  npx l13 create
  ```

  Follow the prompts to pick an example and target directory.

### Help

- Global help: `npx l13 --help`
- Command help: `npx l13 <command> --help`

### If ECT fails to install with npx/bunx

This CLI relies on native binaries (`ECT`, `advzip`) provided via postinstall steps (`ect-bin`, `advzip-bin`). Some runners (for example, `bunx`) may skip or block postinstall until the package is trusted, which can cause errors like ECT not found.

If you hit trust/permission issues, install the CLI as a dev dependency and run it via your project scripts (so installation is fully trusted first):

- npm: `npm i -D l13`
- pnpm: `pnpm add -D l13`
- yarn: `yarn add -D l13`
- bun: `bun add -d l13`

Add scripts to `package.json`:

```json
{
  "scripts": {
    "l13": "l13",
    "dev": "l13 dev",
    "build": "l13 build",
    "preview": "l13 preview"
  }
}
```

Then run:

```bash
npm run dev
# or any script above, e.g.:
npm run build
# or access the CLI directly:
npm run l13 -- --help
```
