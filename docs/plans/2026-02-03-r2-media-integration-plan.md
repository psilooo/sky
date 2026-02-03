# R2 Media Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Sanity's built-in asset storage with Cloudflare R2 via a Worker API, adding a Media Library tool and custom image input to Sanity Studio, and updating the Nuxt frontend to use raw R2 URLs.

**Architecture:** A Cloudflare Worker sits in front of an R2 bucket handling upload/list/delete. The Sanity Studio gets a Media Library sidebar tool and a custom image input component — both React — that call the Worker. The Nuxt frontend reads plain URL strings from Sanity and renders images directly.

**Tech Stack:** Cloudflare Workers (Wrangler), R2, Sanity v3 (React 18, @sanity/ui, @sanity/icons), Nuxt 3 (Vue 3)

---

## Task 1: Cloudflare Worker — Project Setup

**Files:**
- Create: `r2-worker/wrangler.toml`
- Create: `r2-worker/package.json`
- Create: `r2-worker/src/index.ts`

**Step 1: Create the Worker project directory**

```bash
mkdir -p /Users/sam/Desktop/SKY/r2-worker/src
```

**Step 2: Create `package.json`**

Create `/Users/sam/Desktop/SKY/r2-worker/package.json`:

```json
{
  "name": "sky-r2-worker",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "devDependencies": {
    "wrangler": "^3.0.0",
    "@cloudflare/workers-types": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Step 3: Create `wrangler.toml`**

Create `/Users/sam/Desktop/SKY/r2-worker/wrangler.toml`:

```toml
name = "sky-r2-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "sky-events-media"

[vars]
PUBLIC_BUCKET_URL = "https://media.skyeventsasia.com"
```

Note: The `API_KEY` secret will be set via `wrangler secret put API_KEY`. The `bucket_name` and `PUBLIC_BUCKET_URL` should be updated to match the actual bucket name and public domain.

**Step 4: Install dependencies**

```bash
cd /Users/sam/Desktop/SKY/r2-worker && npm install
```

**Step 5: Commit**

```bash
git add r2-worker/package.json r2-worker/wrangler.toml r2-worker/package-lock.json
git commit -m "feat: scaffold Cloudflare Worker project for R2 media API"
```

---

## Task 2: Cloudflare Worker — API Implementation

**Files:**
- Create: `r2-worker/src/index.ts`
- Create: `r2-worker/tsconfig.json`

**Step 1: Create `tsconfig.json`**

Create `/Users/sam/Desktop/SKY/r2-worker/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

**Step 2: Implement the Worker**

Create `/Users/sam/Desktop/SKY/r2-worker/src/index.ts`:

```typescript
export interface Env {
  MEDIA_BUCKET: R2Bucket
  API_KEY: string
  PUBLIC_BUCKET_URL: string
}

const ALLOWED_CATEGORIES = ['events', 'team', 'general']

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, status)
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function authenticate(request: Request, env: Env): boolean {
  const auth = request.headers.get('Authorization')
  return auth === `Bearer ${env.API_KEY}`
}

async function handleUpload(request: Request, env: Env): Promise<Response> {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const category = (formData.get('category') as string) || 'general'

  if (!file) return errorResponse('No file provided', 400)
  if (!ALLOWED_CATEGORIES.includes(category)) {
    return errorResponse(`Invalid category. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`, 400)
  }

  const timestamp = Date.now()
  const sanitized = sanitizeFilename(file.name)
  const key = `${category}/${timestamp}-${sanitized}`

  await env.MEDIA_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: file.name, category },
  })

  const url = `${env.PUBLIC_BUCKET_URL}/${key}`

  return jsonResponse({ url, key, filename: sanitized, category, size: file.size })
}

async function handleList(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const category = url.searchParams.get('category')
  const prefix = category && ALLOWED_CATEGORIES.includes(category) ? `${category}/` : undefined

  const listed = await env.MEDIA_BUCKET.list({ prefix, limit: 1000 })

  const files = listed.objects.map((obj) => ({
    key: obj.key,
    url: `${env.PUBLIC_BUCKET_URL}/${obj.key}`,
    filename: obj.key.split('/').pop() || obj.key,
    category: obj.key.split('/')[0] || 'general',
    size: obj.size,
    uploaded: obj.uploaded.toISOString(),
  }))

  return jsonResponse({ files })
}

async function handleDelete(request: Request, env: Env): Promise<Response> {
  const body = await request.json<{ key: string }>()
  if (!body.key) return errorResponse('No key provided', 400)

  await env.MEDIA_BUCKET.delete(body.key)

  return jsonResponse({ success: true, key: body.key })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    if (!authenticate(request, env)) {
      return errorResponse('Unauthorized', 401)
    }

    const url = new URL(request.url)
    const path = url.pathname

    if (request.method === 'POST' && path === '/upload') return handleUpload(request, env)
    if (request.method === 'GET' && path === '/list') return handleList(request, env)
    if (request.method === 'DELETE' && path === '/delete') return handleDelete(request, env)

    return errorResponse('Not found', 404)
  },
}
```

**Step 3: Test locally**

```bash
cd /Users/sam/Desktop/SKY/r2-worker && npx wrangler dev
```

Verify the worker starts. Test with curl (will return 401 without API key, which is expected):

```bash
curl http://localhost:8787/list
# Expected: {"error":"Unauthorized"}
```

**Step 4: Commit**

```bash
git add r2-worker/src/index.ts r2-worker/tsconfig.json
git commit -m "feat: implement R2 Worker API with upload, list, delete endpoints"
```

