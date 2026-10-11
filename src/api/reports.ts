import type { Paged, ReportListItemDto, ReportUpdateInput, ShiftReportDto } from '@sr/shared'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

type Query = Record<string, string | number | boolean | undefined>

export const reportPdfUrl = (id: number) => `/api/reports/${id}/pdf`

export const useShiftReport = (shiftId: number | null | undefined) =>
  useQuery({ queryKey: ['report', 'shift', shiftId], queryFn: () => api<ShiftReportDto>(`/shifts/${shiftId}/report`), enabled: !!shiftId })

export const useReport = (id: number | null) =>
  useQuery({ queryKey: ['report', id], queryFn: () => api<ShiftReportDto>(`/reports/${id}`), enabled: id !== null && Number.isInteger(id) })

export const useReports = (query: Query) =>
  useQuery({ queryKey: ['reports', query], queryFn: () => api<Paged<ReportListItemDto>>('/reports', { query }), placeholderData: keepPreviousData })

/** Autosave: no invalidation, so the open form is never reset by its own save. */
export const useSaveReport = () =>
  useMutation({ mutationFn: ({ shiftId, body }: { shiftId: number; body: ReportUpdateInput }) => api<ShiftReportDto>(`/shifts/${shiftId}/report`, { method: 'PUT', body }) })

export function useSubmitReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (shiftId: number) => api<ShiftReportDto>(`/shifts/${shiftId}/report/submit`, { method: 'POST' }),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: ['report'] }),
      qc.invalidateQueries({ queryKey: ['reports'] }),
      qc.invalidateQueries({ queryKey: ['incidents'] }),
      qc.invalidateQueries({ queryKey: ['incident'] }),
      qc.invalidateQueries({ queryKey: ['me'] }),
    ]),
  })
}
