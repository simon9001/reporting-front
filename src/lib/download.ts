import type { ApiErrorBody } from '@sr/shared'
import { buildUrl } from './api'

export function filenameFromDisposition(header: string | null, fallback = 'incidents.xlsx'): string {
  if (!header) return fallback
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header)
  if (star?.[1]) {
    try { return decodeURIComponent(star[1].trim().replace(/^"|"$/g, '')) || fallback } catch { /* fall through */ }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain?.[1]?.trim() || fallback
}

export function exportErrorMessage(status: number, body: unknown): string {
  const message = (body as ApiErrorBody | null)?.error?.message
  return message || `Export failed (${status}). Please try again.`
}

export interface DownloadResult { truncated: boolean }

/** Fetches a file with the session cookie and saves it through a blob URL. Throws Error with a readable message. */
export async function downloadFile(path: string, query: Record<string, string | number | boolean | null | undefined>): Promise<DownloadResult> {
  let res: Response
  try {
    res = await fetch(buildUrl(path, query), { credentials: 'include' })
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.')
  }
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null)
    throw new Error(exportErrorMessage(res.status, body))
  }
  const truncated = res.headers.get('X-Export-Truncated') === 'true'
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filenameFromDisposition(res.headers.get('Content-Disposition'))
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return { truncated }
}