---

## Task 3: Sanity Studio — Install Dependencies & API Client

**Files:**
- Modify: `/Users/sam/Desktop/SKY-sanity-studio/package.json` (add dependencies)
- Create: `/Users/sam/Desktop/SKY-sanity-studio/plugins/mediaLibrary/api.ts`
- Create: `/Users/sam/Desktop/SKY-sanity-studio/.env` (template)

**Step 1: Install Sanity UI and Icons packages**

```bash
cd /Users/sam/Desktop/SKY-sanity-studio && npm install @sanity/ui @sanity/icons
```

**Step 2: Create `.env.example`**

Create `/Users/sam/Desktop/SKY-sanity-studio/.env.example`:

```
SANITY_STUDIO_R2_WORKER_URL=https://your-worker.your-subdomain.workers.dev
SANITY_STUDIO_R2_API_KEY=your-api-key-here
```

**Step 3: Create `.env` with actual values (gitignored)**

Create `/Users/sam/Desktop/SKY-sanity-studio/.env`:

```
SANITY_STUDIO_R2_WORKER_URL=http://localhost:8787
SANITY_STUDIO_R2_API_KEY=dev-api-key
```

Add `.env` to `.gitignore` if not already present:

```bash
echo ".env" >> /Users/sam/Desktop/SKY-sanity-studio/.gitignore
```

**Step 4: Create the API client**

Create `/Users/sam/Desktop/SKY-sanity-studio/plugins/mediaLibrary/api.ts`:

```typescript
export interface R2File {
  key: string
  url: string
  filename: string
  category: string
  size: number
  uploaded: string
}

interface UploadResponse {
  url: string
  key: string
  filename: string
  category: string
  size: number
}

interface ListResponse {
  files: R2File[]
}

const getWorkerUrl = () => process.env.SANITY_STUDIO_R2_WORKER_URL || ''
const getApiKey = () => process.env.SANITY_STUDIO_R2_API_KEY || ''

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getApiKey()}`,
  }
}

export async function uploadFile(file: File, category: string): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category)

  const res = await fetch(`${getWorkerUrl()}/upload`, {
    method: 'POST',
    headers: headers(),
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Upload failed')
  }

  return res.json()
}

export async function listFiles(category?: string): Promise<R2File[]> {
  const params = category ? `?category=${category}` : ''
  const res = await fetch(`${getWorkerUrl()}/list${params}`, {
    headers: headers(),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'List failed')
  }

  const data: ListResponse = await res.json()
  return data.files
}

