import type { CopyWeekInput, CopyWeekResult, RosterEntryInput, ShiftDto } from '@sr/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { meQueryKey } from '../auth/hooks'

export const rosterKey = ['roster'] as const

export const useRoster = (from: string, to: string) =>
  useQuery({ queryKey: [...rosterKey, from, to], queryFn: () => api<ShiftDto[]>('/roster', { query: { from, to } }) })

function useRosterMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: rosterKey })
      await qc.invalidateQueries({ queryKey: meQueryKey })
    },
  })
}

export const useUpsertRoster = () =>
  useRosterMutation((entries: RosterEntryInput[]) => api<ShiftDto[]>('/roster', { method: 'PUT', body: { entries } }))
export const useCopyWeek = () =>
  useRosterMutation((body: CopyWeekInput) => api<CopyWeekResult>('/roster/copy-week', { method: 'POST', body }))
export const useDeleteRosterShift = () =>
  useRosterMutation((id: number) => api<void>(`/roster/${id}`, { method: 'DELETE' }))
