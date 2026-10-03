import type { ChangePasswordInput, LoginInput, MeResponse, SessionUserDto } from '@sr/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export const meQueryKey = ['me'] as const

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: () => api<MeResponse>('/auth/me'),
    retry: false,
    staleTime: 30_000,
    refetchInterval: 60_000, // keeps the current shift correct across shift changes
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) => api<{ user: SessionUserDto }>('/auth/login', { method: 'POST', body: input }),
    // Drop any cached 401 so the guard starts fresh instead of bouncing back to /login.
    onSuccess: () => qc.removeQueries({ queryKey: meQueryKey }),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    onSettled: () => qc.clear(),
  })
}

export function useChangePassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => api<{ user: SessionUserDto }>('/auth/change-password', { method: 'POST', body: input }),
    onSuccess: () => qc.refetchQueries({ queryKey: meQueryKey }),
  })
}