export async function deleteFile(key: string): Promise<void> {
  const res = await fetch(`${getWorkerUrl()}/delete`, {
    method: 'DELETE',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Delete failed')
  }
}
```

**Step 5: Commit**

```bash
git add plugins/mediaLibrary/api.ts .env.example .gitignore
git commit -m "feat: add R2 Worker API client and env config for Sanity Studio"
```

---

## Task 4: Sanity Studio — Shared Media Browser Component

This React component is shared between the Media Library tool (Task 5) and the image input modal (Task 6).

**Files:**
- Create: `/Users/sam/Desktop/SKY-sanity-studio/plugins/mediaLibrary/MediaBrowser.tsx`

**Step 1: Create the MediaBrowser component**

Create `/Users/sam/Desktop/SKY-sanity-studio/plugins/mediaLibrary/MediaBrowser.tsx`:

```tsx
import React, {useState, useEffect, useCallback, useRef} from 'react'
import {
  Card,
  Stack,
  Flex,
  Grid,
  Text,
  Button,
  TextInput,
  Select,
  Spinner,
  Dialog,
  Box,
} from '@sanity/ui'
import {TrashIcon, UploadIcon, SearchIcon} from '@sanity/icons'
import {uploadFile, listFiles, deleteFile, type R2File} from './api'

const CATEGORIES = ['all', 'events', 'team', 'general'] as const

interface MediaBrowserProps {
  /** When provided, clicking an image calls this with the URL. Used in the image input modal. */
  onSelect?: (url: string) => void
  /** When true, hides delete functionality (used in input modal context). */
  selectOnly?: boolean
}

export function MediaBrowser({onSelect, selectOnly = false}: MediaBrowserProps) {
  const [files, setFiles] = useState<R2File[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('general')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const category = activeCategory === 'all' ? undefined : activeCategory
      const result = await listFiles(category)
      setFiles(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }, [activeCategory])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const handleUpload = async (fileList: FileList) => {
    setUploading(true)
    setError(null)
    try {
      for (const file of Array.from(fileList)) {
        await uploadFile(file, uploadCategory)
      }
      await fetchFiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }

  const handleDeleteSelected = async () => {
    setError(null)
    try {
      for (const key of selectedKeys) {
        await deleteFile(key)
      }
      setSelectedKeys(new Set())
      setShowDeleteConfirm(false)
      await fetchFiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const filteredFiles = files.filter((f) =>
    f.filename.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Stack space={4}>
      {/* Upload area */}
      <Card
        ref={dropRef}
        padding={4}
        border
        tone="transparent"
        style={{
          borderStyle: 'dashed',
          textAlign: 'center',
          cursor: 'pointer',
        }}
        onDrop={handleDrop}
        onDragOver={(e: React.DragEvent) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          style={{display: 'none'}}
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
        <Stack space={3}>
          {uploading ? (
            <Flex justify="center">
              <Spinner />
            </Flex>
          ) : (
            <>
              <Flex justify="center">
                <Text size={3} muted>
                  <UploadIcon />
                </Text>
              </Flex>
              <Text size={1} muted>
                Drop files here or click to upload
              </Text>
            </>
          )}
          <Flex justify="center" gap={2} align="center">
            <Text size={1} muted>
              Upload to:
            </Text>
            <Box style={{width: 140}}>
              <Select
                value={uploadCategory}
                onChange={(e) => setUploadCategory((e.target as HTMLSelectElement).value)}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <option value="events">Events</option>
                <option value="team">Team</option>
                <option value="general">General</option>
              </Select>
            </Box>
          </Flex>
        </Stack>
      </Card>

      {/* Filter bar */}
      <Flex gap={2} align="center" wrap="wrap">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            text={cat.charAt(0).toUpperCase() + cat.slice(1)}
            mode={activeCategory === cat ? 'default' : 'ghost'}
            tone={activeCategory === cat ? 'primary' : 'default'}
            onClick={() => setActiveCategory(cat)}
            fontSize={1}
            padding={2}
          />
        ))}
        <Box style={{flex: 1, minWidth: 150}}>
          <TextInput
            icon={SearchIcon}
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            fontSize={1}
          />
        </Box>
        {!selectOnly && selectedKeys.size > 0 && (
          <Button
            icon={TrashIcon}
            text={`Delete (${selectedKeys.size})`}
            tone="critical"
            onClick={() => setShowDeleteConfirm(true)}
            fontSize={1}
            padding={2}
          />
        )}
      </Flex>

      {/* Error display */}
      {error && (
        <Card padding={3} tone="critical" border>
          <Text size={1}>{error}</Text>
        </Card>
      )}

      {/* File grid */}
      {loading ? (
        <Flex justify="center" padding={5}>
          <Spinner />
        </Flex>
      ) : filteredFiles.length === 0 ? (
        <Card padding={5} border>
          <Text size={1} muted align="center">
            No files found
          </Text>
        </Card>
      ) : (
        <Grid columns={[2, 3, 4, 5]} gap={3}>
          {filteredFiles.map((file) => (
            <Card
              key={file.key}
              border
              radius={2}
              style={{
                overflow: 'hidden',
                cursor: 'pointer',
                outline: selectedKeys.has(file.key) ? '2px solid var(--card-focus-ring-color)' : undefined,
              }}
              onClick={() => {
                if (onSelect) {
                  onSelect(file.url)
                } else if (!selectOnly) {
                  toggleSelect(file.key)
                }
              }}
            >
              <Box style={{aspectRatio: '4/3', overflow: 'hidden', background: '#111'}}>
                <img
                  src={file.url}
                  alt={file.filename}
                  style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
                  loading="lazy"
                />
              </Box>
              <Box padding={2}>
                <Text size={0} textOverflow="ellipsis" style={{whiteSpace: 'nowrap', overflow: 'hidden'}}>
                  {file.filename}
                </Text>
                <Text size={0} muted>
                  {formatSize(file.size)}
                </Text>
              </Box>
            </Card>
          ))}
        </Grid>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <Dialog
          header="Confirm Delete"
          id="delete-confirm"
          onClose={() => setShowDeleteConfirm(false)}
          width={1}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Text>
                Are you sure you want to delete {selectedKeys.size} file
                {selectedKeys.size > 1 ? 's' : ''}? This cannot be undone.
              </Text>
              <Flex gap={2} justify="flex-end">
                <Button text="Cancel" mode="ghost" onClick={() => setShowDeleteConfirm(false)} />
                <Button text="Delete" tone="critical" onClick={handleDeleteSelected} />
              </Flex>
            </Stack>
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
```

**Step 2: Commit**

```bash
git add plugins/mediaLibrary/MediaBrowser.tsx
git commit -m "feat: add shared MediaBrowser React component for R2 file grid"
```

---

## Task 5: Sanity Studio — Media Library Sidebar Tool

**Files:**
- Create: `/Users/sam/Desktop/SKY-sanity-studio/plugins/mediaLibrary/index.ts`
- Create: `/Users/sam/Desktop/SKY-sanity-studio/plugins/mediaLibrary/MediaLibraryTool.tsx`
- Modify: `/Users/sam/Desktop/SKY-sanity-studio/sanity.config.ts`

**Step 1: Create the tool component**

Create `/Users/sam/Desktop/SKY-sanity-studio/plugins/mediaLibrary/MediaLibraryTool.tsx`:

```tsx
import React from 'react'
import {Card, Stack, Text} from '@sanity/ui'
import {MediaBrowser} from './MediaBrowser'

export function MediaLibraryTool() {
  return (
    <Card padding={4}>
      <Stack space={4}>
        <Text size={3} weight="bold">
          Media Library
        </Text>
        <MediaBrowser />
      </Stack>
    </Card>
  )
}
```

**Step 2: Create the plugin definition**

Create `/Users/sam/Desktop/SKY-sanity-studio/plugins/mediaLibrary/index.ts`:

```typescript
import {ImageIcon} from '@sanity/icons'
import {MediaLibraryTool} from './MediaLibraryTool'

export const mediaLibraryTool = () => ({
  title: 'Media Library',
  name: 'media-library',
  icon: ImageIcon,
  component: MediaLibraryTool,
})
```

**Step 3: Register the tool in `sanity.config.ts`**

Modify `/Users/sam/Desktop/SKY-sanity-studio/sanity.config.ts` to:

```typescript
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './schemaTypes'
import { mediaLibraryTool } from './plugins/mediaLibrary'

export default defineConfig({
  name: 'sky-events-asia',
  title: 'SKY Events Asia',
  projectId: 'glybi1mo',
  dataset: 'production',
  plugins: [structureTool()],
  tools: [mediaLibraryTool()],
  schema: { types: schemaTypes },
})
```

**Step 4: Test**

```bash
cd /Users/sam/Desktop/SKY-sanity-studio && npm run dev
```

Verify "Media Library" appears in the studio sidebar. Click it. Confirm the upload area and grid appear (grid will be empty initially; may show an error if the Worker isn't running — that's expected).

**Step 5: Commit**

```bash
git add plugins/mediaLibrary/index.ts plugins/mediaLibrary/MediaLibraryTool.tsx sanity.config.ts
git commit -m "feat: add Media Library sidebar tool to Sanity Studio"
```

---

## Task 6: Sanity Studio — Custom R2 Image Input Component

**Files:**
- Create: `/Users/sam/Desktop/SKY-sanity-studio/plugins/mediaLibrary/R2ImageInput.tsx`

**Step 1: Create the custom input component**

Create `/Users/sam/Desktop/SKY-sanity-studio/plugins/mediaLibrary/R2ImageInput.tsx`:

```tsx
import React, {useState, useCallback} from 'react'
import {type StringInputProps, set, unset} from 'sanity'
import {Card, Stack, Flex, Button, Text, Dialog, Box} from '@sanity/ui'
import {ImageIcon, TrashIcon, SearchIcon} from '@sanity/icons'
import {MediaBrowser} from './MediaBrowser'

export function R2ImageInput(props: StringInputProps) {
  const {value, onChange} = props
  const [showBrowser, setShowBrowser] = useState(false)

  const handleSelect = useCallback(
    (url: string) => {
      onChange(set(url))
      setShowBrowser(false)
    },
    [onChange],
  )

  const handleRemove = useCallback(() => {
    onChange(unset())
  }, [onChange])

  return (
    <Stack space={3}>
      {value ? (
        <Card border radius={2} style={{overflow: 'hidden'}}>
          <Box style={{aspectRatio: '16/9', overflow: 'hidden', background: '#111'}}>
            <img
              src={value}
              alt=""
              style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
            />
          </Box>
          <Flex padding={2} gap={2}>
            <Button
              icon={SearchIcon}
              text="Change"
              mode="ghost"
              onClick={() => setShowBrowser(true)}
              fontSize={1}
            />
            <Button
              icon={TrashIcon}
              text="Remove"
              mode="ghost"
              tone="critical"
              onClick={handleRemove}
              fontSize={1}
            />
          </Flex>
        </Card>
      ) : (
        <Card
          padding={5}
          border
          style={{borderStyle: 'dashed', textAlign: 'center', cursor: 'pointer'}}
          onClick={() => setShowBrowser(true)}
        >
          <Stack space={3}>
            <Flex justify="center">
              <Text size={3} muted>
                <ImageIcon />
              </Text>
            </Flex>
            <Text size={1} muted>
              Click to browse or upload media
            </Text>
          </Stack>
        </Card>
      )}

      {showBrowser && (
        <Dialog
          header="Select Media"
          id="media-browser-dialog"
          onClose={() => setShowBrowser(false)}
          width={3}
        >
          <Box padding={4}>
            <MediaBrowser onSelect={handleSelect} selectOnly />
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
```

**Step 2: Export the component from the plugin**

Update `/Users/sam/Desktop/SKY-sanity-studio/plugins/mediaLibrary/index.ts` to also export the input:

```typescript
import {ImageIcon} from '@sanity/icons'
import {MediaLibraryTool} from './MediaLibraryTool'

export const mediaLibraryTool = () => ({
  title: 'Media Library',
  name: 'media-library',
  icon: ImageIcon,
  component: MediaLibraryTool,
})

export {R2ImageInput} from './R2ImageInput'
```

**Step 3: Commit**

```bash
git add plugins/mediaLibrary/R2ImageInput.tsx plugins/mediaLibrary/index.ts
git commit -m "feat: add custom R2 image input component with media browser dialog"
```

---

## Task 7: Sanity Studio — Schema Changes

Convert all `image` type fields to `string` type fields with the `R2ImageInput` component.

**Files:**
- Modify: `/Users/sam/Desktop/SKY-sanity-studio/schemaTypes/event.ts`
- Modify: `/Users/sam/Desktop/SKY-sanity-studio/schemaTypes/mediaItem.ts`
- Modify: `/Users/sam/Desktop/SKY-sanity-studio/schemaTypes/teamMember.ts`
- Modify: `/Users/sam/Desktop/SKY-sanity-studio/schemaTypes/siteSettings.ts`

**Step 1: Update `event.ts`**

Replace the full file with:

```typescript
import { defineType, defineField } from 'sanity'
import { R2ImageInput } from '../plugins/mediaLibrary'

export const event = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'date', title: 'Date', type: 'datetime', validation: (r) => r.required() }),
    defineField({ name: 'venue', title: 'Venue', type: 'string' }),
    defineField({ name: 'location', title: 'Location', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'array', of: [{ type: 'block' }] }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'string',
      components: { input: R2ImageInput },
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [{ type: 'string', components: { input: R2ImageInput } }],
    }),
    defineField({ name: 'videoUrl', title: 'Video URL', type: 'url' }),
    defineField({ name: 'lineup', title: 'Lineup', type: 'array', of: [{ type: 'string' }] }),
  ],
  orderings: [{ title: 'Date (Newest)', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', subtitle: 'venue' },
  },
})
```

Note: `preview.media` removed since it was referencing a Sanity image field — string URLs can't be used as preview media.

**Step 2: Update `mediaItem.ts`**

Replace the full file with:

```typescript
import { defineType, defineField } from 'sanity'
import { R2ImageInput } from '../plugins/mediaLibrary'

export const mediaItem = defineType({
  name: 'mediaItem',
  title: 'Media Item',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({
      name: 'mediaType',
      title: 'Type',
      type: 'string',
      options: { list: [{ title: 'Photo', value: 'photo' }, { title: 'Video', value: 'video' }] },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'string',
      components: { input: R2ImageInput },
      hidden: ({ parent }) => parent?.mediaType === 'video',
    }),
    defineField({ name: 'videoUrl', title: 'Video URL', type: 'url', hidden: ({ parent }) => parent?.mediaType === 'photo' }),
    defineField({
      name: 'videoThumbnail',
      title: 'Video Thumbnail',
      type: 'string',
      components: { input: R2ImageInput },
      hidden: ({ parent }) => parent?.mediaType === 'photo',
    }),
    defineField({ name: 'event', title: 'Event', type: 'reference', to: [{ type: 'event' }] }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'uploadDate', title: 'Upload Date', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'mediaType' },
  },
})
```

**Step 3: Update `teamMember.ts`**

Replace the full file with:

```typescript
import { defineType, defineField } from 'sanity'
import { R2ImageInput } from '../plugins/mediaLibrary'

export const teamMember = defineType({
  name: 'teamMember',
  title: 'Team Member',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'role', title: 'Role', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'bio', title: 'Bio', type: 'text' }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'string',
      components: { input: R2ImageInput },
    }),
    defineField({ name: 'order', title: 'Display Order', type: 'number' }),
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', subtitle: 'role' },
  },
})
```

**Step 4: Update `siteSettings.ts`**

Replace the full file with:

```typescript
import { defineType, defineField } from 'sanity'
import { R2ImageInput } from '../plugins/mediaLibrary'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'heroTagline', title: 'Hero Tagline', type: 'string' }),
    defineField({ name: 'heroVideoUrl', title: 'Hero Video URL', type: 'url' }),
    defineField({
      name: 'heroFallbackImage',
      title: 'Hero Fallback Image',
      type: 'string',
      components: { input: R2ImageInput },
    }),
    defineField({ name: 'aboutTeaser', title: 'About Teaser (one-liner)', type: 'string' }),
    defineField({
      name: 'aboutStory',
      title: 'About Story',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'aboutHeroImage',
      title: 'About Hero Image',
      type: 'string',
      components: { input: R2ImageInput },
    }),
    defineField({ name: 'aboutTagline', title: 'About Tagline', type: 'string' }),
    defineField({ name: 'contactEmail', title: 'Contact Email', type: 'string' }),
    defineField({ name: 'contactPhone', title: 'Contact Phone', type: 'string' }),
    defineField({ name: 'contactTagline', title: 'Contact Tagline', type: 'string' }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'platform', title: 'Platform', type: 'string', options: { list: ['instagram', 'facebook', 'youtube', 'soundcloud', 'tiktok', 'twitter'] } }),
          defineField({ name: 'url', title: 'URL', type: 'url' }),
        ],
        preview: { select: { title: 'platform', subtitle: 'url' } },
      }],
    }),
  ],
})
```

Note: `aboutStory` no longer supports inline images in portable text (removed `{ type: 'image' }` from the `of` array). Inline images in rich text would require a separate custom portable text block type — that's a potential follow-up if needed.

**Step 5: Test**

```bash
cd /Users/sam/Desktop/SKY-sanity-studio && npm run dev
```

Open the studio. Verify each content type shows the custom R2 image input instead of the default Sanity image uploader. Click "Browse Media" on any image field and confirm the dialog opens.

**Step 6: Commit**

```bash
git add schemaTypes/event.ts schemaTypes/mediaItem.ts schemaTypes/teamMember.ts schemaTypes/siteSettings.ts
git commit -m "feat: convert all image fields to R2 string fields with custom input"
```

---

## Task 8: Nuxt Frontend — New Composable & Remove Old One

**Files:**
- Delete: `/Users/sam/Desktop/SKY/composables/useSanityImage.ts`
- Create: `/Users/sam/Desktop/SKY/composables/useR2Image.ts`

**Step 1: Create `useR2Image.ts`**

Create `/Users/sam/Desktop/SKY/composables/useR2Image.ts`:

```typescript
/**
 * Returns the image URL as-is if it exists, or an empty string.
 * Images are served directly from R2 CDN — no transformations needed.
 */
