export interface Env {
  MEDIA_BUCKET: R2Bucket
  API_KEY: string
  PUBLIC_BUCKET_URL: string
}

const ALLOWED_CATEGORIES = ['events', 'team', 'general']
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/quicktime', 'video/webm']
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const FOLDER_NAME_RE = /^[a-z0-9_-]+$/i

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
  const folder = (formData.get('folder') as string) || ''

  if (!file) return errorResponse('No file provided', 400)
  if (file.size > MAX_FILE_SIZE) {
    return errorResponse(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`, 400)
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return errorResponse(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`, 400)
  }
  if (!ALLOWED_CATEGORIES.includes(category)) {
    return errorResponse(`Invalid category. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`, 400)
  }
  if (folder && !FOLDER_NAME_RE.test(folder)) {
    return errorResponse('Invalid folder name. Use only letters, numbers, hyphens, and underscores', 400)
  }

  const timestamp = Date.now()
  const sanitized = sanitizeFilename(file.name)
  const key = folder
    ? `${category}/${folder}/${timestamp}-${sanitized}`
    : `${category}/${timestamp}-${sanitized}`

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
  const folder = url.searchParams.get('folder')

  // No category = flat list of all files (no folder browsing)
  if (!category || !ALLOWED_CATEGORIES.includes(category)) {
    const listed = await env.MEDIA_BUCKET.list({ limit: 1000 })
    const files = listed.objects
      .filter((obj) => !obj.key.endsWith('/.folder'))
      .map((obj) => ({
      key: obj.key,
      url: `${env.PUBLIC_BUCKET_URL}/${obj.key}`,
      filename: obj.key.split('/').pop() || obj.key,
      category: obj.key.split('/')[0] || 'general',
      size: obj.size,
      uploaded: obj.uploaded.toISOString(),
    }))
    return jsonResponse({ files, folders: [] })
  }

  // Category specified — use delimiter to discover folders
  const prefix = folder && FOLDER_NAME_RE.test(folder)
    ? `${category}/${folder}/`
    : `${category}/`

  const listed = await env.MEDIA_BUCKET.list({ prefix, delimiter: '/', limit: 1000 })

  // Filter out .folder marker files from objects
  const files = listed.objects
    .filter((obj) => !obj.key.endsWith('/.folder'))
    .map((obj) => ({
      key: obj.key,
      url: `${env.PUBLIC_BUCKET_URL}/${obj.key}`,
      filename: obj.key.split('/').pop() || obj.key,
      category: obj.key.split('/')[0] || 'general',
      size: obj.size,
      uploaded: obj.uploaded.toISOString(),
    }))

  // Extract folder names from delimited prefixes
  const folders = (listed.delimitedPrefixes || []).map((p) => {
    // prefix is "category/" or "category/folder/", delimitedPrefix is "category/subfolder/"
    const stripped = p.slice(prefix.length) // "subfolder/"
    return stripped.replace(/\/$/, '') // "subfolder"
  }).filter(Boolean)

  return jsonResponse({ files, folders })
}

async function handleCreateFolder(request: Request, env: Env): Promise<Response> {
  let body: { category: string; folder: string }
  try {
    body = await request.json<{ category: string; folder: string }>()
  } catch {
    return errorResponse('Invalid JSON body', 400)
  }

  if (!body.category || !ALLOWED_CATEGORIES.includes(body.category)) {
    return errorResponse(`Invalid category. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`, 400)
  }
  if (!body.folder || !FOLDER_NAME_RE.test(body.folder)) {
    return errorResponse('Invalid folder name. Use only letters, numbers, hyphens, and underscores', 400)
  }

  const key = `${body.category}/${body.folder}/.folder`
  await env.MEDIA_BUCKET.put(key, new ArrayBuffer(0))

  return jsonResponse({ success: true, category: body.category, folder: body.folder })
}

async function handleDelete(request: Request, env: Env): Promise<Response> {
  let body: { key: string }
  try {
    body = await request.json<{ key: string }>()
  } catch {
    return errorResponse('Invalid JSON body', 400)
  }
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
    if (request.method === 'POST' && path === '/create-folder') return handleCreateFolder(request, env)
    if (request.method === 'GET' && path === '/list') return handleList(request, env)
    if (request.method === 'DELETE' && path === '/delete') return handleDelete(request, env)

    return errorResponse('Not found', 404)
  },
}
