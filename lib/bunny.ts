/**
 * Bunny.net CDN Integration
 *
 * Handles video uploads via Bunny Stream and file storage via Bunny Storage.
 * Stream: video/audio upload, encoding, HLS delivery
 * Storage: thumbnails, documents, general assets
 */

import { createHash } from 'crypto'

// Bunny Stream (Video Library)
const STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY || ''
const STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID || ''
const STREAM_CDN_HOSTNAME = process.env.BUNNY_STREAM_CDN_HOSTNAME || ''

// Bunny Storage (General assets)
const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || ''
const STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD || ''
const STORAGE_CDN_HOSTNAME = process.env.BUNNY_STORAGE_CDN_HOSTNAME || ''

// --- Types ---

export interface BunnyVideo {
  guid: string
  title: string
  length: number
  status: number
  encodeProgress: number
  thumbnailUrl: string
  videoUrl: string
  dateUploaded: string
  storageSize: number
  category: string
  collectionId: string
}

export interface BunnyStorageFile {
  Guid: string
  ObjectName: string
  Path: string
  Length: number
  DateCreated: string
  ContentType: string
  IsDirectory: boolean
}

interface StreamListResponse {
  totalItems: number
  currentPage: number
  itemsPerPage: number
  items: Array<{
    guid?: string
    title?: string
    length?: number
    status?: number
    encodeProgress?: number
    thumbnailFileName?: string
    dateUploaded?: string
    storageSize?: number
    category?: string
    collectionId?: string
  }>
}

// --- Stream (Video) ---

function streamHeaders(): Record<string, string> {
  return {
    AccessKey: STREAM_API_KEY,
    accept: 'application/json',
  }
}

/**
 * Create a video placeholder in Bunny Stream (Step 1 of upload flow).
 * Returns the guid needed for both PUT and TUS uploads.
 */
