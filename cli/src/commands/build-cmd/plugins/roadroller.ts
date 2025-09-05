import htmlMinify from 'html-minifier-terser'
import { Packer, type Input, type InputAction, type InputType, type PackerOptions } from 'roadroller'
import { type OutputChunk } from 'rollup'
import { minify, type ECMA } from 'terser'
import { type IndexHtmlTransformContext, type Plugin } from 'vite'
import { defaultHtmlMinifyOptions } from './html-minify'
import { addDefaultValues, escapeRegExp } from './utils'

export type RoadrollerOptions = {
  packerOptions?: PackerOptions
  debug?: boolean
}

/**
 * Creates the Roadroller plugin that crunches the JS.
 *
 * Based on Rob Louie's recommendations:
 * See: https://github.com/codyebberson/js13k-starter-2022/pull/1
 *
 * @returns The roadroller plugin.
 */
export function roadrollerPlugin(options?: RoadrollerOptions): Plugin {
  const { debug = false, packerOptions = {} } = options || {}
  const dbg = (...args: any[]) => (debug ? console.log(`[DEBUG] [roadroller]`, ...args) : undefined)
  const fullRoadrollerOptions = addDefaultValues(packerOptions, {})
  return {
    name: 'vite:roadroller',
    transformIndexHtml: {
      order: 'post',
      handler: async (html: string, ctx?: IndexHtmlTransformContext): Promise<string> => {
        dbg('Roadrolling index.html')

        // Only use this plugin during build
        if (!ctx || !ctx.bundle) {
          return html
        }

        let result = html

        const bundleKeys = Object.keys(ctx.bundle)

        const jsKey = bundleKeys.find((key) => key.endsWith('.js'))
        if (jsKey) {
          dbg(`Inlining JS: ${jsKey}`)
          result = await embedJs(result, ctx.bundle[jsKey] as OutputChunk, fullRoadrollerOptions)
          delete ctx.bundle[jsKey]
        }

        return result
      },
    },
  }
}

/**
 * Transforms the given JavaScript code into a packed version.
 * @param html The original HTML.
 * @param chunk The JavaScript output chunk from Rollup/Vite.
 * @returns The transformed HTML with the JavaScript embedded.
 */
async function embedJs(html: string, chunk: OutputChunk, options: PackerOptions): Promise<string> {
  const scriptTagRemoved = html.replace(new RegExp(`<script[^>]*?${escapeRegExp(chunk.fileName)}[^>]*?></script>`), '')
  const htmlInJs = `var rr = { h: ${JSON.stringify(scriptTagRemoved)}, m: ${JSON.stringify(chunk.code.trim())} }`
  const inputs: Input[] = [
    {
      data: htmlInJs,
      type: 'js' as InputType,
      action: 'eval' as InputAction,
    },
  ]
  const packer = new Packer(inputs, options)
  await packer.optimize(2)
  const { firstLine, secondLine } = packer.makeDecoder()
  // console.log(`first line`, firstLine)
  // console.log(`\n\n\nsecond line`, secondLine)
  // console.log(`\n\n\nhtml in js`, htmlInJs)
  const js = `
  ${firstLine}
  ${secondLine}
  document.write(rr.h) // index.html
  const script = document.createElement('script')
  script.type = 'module'
  script.innerHTML = rr.m // ESM code
  document.head.appendChild(script)
  `

  const minifiedJs = await minify(js, {
    compress: {
      ecma: 2022 as ECMA,
      drop_console: true,
      drop_debugger: true,
      defaults: true,
      ie8: false,
      reduce_funcs: true,
      arrows: true,
      arguments: true,
      booleans: true,
      booleans_as_integers: false,
      collapse_vars: true,
      comparisons: true,
      conditionals: true,
      dead_code: true,
      directives: true,
      evaluate: true,
      expression: false,
      hoist_funs: true,
      hoist_props: true,
      hoist_vars: false,
      if_return: true,
      inline: true,
      join_vars: true,
      keep_classnames: false,
      keep_fargs: false,
      keep_fnames: false,
      keep_infinity: false,
      loops: true,
      module: true,
      negate_iife: true,
      passes: 5,
      properties: true,
      computed_props: true,
      pure_getters: true,
      reduce_vars: true,
      sequences: 1000000,
      side_effects: true,
      switches: true,
      toplevel: true,
      top_retain: null,
      typeofs: true,
      unsafe: true,
      unsafe_arrows: true,
      unsafe_comps: true,
      unsafe_Function: true,
      unsafe_math: true,
      unsafe_symbols: true,
      unsafe_methods: true,
      unsafe_proto: true,
      unsafe_regexp: true,
      unsafe_undefined: true,
      unused: true,
    },
    mangle: {
      safari10: false,
      eval: true,
      keep_classnames: false,
      keep_fnames: false,
      module: true,
      toplevel: true,
    },
  })

  const final = `<script>${minifiedJs.code}</script>`
  // console.log(`\n\n\nfinal`, final)
  const minifiedFinal = await htmlMinify.minify(final, defaultHtmlMinifyOptions)
  return minifiedFinal
}
