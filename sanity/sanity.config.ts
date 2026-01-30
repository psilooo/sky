import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './schemaTypes'

export default defineConfig({
  name: 'sky-events-asia',
  title: 'SKY Events Asia',
  projectId: 'glybi1mo',
  dataset: 'production',
  plugins: [structureTool()],
  schema: { types: schemaTypes },
})