export async function createVideoObject(
  title: string,
  collectionId?: string
): Promise<{ guid: string }> {
  if (!STREAM_API_KEY || !STREAM_LIBRARY_ID) {
    throw new Error(
      'Bunny Stream not configured: missing BUNNY_STREAM_API_KEY or BUNNY_STREAM_LIBRARY_ID'
    )
  }

  const createBody: Record<string, string> = { title }
  if (collectionId) createBody.collectionId = collectionId

  const res = await fetch(`https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos`, {
    method: 'POST',
    headers: { ...streamHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(createBody),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to create video: ${res.status} ${text}`)
  }

  return (await res.json()) as { guid: string }
}

/**
 * Create a video placeholder in Bunny Stream, then upload the file to it.
 */
export async function uploadVideo(
  file: Uint8Array,
  title: string,
  collectionId?: string
): Promise<BunnyVideo> {
  if (!STREAM_API_KEY || !STREAM_LIBRARY_ID) {
    throw new Error(
      'Bunny Stream not configured: missing BUNNY_STREAM_API_KEY or BUNNY_STREAM_LIBRARY_ID'
    )
  }

  // Step 1: Create video object
  const createBody: Record<string, string> = { title }
  if (collectionId) createBody.collectionId = collectionId

  const createRes = await fetch(`https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos`, {
    method: 'POST',
    headers: { ...streamHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(createBody),
  })

  if (!createRes.ok) {
    const text = await createRes.text()
    throw new Error(`Failed to create video: ${createRes.status} ${text}`)
  }

  const created = (await createRes.json()) as { guid: string }

  // Step 2: Upload the actual file
  const uploadRes = await fetch(
    `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos/${created.guid}`,
    {
      method: 'PUT',
      headers: {
        AccessKey: STREAM_API_KEY,
        'Content-Type': 'application/octet-stream',
      },
      body: file as unknown as BodyInit,
    }
  )

  if (!uploadRes.ok) {
    const text = await uploadRes.text()
    throw new Error(`Failed to upload video: ${uploadRes.status} ${text}`)
  }

  return {
    guid: created.guid,
    title,
    length: 0,
    status: 1, // Processing
    encodeProgress: 0,
    thumbnailUrl: `https://${STREAM_CDN_HOSTNAME}/${created.guid}/thumbnail.jpg`,
    videoUrl: `https://${STREAM_CDN_HOSTNAME}/${created.guid}/playlist.m3u8`,
    dateUploaded: new Date().toISOString(),
    storageSize: file.byteLength,
    category: '',
    collectionId: collectionId || '',
  }
}

/**
 * List videos from Bunny Stream library.
 */
export async function listVideos(
  page = 1,
  itemsPerPage = 50,
  collectionId?: string
): Promise<{ videos: BunnyVideo[]; totalItems: number }> {
  if (!STREAM_API_KEY || !STREAM_LIBRARY_ID) {
    throw new Error('Bunny Stream not configured')
  }

  const params = new URLSearchParams({
    page: String(page),
    itemsPerPage: String(itemsPerPage),
    orderBy: 'date',
  })
  if (collectionId) params.set('collection', collectionId)

  const res = await fetch(
    `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos?${params}`,
    { headers: streamHeaders() }
  )

  if (!res.ok) {
    throw new Error(`Failed to list videos: ${res.status}`)
  }

  const data = (await res.json()) as StreamListResponse

  const videos: BunnyVideo[] = (data.items || []).map((v) => ({
    guid: v.guid || '',
    title: v.title || '',
    length: v.length || 0,
    status: v.status || 0,
    encodeProgress: v.encodeProgress || 0,
    thumbnailUrl: v.guid ? `https://${STREAM_CDN_HOSTNAME}/${v.guid}/thumbnail.jpg` : '',
    videoUrl: v.guid ? `https://${STREAM_CDN_HOSTNAME}/${v.guid}/playlist.m3u8` : '',
    dateUploaded: v.dateUploaded || '',
    storageSize: v.storageSize || 0,
    category: v.category || '',
    collectionId: v.collectionId || '',
  }))

  return { videos, totalItems: data.totalItems || 0 }
}

/**
 * Get a single video's details.
 */
export async function getVideo(videoId: string): Promise<BunnyVideo | null> {
  if (!STREAM_API_KEY || !STREAM_LIBRARY_ID) return null

  const res = await fetch(
    `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos/${videoId}`,
    { headers: streamHeaders() }
  )

  if (!res.ok) return null

  const v = (await res.json()) as {
    guid?: string
    title?: string
    length?: number
    status?: number
    encodeProgress?: number
    thumbnailFileName?: string
    dateUploaded?: string
    storageSize?: number
    category?: string
    collectionId?: string
  }

  return {
    guid: v.guid || videoId,
    title: v.title || '',
    length: v.length || 0,
    status: v.status || 0,
    encodeProgress: v.encodeProgress || 0,
    thumbnailUrl: `https://${STREAM_CDN_HOSTNAME}/${v.guid || videoId}/thumbnail.jpg`,
    videoUrl: `https://${STREAM_CDN_HOSTNAME}/${v.guid || videoId}/playlist.m3u8`,
    dateUploaded: v.dateUploaded || '',
    storageSize: v.storageSize || 0,
    category: v.category || '',
    collectionId: v.collectionId || '',
  }
}

/**
 * Poll a video's encoding status from Bunny Stream.
 * Status codes: 0=Uploading, 1=Queued, 2=Processing, 3=Encoding, 4=Finished, 5=Error
 */
export async function getVideoStatus(videoId: string): Promise<{
  status: number
  statusLabel: string
  encodeProgress: number
} | null> {
  const video = await getVideo(videoId)
  if (!video) return null

  return {
    status: video.status,
    statusLabel: getVideoStatusLabel(video.status),
    encodeProgress: video.encodeProgress,
  }
}

/**
 * Delete a video from Bunny Stream.
 */
export async function deleteVideo(videoId: string): Promise<boolean> {
  if (!STREAM_API_KEY || !STREAM_LIBRARY_ID) return false

  const res = await fetch(
    `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos/${videoId}`,
    { method: 'DELETE', headers: streamHeaders() }
  )

  return res.ok
}

// --- Storage (Files) ---

function storageHeaders(): Record<string, string> {
  return { AccessKey: STORAGE_PASSWORD }
}

/**
 * Upload a file to Bunny Storage.
 * Returns the public CDN URL.
 */
export async function uploadFile(file: Uint8Array, path: string): Promise<string> {
  if (!STORAGE_ZONE || !STORAGE_PASSWORD) {
    throw new Error(
      'Bunny Storage not configured: missing BUNNY_STORAGE_ZONE or BUNNY_STORAGE_PASSWORD'
    )
  }

  // Normalize path — no leading slash
  const cleanPath = path.replace(/^\/+/, '')

  const res = await fetch(`https://la.storage.bunnycdn.com/${STORAGE_ZONE}/${cleanPath}`, {
    method: 'PUT',
    headers: {
      ...storageHeaders(),
      'Content-Type': 'application/octet-stream',
    },
    body: file as unknown as BodyInit,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Storage upload failed: ${res.status} ${text}`)
  }

  return `https://${STORAGE_CDN_HOSTNAME}/${cleanPath}`
}

/**
 * Delete a file from Bunny Storage.
 */
export async function deleteStorageFile(path: string): Promise<boolean> {
  if (!STORAGE_ZONE || !STORAGE_PASSWORD) return false

  const cleanPath = path.replace(/^\/+/, '')

  const res = await fetch(`https://la.storage.bunnycdn.com/${STORAGE_ZONE}/${cleanPath}`, {
    method: 'DELETE',
    headers: storageHeaders(),
  })

  return res.ok
}

/**
 * List files in a Bunny Storage directory.
 */
export async function listStorageFiles(directory = ''): Promise<BunnyStorageFile[]> {
  if (!STORAGE_ZONE || !STORAGE_PASSWORD) return []

  const cleanDir = directory.replace(/^\/+/, '')
  const url = cleanDir
    ? `https://la.storage.bunnycdn.com/${STORAGE_ZONE}/${cleanDir}/`
    : `https://la.storage.bunnycdn.com/${STORAGE_ZONE}/`

  const res = await fetch(url, { headers: storageHeaders() })

  if (!res.ok) return []

  return (await res.json()) as BunnyStorageFile[]
}

// --- Health Check ---

export async function healthCheck(): Promise<{
  stream: { ok: boolean; error?: string }
  storage: { ok: boolean; error?: string }
}> {
  const result = {
    stream: { ok: false } as { ok: boolean; error?: string },
    storage: { ok: false } as { ok: boolean; error?: string },
  }

  // Check Stream API
  if (STREAM_API_KEY && STREAM_LIBRARY_ID) {
    try {
      const res = await fetch(`https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}`, {
        headers: streamHeaders(),
      })
      result.stream.ok = res.ok
      if (!res.ok) result.stream.error = `HTTP ${res.status}`
    } catch (e) {
      result.stream.error = e instanceof Error ? e.message : 'Unknown error'
    }
  } else {
    result.stream.error = 'Not configured'
  }

  // Check Storage API
  if (STORAGE_ZONE && STORAGE_PASSWORD) {
    try {
      const res = await fetch(`https://la.storage.bunnycdn.com/${STORAGE_ZONE}/`, {
        headers: storageHeaders(),
      })
      result.storage.ok = res.ok
      if (!res.ok) result.storage.error = `HTTP ${res.status}`
    } catch (e) {
      result.storage.error = e instanceof Error ? e.message : 'Unknown error'
    }
  } else {
    result.storage.error = 'Not configured'
  }

  return result
}

// --- Utilities ---

/**
 * Check if Bunny Stream is configured.
 */
export function isStreamConfigured(): boolean {
  return !!(STREAM_API_KEY && STREAM_LIBRARY_ID && STREAM_CDN_HOSTNAME)
}

/**
 * Check if Bunny Storage is configured.
 */
export function isStorageConfigured(): boolean {
  return !!(STORAGE_ZONE && STORAGE_PASSWORD && STORAGE_CDN_HOSTNAME)
}

/**
 * Build an embed-friendly iframe URL for a Bunny Stream video.
 */
export function getEmbedUrl(videoId: string): string {
  return `https://player.mediadelivery.net/embed/${STREAM_LIBRARY_ID}/${videoId}?autoplay=false&preload=true`
}

/**
 * Generate a TUS upload signature for client-side resumable uploads.
 * The signature is SHA256(libraryId + apiKey + expirationTime + videoId).
 * This must be generated server-side to protect the API key.
 */
export function generateTusSignature(
  videoId: string,
  expirationTime: number
): {
  signature: string
  expirationTime: number
  libraryId: string
  videoId: string
} {
  if (!STREAM_API_KEY || !STREAM_LIBRARY_ID) {
    throw new Error('Bunny Stream not configured')
  }

  const signature = createHash('sha256')
    .update(STREAM_LIBRARY_ID + STREAM_API_KEY + expirationTime + videoId)
    .digest('hex')

  return {
    signature,
    expirationTime,
    libraryId: STREAM_LIBRARY_ID,
    videoId,
  }
}

/**
 * Get video status as human-readable string.
 * Bunny status codes: 0=Created, 1=Uploaded, 2=Processing, 3=Transcoding, 4=Finished, 5=Error
 */
export function getVideoStatusLabel(status: number): string {
  const labels: Record<number, string> = {
    0: 'Created',
    1: 'Uploaded',
    2: 'Processing',
    3: 'Transcoding',
    4: 'Ready',
    5: 'Error',
    6: 'Upload Failed',
  }
  return labels[status] || 'Unknown'
}
