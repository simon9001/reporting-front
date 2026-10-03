import type { AuditLogDto, Paged } from '@sr/shared'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface AuditParams { entity?: string; from?: string; to?: string; page: number }

export const useAuditLog = (params: AuditParams) =>
  useQuery({
    queryKey: ['audit', params],
    queryFn: () => api<Paged<AuditLogDto>>('/audit', { query: { ...params } }),
    placeholderData: keepPreviousData,
  })
