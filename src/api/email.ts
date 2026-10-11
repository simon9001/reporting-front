import type { EmailJobDto, EmailStatusDto, Paged } from '@sr/shared'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export const useEmailStatus = () => useQuery({ queryKey: ['email-status'], queryFn: () => api<EmailStatusDto>('/admin/email/status') })

export const useEmailJobs = (query: { status?: string; page: number }) =>
  useQuery({ queryKey: ['email-jobs', query], queryFn: () => api<Paged<EmailJobDto>>('/admin/email-jobs', { query }), placeholderData: keepPreviousData, refetchInterval: 15_000 })

export function useSendTestEmail() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: () => api<{ ok: true }>('/admin/email/test', { method: 'POST' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['email-jobs'] }) })
}

export function useRetryEmail() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: number) => api<{ ok: true }>(`/admin/email-jobs/${id}/retry`, { method: 'POST' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['email-jobs'] }) })
}
