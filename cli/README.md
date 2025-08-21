## js13k CLI

Command‑line tools for building and serving js13kGames projects.

### Quick start

```bash
npx js13k --help
```

Run a specific command:

```bash
npx js13k <command>
```

### Commands

- **dev**: Run the dev server with js13k defaults.

  ```bash
  npx js13k dev
  ```

- **build**: Build the project with js13k defaults (outputs to `dist/`).

  ```bash
  npx js13k build
  ```

- **preview**: Serve the built `dist/` directory and print the local URL.

  ```bash
  npx js13k preview
  ```

- **relay**: Start a minimal WebSocket relay at `/parties/relay/<room>`.

  ```bash
  npx js13k relay
  ```

  - **PORT**: Set the port via the `PORT` env var (default: `4321`).
  - Clients connect to: `ws://localhost:<PORT>/parties/relay/<room>`

- **create**: Scaffold a new project from the official examples.

  ```bash
  npx js13k create
  ```

  Follow the prompts to pick an example and target directory.

### Help

- Global help: `npx js13k --help`
- Command help: `npx js13k <command> --help`

### If ECT fails to install with npx/bunx

This CLI relies on native binaries (`ECT`, `advzip`) provided via postinstall steps (`ect-bin`, `advzip-bin`). Some runners (for example, `bunx`) may skip or block postinstall until the package is trusted, which can cause errors like ECT not found.

If you hit trust/permission issues, install the CLI as a dev dependency and run it via your project scripts (so installation is fully trusted first):

- npm: `npm i -D js13k`
- pnpm: `pnpm add -D js13k`
- yarn: `yarn add -D js13k`
- bun: `bun add -d js13k`

Add scripts to `package.json`:

```json
{
  "scripts": {
    "js13k": "js13k",
    "dev": "js13k dev",
    "build": "js13k build",
    "preview": "js13k preview",
    "relay": "js13k relay"
  }
}
```

Then run:

```bash
npm run dev
# or any script above, e.g.:
npm run build
# or access the CLI directly:
npm run js13k -- --help
```
