# js13k

## 0.0.11

### Patch Changes

- 9d5034d: Add yolo mode for last mile (1kib)
- ed1f7cc: Always show at least one block in progress bar
- 28687a5: Expand progress bar size to 20 blocks
- d5443c0: Fix: CSS inlining tag detection

## 0.0.10

### Patch Changes

- 20990d1: Add ESM support to RoadRoller
- 940d645: Disable Terser prop mangling by default
- 635b88a: 'dev' command now runs vite in development mode with source maps
- d527f40: Inline scripts are now type module
- e1870e8: Default to minify even when --no-terser is specified

## 0.0.9

### Patch Changes

- ec5f59a: Fix: Windows archive regression
- 3656e0f: Improve debugging messages
- 7dc9f8d: Change build dir name to .lab13

## 0.0.8

### Patch Changes

- 7cfd03a: Improve ECT build during file watching
- a63a421: Add --ect flag

## 0.0.7

### Patch Changes

- 3b7d8eb: Make sure ECT is executable
- 913d080: Move HTML minification after CSS and JS inlining
- 1dcc8cb: Terser config simplification

## 0.0.6

### Patch Changes

- 33b4c0f: Strip workspaces on package creation

## 0.0.5

### Patch Changes

- 2ba05de: Fix ECT (again)

## 0.0.4

### Patch Changes

- e705234: Fix ECT pathing

## 0.0.3

### Patch Changes

- ecb397d: Write all assets to root for ECT compat
- a6666ca: Add HTML minification
- be3cfdc: Added --inline-css and --inline-js (both default true)
- 69c0c45: Improved terser defaults
- d6d4cbf: Fix `create` command
- e843ca0: Ensure that RoadRoller runs after any inlining
- 89e290e: Add --terser and --no-terser flag
- 4426c56: Support ECT and 7zip Deflate by default
- dd06832: Improve terser settings
- 7e59d06: Enhance debug logs
- 8f06238: Document support for external vite.config.ts

## 0.0.2

### Patch Changes

- 2092d8a: Add --version
- 9db6923: Disable screen clearing in dev mode
- 7ac21e3: Rename primary command from js13k to l13
- 0524a49: Add max compression to zip
- a5cd63d: Build bundle on dev start

## 0.0.1

### Patch Changes

- 5bce164: Add --exclude option
- 07b1cb0: Add zip output and 13kb comparison
- 2b9db26: Make zip bundle build with prod settings by default, add --dev and --dev-bundle flags
- 3d49484: Roadroller support
- fc19f47: handle build errors gracefully
- fb32a19: Add --debug flag
- 8f70824: Build preview in dev mode
- 731d209: Add deflate, lzma, ppmd, bzip and choose winner
- 703049d: Support output dir for archiver
- c49a2d4: Fix output dir bug
- 09b93f9: Add terser support
- 07b1cb0: Drop js13k-vite-plugin due to binary compat issues
- ee3b193: Debounce .zip writes in dev mode
- 9400bd0: Windows compat
- a740cc7: Support DEBUG and ROADROLLER env vars
- 047c4a1: Add --experimental flag for compression formats beyond Deflate

## 0.0.1-rc.14

### Patch Changes

- 2b9db26: Make zip bundle build with prod settings by default, add --dev and --dev-bundle flags

## 0.0.1-rc.13

### Patch Changes

- 961fe70: Add --experimental flag for compression formats beyond Deflate

## 0.0.1-rc.12

### Patch Changes

- 5bce164: Add --exclude option
- ee3b193: Debounce .zip writes in dev mode

## 0.0.1-rc.11

### Patch Changes

- fc19f47: handle build errors gracefully

## 0.0.1-rc.10

### Patch Changes

- 8f70824: Build preview in dev mode
- 703049d: Support output dir for archiver
- c49a2d4: Fix output dir bug
- a740cc7: Support DEBUG and ROADROLLER env vars

## 0.0.1-rc.9

### Patch Changes

- 3d49484: Roadroller support

## 0.0.1-rc.8

### Patch Changes

- 9400bd0: Windows compat

## 0.0.1-rc.7

### Patch Changes

- fb32a19: Add --debug flag

## 0.0.1-rc.6

### Patch Changes

- 09b93f9: Add terser support

## 0.0.1-rc.5

### Patch Changes

- 07b1cb0: Add zip output and 13kb comparison
- Add deflate, lzma, ppmd, bzip and choose winner
- 07b1cb0: Drop js13k-vite-plugin due to binary compat issues

## 0.0.1-rc.2

### Patch Changes

- Add `create` command
