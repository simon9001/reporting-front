import type { CreateUserInput, Role, UpdateUserInput, UpdateUserResult, UserDto } from '@sr/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export const usersKey = ['users'] as const

export function useUsers(params: { role?: Role; active?: boolean } = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [...usersKey, params],
    queryFn: () => api<UserDto[]>('/users', { query: { role: params.role, active: params.active } }),
    enabled: options.enabled ?? true,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateUserInput) => api<UserDto>('/users', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKey }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateUserInput & { id: number }) => api<UpdateUserResult>(`/users/${id}`, { method: 'PATCH', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKey }),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => api<void>(`/users/${id}/reset-password`, { method: 'POST', body: { password } }),
  })
}