export function useR2Image() {
  function imageUrl(url: string | null | undefined): string {
    return url || ''
  }

  return { imageUrl }
}
```

**Step 2: Delete `useSanityImage.ts`**

```bash
rm /Users/sam/Desktop/SKY/composables/useSanityImage.ts
```

**Step 3: Remove `@sanity/image-url` dependency**

```bash
cd /Users/sam/Desktop/SKY && npm uninstall @sanity/image-url
```

**Step 4: Commit**

```bash
git add composables/useR2Image.ts package.json package-lock.json
git rm composables/useSanityImage.ts
git commit -m "feat: replace Sanity image URL builder with R2 image composable"
```

---

## Task 9: Nuxt Frontend — Update All Components

**Files:**
- Modify: `/Users/sam/Desktop/SKY/components/EventCard.vue`
- Modify: `/Users/sam/Desktop/SKY/components/MediaGrid.vue`
- Modify: `/Users/sam/Desktop/SKY/components/MediaHighlight.vue`
- Modify: `/Users/sam/Desktop/SKY/components/MediaLightbox.vue`
- Modify: `/Users/sam/Desktop/SKY/components/HeroSection.vue`
- Modify: `/Users/sam/Desktop/SKY/components/TeamCard.vue`

**Step 1: Update `EventCard.vue`**

In `<script setup>`:
- Remove: `const { urlFor } = useSanityImageUrl()`
- Add: `const { imageUrl } = useR2Image()`

In `<template>`:
- Line with featured image: change `:src="urlFor(event.featuredImage).width(1708).height(750).url()"` to `:src="imageUrl(event.featuredImage)"`
- Line with gallery images: change `:src="urlFor(img).width(300).height(200).url()"` to `:src="imageUrl(img)"`

Full updated file:

```vue
<script setup lang="ts">
import { gsap } from 'gsap'
import type { SanityDocument } from '@sanity/client'

