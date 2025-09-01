---
title: Compression & Optimization
sidebar_position: 5
---

# Compression & Optimization

The Lab13 CLI provides multiple compression methods and optimization techniques to help you stay within the 13KB size limit for JS13K games.

## Compression Methods

### Standard ZIP

- **Default**: Always created
- **Description**: Basic ZIP compression
- **Use Case**: Baseline compression for all builds

### Deflate

- **Default**: Always created
- **Description**: Enhanced compression using deflate algorithm
- **Use Case**: Better compression than standard ZIP

### ECT (Extreme Compression Tool)

- **Default**: Enabled (`--ect`)
- **Description**: Advanced compression tool specifically designed for small files
- **Use Case**: Often provides the best compression ratios
- **Disable**: `--no-ect`

### Roadroller

- **Default**: Disabled (`--roadroller`)
- **Description**: Advanced JavaScript compression that analyzes and optimizes code structure
- **Use Case**: Can significantly reduce JavaScript file sizes
- **Note**: Incompatible with `--inline-js` (Roadroller needs external JS files)

### Experimental Methods

- **Default**: Disabled (`--experimental`)
- **Description**: Additional compression algorithms (bzip2, lzma, ppmd)
- **Use Case**: Testing alternative compression methods for future JS13K competitions
- **Enable**: `--experimental`
- **⚠️ Important**: These methods are **NOT allowed** in the current JS13K 2025 competition

**Current JS13K 2025 Rules**: Only **Deflate compression** is officially allowed for submissions. The experimental compression methods (bzip2, lzma, ppmd) are provided for testing and evaluation purposes, as they may be considered for inclusion in future JS13K competitions.

**For Competition Submissions**: Use only the standard ZIP or Deflate compression methods. The experimental methods are for research and development only.

## Optimization Techniques

### Asset Inlining

- **CSS Inlining**: `--inline-css` (default: enabled)
  - Inlines CSS files directly into HTML
  - Reduces HTTP requests
  - Disable with `--no-inline-css`

- **JavaScript Inlining**: `--inline-js` (default: enabled)
  - Inlines JS files directly into HTML
  - Reduces HTTP requests
  - Disable with `--no-inline-js`
  - **Note**: Incompatible with Roadroller

### Minification

- **HTML Minification**: `--html-minify` (default: enabled)
  - Removes whitespace and comments from HTML
  - Disable with `--no-html-minify`

- **JavaScript Minification**: `--terser` (default: enabled)
  - Uses Terser for aggressive JavaScript minification
  - Removes dead code, renames variables, optimizes expressions
  - Disable with `--no-terser`

## Compression Strategy

### Recommended Approach

1. **Start with defaults**: `npx l13 build`
2. **Try Roadroller**: `npx l13 build --roadroller`
3. **For competition**: Use only Deflate compression (default)
4. **For research**: Test experimental methods with `npx l13 build --experimental`
5. **Compare results**: Check all generated zip files

### Competition vs Research

**For JS13K 2025 Submissions**:

- Use only standard ZIP or Deflate compression
- Experimental methods are not allowed
- Focus on code optimization rather than advanced compression

**For Research & Development**:

- Test experimental methods to evaluate their effectiveness
- Provide feedback to the JS13K community
- Help evaluate compression methods for future competitions

### Size Optimization Tips

1. **Use Roadroller for JavaScript-heavy games** (for development/testing)
2. **Focus on code optimization** - remove unused code, minimize dependencies
3. **Disable inlining if using Roadroller**
4. **Exclude unnecessary files**: `--exclude "*.test.js"`
5. **Monitor file sizes after each build**
6. **For competition**: Stick to Deflate compression only
7. **For research**: Test experimental methods to evaluate future possibilities

## File Exclusion

Use the `--exclude` option to exclude files from processing:

```bash
# Exclude test files
npx l13 build --exclude "*.test.js" --exclude "**/*.spec.js"

# Exclude documentation
npx l13 build --exclude "docs/**" --exclude "README.md"

# Exclude development files
npx l13 build --exclude "dev/**" --exclude "*.dev.js"
```

## Environment Variables

Set these environment variables for persistent configuration:

```bash
# Enable debug logging
export DEBUG=true

# Enable Roadroller by default
export ROADROLLER=true

# Enable experimental compression
export EXPERIMENTAL=true
```

## Output Files

After building, you'll find multiple zip files in `.lab13/`:

### Competition-Ready Files

- `game-1.0.0.zip` - Standard ZIP (competition allowed)
- `lab13-{name}-1.0.0.deflate.zip` - Deflate compression (competition allowed)

### Development/Research Files

- `lab13-{name}-1.0.0.ect.zip` - ECT compression (for development)
- `lab13-{name}-1.0.0.bzip2.zip` - Bzip2 (experimental, research only)
- `lab13-{name}-1.0.0.lzma.zip` - LZMA (experimental, research only)
- `lab13-{name}-1.0.0.ppmd.zip` - PPMd (experimental, research only)

**Note**: For JS13K 2025 submissions, use only the competition-ready files. Experimental compression methods are provided for research and evaluation of future competition rules.

## Best Practices

1. **For competition**: Use only Deflate compression - test both standard ZIP and Deflate files
2. **Use Roadroller for complex JavaScript games** (development only)
3. **Keep source files organized** - easier to exclude unnecessary files
4. **Monitor build times** - some compression methods are slower
5. **Test in target browsers** - ensure compatibility after compression
6. **Focus on code optimization** - better to optimize your code than rely on advanced compression
7. **Research experimental methods** - help evaluate compression options for future competitions
