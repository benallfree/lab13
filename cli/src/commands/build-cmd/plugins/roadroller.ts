import { type Input, type InputAction, type InputType, Packer, type PackerOptions } from 'roadroller'
import { type OutputChunk } from 'rollup'
import { type IndexHtmlTransformContext, type Plugin } from 'vite'
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
  const htmlInJs = `document.write('${scriptTagRemoved}');${chunk.code.trim()}`
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
  return `<script>\n${firstLine}\n${secondLine}\n</script>`
}
