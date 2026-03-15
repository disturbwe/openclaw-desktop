import React from 'react'
import type { OpenClawPlugin } from '@/types'

// Example custom page component
const ExampleCustomPage: React.FC = () => {
  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, marginBottom: 8, background: 'linear-gradient(135deg, var(--text-primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Custom Plugin Page
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        This page is provided by an example plugin. You can create your own plugins to extend OpenClaw Desktop.
      </p>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24
      }}>
        <h3 style={{ color: 'var(--accent)', marginBottom: 16 }}>Plugin Capabilities</h3>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: 2 }}>
          <li>Add custom menu items to the sidebar</li>
          <li>Create new pages with custom functionality</li>
          <li>Add metric cards to the overview page</li>
          <li>Integrate with external services</li>
        </ul>
      </div>
    </div>
  )
}

// Export the plugin definition
const examplePlugin: OpenClawPlugin = {
  id: 'example-plugin',
  name: 'Example Plugin',
  version: '1.0.0',
  description: 'A demo plugin showing how to extend OpenClaw Desktop',
  author: 'OpenClaw Team',

  onLoad() {
    console.log('🎉 Example plugin loaded!')
  },

  onUnload() {
    console.log('👋 Example plugin unloaded')
  },

  hooks: {
    'sidebar:menu': [
      {
        icon: '🎯',
        label: 'Custom Page',
        page: 'example-page'
      }
    ],
    'page:register': [
      {
        id: 'example-page',
        label: 'Custom Page',
        icon: '🎯',
        component: React.lazy(() => Promise.resolve({ default: ExampleCustomPage }))
      }
    ]
  }
}

export default examplePlugin