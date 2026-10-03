import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { z } from 'zod'
import { ApiError, errorMessage } from './api'

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || '_form'
    out[key] ??= issue.message
  }
  return out
}

/** Puts server field errors on the matching inputs and the overall message on `root`. */
export function applyServerErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>): void {
  if (err instanceof ApiError && err.fields) {
    for (const [field, message] of Object.entries(err.fields)) setError(field as Path<T>, { message })
  }
  setError('root', { message: errorMessage(err) })
}

export function parseEmailList(text: string): string[] {
  return text.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean)
}

export const formatEmailList = (list: string[]) => list.join('\n')

/** '' → null, '30' → 30, 'abc' → NaN (so schema validation reports it). */
export function numberOrNull(text: string): number | null {
  const t = text.trim()
  return t === '' ? null : Number(t)
}
