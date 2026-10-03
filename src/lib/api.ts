import type { ApiErrorBody } from '@sr/shared'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields: Record<string, string> | undefined

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }
}

type QueryValue = string | number | boolean | null | undefined
export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, QueryValue>
}

export function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return `/api${path}${qs ? `?${qs}` : ''}`
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options
  let res: Response
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your connection and try again.')
  }
  if (res.status === 204) return undefined as T
  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error
    throw new ApiError(res.status, err?.code ?? 'INTERNAL', err?.message ?? `Request failed (${res.status})`, err?.fields)
  }
  return data as T
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong'
}

/** Multipart upload of files under one field name; same error handling as `api`. */
export async function apiUpload<T>(path: string, files: File[], field = 'files'): Promise<T> {
  const form = new FormData()
  for (const f of files) form.append(field, f)
  let res: Response
  try {
    res = await fetch(buildUrl(path), { method: 'POST', credentials: 'same-origin', body: form })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your connection and try again.')
  }
  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error
    throw new ApiError(res.status, err?.code ?? 'INTERNAL', err?.message ?? `Upload failed (${res.status})`, err?.fields)
  }
  return data as T
}
