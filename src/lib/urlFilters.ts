import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

export type FilterValues = Record<string, string | undefined>

export function readFilters(params: URLSearchParams, keys: readonly string[]): FilterValues {
  return Object.fromEntries(keys.map((k) => [k, params.get(k) ?? undefined]))
}

/** Applies a patch; empty values are removed; any filter change returns to page 1. */
export function patchParams(params: URLSearchParams, patch: FilterValues, resetPage = true): URLSearchParams {
  const next = new URLSearchParams(params)
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === '') next.delete(k)
    else next.set(k, v)
  }
  if (resetPage && !('page' in patch)) next.delete('page')
  return next
}

export const csvToList = (v: string | undefined): string[] => (v ? v.split(',').filter(Boolean) : [])
export const listToCsv = (list: string[]): string | undefined => (list.length > 0 ? list.join(',') : undefined)

/** Filter state stored in the page address, so filtered views survive reloads and can be shared. */
export function useUrlFilters(keys: readonly string[]) {
  const [params, setParams] = useSearchParams()
  const keyList = keys.join('|')
  const values = useMemo(() => readFilters(params, keys), [params, keyList])
  const set = useCallback((patch: FilterValues) => setParams((p) => patchParams(p, patch), { replace: true }), [setParams])
  const clear = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams])
  return { values, set, clear }
}