const props = defineProps<{ event: SanityDocument; expanded: boolean }>()
const emit = defineEmits<{ toggle: [id: string] }>()
const { imageUrl } = useR2Image()
const contentRef = ref<HTMLElement | null>(null)

watch(() => props.expanded, (val) => {
  if (!contentRef.value) return
  if (val) {
    gsap.fromTo(contentRef.value, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.5, ease: 'power2.out' })
  } else {
    gsap.to(contentRef.value, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.in' })
  }
})
</script>

<template>
  <div
    class="group relative overflow-hidden rounded-lg border border-white/5 hover:border-accent/30 transition-all duration-300"
    :class="expanded ? 'border-accent/30 shadow-[0_0_40px_rgba(0,229,255,0.08)]' : ''"
  >
    <!-- Card header (always visible) -->
    <button class="w-full text-left" @click="emit('toggle', event._id)">
      <div class="relative aspect-[1708/750] overflow-hidden">
        <img
          v-if="event.featuredImage"
          :src="imageUrl(event.featuredImage)"
          :alt="event.title"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-transparent" />
        <div class="absolute bottom-0 left-0 right-0 p-6">
          <h3 class="font-display text-3xl md:text-4xl tracking-wider">{{ event.title }}</h3>
          <div class="flex items-center gap-4 mt-2 text-white/60">
            <span>{{ new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}</span>
            <span v-if="event.venue" class="text-accent">{{ event.venue }}</span>
            <span v-if="event.location">{{ event.location }}</span>
          </div>
        </div>
      </div>
    </button>

    <!-- Expanded content -->
    <div ref="contentRef" class="h-0 opacity-0 overflow-hidden">
      <div class="p-6 space-y-6">
        <!-- Description -->
        <div v-if="event.description" class="prose prose-invert max-w-none">
          <SanityContent :blocks="event.description" />
        </div>

        <!-- Lineup -->
        <div v-if="event.lineup?.length">
          <h4 class="font-display text-xl tracking-wider mb-3">LINEUP</h4>
          <div class="flex flex-wrap gap-2">
            <span v-for="artist in event.lineup" :key="artist" class="px-3 py-1 bg-white/5 rounded-full text-sm text-white/80">
              {{ artist }}
            </span>
          </div>
        </div>

        <!-- Gallery -->
        <div v-if="event.gallery?.length">
          <h4 class="font-display text-xl tracking-wider mb-3">GALLERY</h4>
          <div class="grid grid-cols-3 md:grid-cols-4 gap-2">
            <img
              v-for="(img, i) in event.gallery"
              :key="i"
              :src="imageUrl(img)"
              :alt="`${event.title} gallery ${i + 1}`"
              class="w-full aspect-[3/2] object-cover rounded"
            />
          </div>
        </div>

        <!-- Video -->
        <div v-if="event.videoUrl">
          <h4 class="font-display text-xl tracking-wider mb-3">RECAP</h4>
          <div class="aspect-video rounded overflow-hidden">
            <iframe :src="event.videoUrl" class="w-full h-full" allowfullscreen />
          </div>
        </div>

        <!-- Close button -->
        <button
          class="font-display text-sm tracking-widest uppercase text-white/40 hover:text-accent transition-colors"
          @click="emit('toggle', event._id)"
        >
          Close ✕
        </button>
      </div>
    </div>
  </div>
</template>
```

**Step 2: Update `MediaGrid.vue`**

```vue
<script setup lang="ts">
const props = defineProps<{ items: any[] }>()
const emit = defineEmits<{ select: [index: number] }>()
const { imageUrl } = useR2Image()

const containerRef = ref<HTMLElement | null>(null)
useStaggerReveal(containerRef, '.media-card')

function getSize(item: any, index: number): string {
  if (item.featured) return 'col-span-2 row-span-2'
  if (index % 5 === 0) return 'col-span-2'
  return ''
}
</script>

<template>
  <div ref="containerRef" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-[200px] md:auto-rows-[250px]">
    <div
      v-for="(item, i) in items"
      :key="item._id"
      class="media-card relative overflow-hidden rounded-lg cursor-pointer group"
      :class="getSize(item, i)"
      @click="emit('select', i)"
    >
      <img
        v-if="item.image || item.videoThumbnail"
        :src="imageUrl(item.mediaType === 'photo' ? item.image : item.videoThumbnail)"
        :alt="item.caption || item.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div v-else class="w-full h-full bg-dark-card flex items-center justify-center">
        <span class="text-white/20 font-display text-sm">{{ item.title }}</span>
      </div>
      <div class="absolute inset-0 bg-dark/0 group-hover:bg-dark/50 transition-colors flex items-center justify-center">
        <span v-if="item.mediaType === 'video'" class="text-4xl opacity-70 group-hover:opacity-100 transition-opacity">&#9654;</span>
      </div>
      <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-dark/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <p v-if="item.eventTitle" class="text-xs text-accent">{{ item.eventTitle }}</p>
        <p v-if="item.caption" class="text-sm text-white/80">{{ item.caption }}</p>
      </div>
    </div>
  </div>
</template>
```

**Step 3: Update `MediaHighlight.vue`**

```vue
<script setup lang="ts">
const query = groq`*[_type == "mediaItem" && featured == true] | order(uploadDate desc) [0..4] {
  _id, title, mediaType, image, videoUrl, videoThumbnail, caption,
  "eventTitle": event->title
}`
const { data: items } = await useSanityQuery(query)
const { imageUrl } = useR2Image()

const containerRef = ref<HTMLElement | null>(null)
useStaggerReveal(containerRef, '.media-item')
</script>

<template>
  <section v-if="items?.length" class="pt-12 pb-24 px-6">
    <div class="max-w-7xl mx-auto">
      <h2 class="font-display text-4xl md:text-5xl tracking-wider mb-12">MEDIA</h2>
      <div ref="containerRef" class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <NuxtLink
          v-for="(item, i) in items"
          :key="item._id"
          to="/media"
          class="media-item relative overflow-hidden rounded-lg group"
          :class="i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-[4/3]'"
        >
          <img
            v-if="item.image || item.videoThumbnail"
            :src="imageUrl(item.mediaType === 'photo' ? item.image : item.videoThumbnail)"
            :alt="item.caption || item.title"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div v-else class="w-full h-full bg-dark-card flex items-center justify-center">
            <span class="text-white/20 font-display text-lg">{{ item.title }}</span>
          </div>
          <div class="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span v-if="item.mediaType === 'video'" class="text-4xl">▶</span>
          </div>
        </NuxtLink>
      </div>
      <div class="text-center mt-8">
        <NuxtLink to="/media" class="font-display text-sm tracking-widest uppercase text-accent hover:text-white transition-colors">
          View All →
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
```

**Step 4: Update `MediaLightbox.vue`**

```vue
<script setup lang="ts">
const props = defineProps<{
  items: any[]
  currentIndex: number
  open: boolean
}>()
const emit = defineEmits<{ close: []; navigate: [index: number] }>()
const { imageUrl } = useR2Image()

const current = computed(() => props.items[props.currentIndex])

function next() { emit('navigate', (props.currentIndex + 1) % props.items.length) }
function prev() { emit('navigate', (props.currentIndex - 1 + props.items.length) % props.items.length) }

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
  if (e.key === 'ArrowRight') next()
  if (e.key === 'ArrowLeft') prev()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div v-if="open" class="fixed inset-0 z-50 bg-dark/95 flex items-center justify-center" @click.self="emit('close')">
        <button class="absolute top-6 right-6 text-white/60 hover:text-white text-2xl" @click="emit('close')">&#10005;</button>
        <button class="absolute left-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl" @click="prev">&#8249;</button>
        <button class="absolute right-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl" @click="next">&#8250;</button>

        <div class="max-w-5xl max-h-[85vh] w-full mx-6">
          <img
            v-if="current?.mediaType === 'photo' && current?.image"
            :src="imageUrl(current.image)"
            :alt="current.caption || current.title"
            class="w-full h-full object-contain"
          />
          <div v-else-if="current?.mediaType === 'photo'" class="flex items-center justify-center h-64">
            <span class="text-white/30 font-display text-xl">No image available</span>
          </div>
          <div v-else-if="current?.mediaType === 'video'" class="aspect-video">
            <iframe :src="current.videoUrl" class="w-full h-full" allowfullscreen />
          </div>
          <p v-if="current?.caption" class="text-center text-white/50 mt-4">{{ current.caption }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lightbox-enter-active, .lightbox-leave-active { transition: opacity 0.3s ease; }
.lightbox-enter-from, .lightbox-leave-to { opacity: 0; }
</style>
```

**Step 5: Update `HeroSection.vue`**

```vue
<script setup lang="ts">
import { gsap } from 'gsap'

const query = groq`*[_type == "siteSettings"][0]{ heroTagline, heroVideoUrl, heroFallbackImage }`
const { data: settings } = await useSanityQuery(query)
const { imageUrl } = useR2Image()

const heroRef = ref<HTMLElement | null>(null)
const taglineRef = ref<HTMLElement | null>(null)
const scrollIndicator = ref<HTMLElement | null>(null)

onMounted(() => {
  if (taglineRef.value) {
    gsap.from(taglineRef.value, { opacity: 0, y: 30, duration: 1.5, delay: 0.5, ease: 'power3.out' })
  }
  if (scrollIndicator.value) {
    gsap.to(scrollIndicator.value, { y: 10, repeat: -1, yoyo: true, duration: 1.5, ease: 'power1.inOut' })
  }
  if (heroRef.value) {
    gsap.to(heroRef.value, {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: { trigger: heroRef.value, start: 'top top', end: 'bottom top', scrub: true },
    })
  }
})
</script>

<template>
  <section class="relative h-screen overflow-hidden flex items-center justify-center">
    <div ref="heroRef" class="absolute inset-0">
      <!-- Video on desktop -->
      <video
        v-if="settings?.heroVideoUrl"
        autoplay
        loop
        muted
        playsinline
        poster="/hero-poster.jpg"
        preload="metadata"
        class="hidden md:block w-full h-full object-cover"
      >
        <source :src="settings.heroVideoUrl" type="video/mp4" />
      </video>
      <!-- Fallback image (shown on mobile, or when no video) -->
      <img
        v-if="settings?.heroFallbackImage"
        :src="imageUrl(settings.heroFallbackImage)"
        alt=""
        class="w-full h-full object-cover"
        :class="settings?.heroVideoUrl ? 'md:hidden' : ''"
      />
    </div>
    <!-- Logo -->
    <div ref="taglineRef" class="relative z-10">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="-57 0 445.613 334.189" class="w-64 md:w-96 lg:w-[500px] fill-white">
        <path d="M360.522,193.273c15.151-.49,28.173,12.558,28.091,28.166-.083,15.78-12.661,27.941-28.515,28.129-14.945.178-28.331-13.022-28.064-28.822.229-13.573,12.21-28.226,28.489-27.473Z"/>
        <text font-family="Anton-Regular, Anton" font-size="266.208" letter-spacing="-.054em" transform="translate(0 247.49)"><tspan x="0" y="0">SEA</tspan></text>
        <text font-family="Anton-Regular, Anton" font-size="60.49" letter-spacing="-.054em" transform="translate(5.46 311.578)"><tspan x="0" y="0">SKY EVENTS ASIA</tspan></text>
      </svg>
    </div>
    <!-- Scroll indicator -->
    <div ref="scrollIndicator" class="absolute bottom-8 left-1/2 -translate-x-1/2 text-accent drop-shadow-[0_0_6px_rgba(0,229,255,0.5)]">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7" />
      </svg>
    </div>
  </section>
</template>
```

**Step 6: Update `TeamCard.vue`**

```vue
<script setup lang="ts">
defineProps<{ member: { name: string; role: string; bio?: string; photo?: string } }>()
const { imageUrl } = useR2Image()
</script>

<template>
  <div class="group text-center">
    <div class="relative overflow-hidden rounded-lg aspect-[3/4] mb-4">
      <img
        v-if="member.photo"
        :src="imageUrl(member.photo)"
        :alt="member.name"
        class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
      />
    </div>
    <h3 class="font-display text-xl tracking-wider">{{ member.name }}</h3>
    <p class="text-accent text-sm mt-1">{{ member.role }}</p>
    <p v-if="member.bio" class="text-white/50 text-sm mt-2 max-w-xs mx-auto">{{ member.bio }}</p>
  </div>
</template>
```

**Step 7: Commit**

```bash
git add components/EventCard.vue components/MediaGrid.vue components/MediaHighlight.vue components/MediaLightbox.vue components/HeroSection.vue components/TeamCard.vue
git commit -m "feat: update all components to use R2 image URLs instead of Sanity image builder"
```

---

## Task 10: End-to-End Verification

**Step 1: Start the R2 Worker locally**

```bash
cd /Users/sam/Desktop/SKY/r2-worker && npx wrangler dev
```

Set a local API key secret when prompted, or use `wrangler secret put API_KEY` for local dev.

**Step 2: Start Sanity Studio**

```bash
cd /Users/sam/Desktop/SKY-sanity-studio && npm run dev
```

Verify:
- "Media Library" tab visible in sidebar
- Can upload an image via drag-and-drop (select a category)
- Image appears in the grid after upload
- Can select and delete images

**Step 3: Test the image input on a content document**

- Open any Event document
- Click the Featured Image field
- Verify the media browser dialog opens
- Upload a new image or select an existing one
- Verify the R2 URL is stored and the preview thumbnail shows

**Step 4: Start the Nuxt frontend**

```bash
cd /Users/sam/Desktop/SKY && npm run dev
```

Verify images render correctly from R2 URLs on all pages.

**Step 5: Commit any fixes**

If any fixes were needed during verification, commit them.

---

## Summary of All Files

### Created:
- `r2-worker/package.json`
- `r2-worker/wrangler.toml`
- `r2-worker/tsconfig.json`
- `r2-worker/src/index.ts`
- `SKY-sanity-studio/plugins/mediaLibrary/api.ts`
- `SKY-sanity-studio/plugins/mediaLibrary/MediaBrowser.tsx`
- `SKY-sanity-studio/plugins/mediaLibrary/MediaLibraryTool.tsx`
- `SKY-sanity-studio/plugins/mediaLibrary/R2ImageInput.tsx`
- `SKY-sanity-studio/plugins/mediaLibrary/index.ts`
- `SKY-sanity-studio/.env.example`
- `SKY/composables/useR2Image.ts`

### Modified:
- `SKY-sanity-studio/sanity.config.ts`
- `SKY-sanity-studio/schemaTypes/event.ts`
- `SKY-sanity-studio/schemaTypes/mediaItem.ts`
- `SKY-sanity-studio/schemaTypes/teamMember.ts`
- `SKY-sanity-studio/schemaTypes/siteSettings.ts`
- `SKY/components/EventCard.vue`
- `SKY/components/MediaGrid.vue`
- `SKY/components/MediaHighlight.vue`
- `SKY/components/MediaLightbox.vue`
- `SKY/components/HeroSection.vue`
- `SKY/components/TeamCard.vue`

### Deleted:
- `SKY/composables/useSanityImage.ts`

### Removed dependency:
- `@sanity/image-url` from `SKY/package.json`
