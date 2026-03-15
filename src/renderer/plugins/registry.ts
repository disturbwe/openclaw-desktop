import type { OpenClawPlugin, MenuItem, PageDefinition, MetricCardDefinition } from '@/types'

class PluginRegistry {
  private plugins = new Map<string, OpenClawPlugin>()
  private hooks = {
    'sidebar:menu': [] as MenuItem[],
    'page:register': [] as PageDefinition[],
    'metric:card': [] as MetricCardDefinition[],
  }

  register(plugin: OpenClawPlugin) {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} already registered`)
      return
    }
    this.plugins.set(plugin.id, plugin)

    // Register hooks
    if (plugin.hooks) {
      Object.entries(plugin.hooks).forEach(([hook, value]) => {
        if (Array.isArray(value) && hook in this.hooks) {
          (this.hooks[hook as keyof typeof this.hooks] as unknown[]).push(...value)
        }
      })
    }

    plugin.onLoad?.()
    console.log(`Plugin loaded: ${plugin.name} v${plugin.version}`)
  }

  unregister(pluginId: string) {
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      plugin.onUnload?.()
      this.plugins.delete(pluginId)
      console.log(`Plugin unloaded: ${plugin.name}`)
    }
  }

  getHook<K extends keyof typeof this.hooks>(name: K): typeof this.hooks[K] {
    return this.hooks[name]
  }

  getAllPlugins() {
    return Array.from(this.plugins.values())
  }

  getPlugin(id: string) {
    return this.plugins.get(id)
  }
}

export const pluginRegistry = new PluginRegistry()

// Plugin loader for user plugins
export async function loadUserPlugins() {
  // In Electron, this would load from ~/.openclaw/plugins/
  // For now, it's a placeholder that can be extended
  console.log('Plugin system initialized')
}