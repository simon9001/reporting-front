import type { IncidentDto, IncidentInput, IncidentListItemDto, Paged, UploadResultDto } from '@sr/shared'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiUpload } from '../lib/api'

type Query = Record<string, string | number | boolean | undefined>

export function useIncidents(query: Query, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['incidents', query],
    queryFn: () => api<Paged<IncidentListItemDto>>('/incidents', { query }),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  })
}

export function useIncident(idOrRef: string | null) {
  return useQuery({
    queryKey: ['incident', idOrRef],
    queryFn: () => api<IncidentDto>(`/incidents/${encodeURIComponent(idOrRef!)}`),
    enabled: !!idOrRef,
  })
}

function useInvalidateIncidents() {
  const qc = useQueryClient()
  return () => Promise.all([
    qc.invalidateQueries({ queryKey: ['incidents'] }),
    qc.invalidateQueries({ queryKey: ['incident'] }),
    qc.invalidateQueries({ queryKey: ['analytics'] }),
  ])
}

export function useSaveIncident() {
  const invalidate = useInvalidateIncidents()
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: IncidentInput }) =>
      id ? api<IncidentDto>(`/incidents/${id}`, { method: 'PATCH', body }) : api<IncidentDto>('/incidents', { method: 'POST', body }),
    onSuccess: () => invalidate(),
  })
}

export function useUploadSnapshots() {
  const invalidate = useInvalidateIncidents()
  return useMutation({
    mutationFn: ({ incidentId, files }: { incidentId: number; files: File[] }) => apiUpload<UploadResultDto>(`/incidents/${incidentId}/attachments`, files),
    onSuccess: () => invalidate(),
  })
}

export function useDeleteSnapshot() {
  const invalidate = useInvalidateIncidents()
  return useMutation({
    mutationFn: (attachmentId: number) => api<void>(`/attachments/${attachmentId}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(),
  })
}
