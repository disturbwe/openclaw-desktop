import { pluginRegistry } from './registry'
import type { OpenClawPlugin } from '@/types'

// Import example plugins
import examplePlugin from './examples/example-plugin'

// List of built-in plugins to load
const builtInPlugins: OpenClawPlugin[] = [
  examplePlugin,
  // Add more plugins here as needed
]

// Load all built-in plugins
export function loadBuiltInPlugins() {
  builtInPlugins.forEach(plugin => {
    pluginRegistry.register(plugin)
  })
}

// Re-export for convenience
export { pluginRegistry }