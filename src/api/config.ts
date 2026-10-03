import type {
  CreateLookupInput, CreateVehicleInput, EscalationRuleDto, EscalationRuleInput, LookupItemDto, LookupType, Settings,
  SettingsUpdate, ShiftDefinitionDto, ShiftDefinitionUpdate, UpdateLookupInput, UpdateVehicleInput, VehicleDto,
} from '@sr/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export const configKeys = {
  shiftDefinitions: ['config', 'shift-definitions'] as const,
  escalationRules: ['config', 'escalation-rules'] as const,
  settings: ['config', 'settings'] as const,
  lookups: ['config', 'lookups'] as const,
  vehicles: ['config', 'vehicles'] as const,
}

export const useShiftDefinitions = () =>
  useQuery({ queryKey: configKeys.shiftDefinitions, queryFn: () => api<ShiftDefinitionDto[]>('/config/shift-definitions') })

export function useUpdateShiftDefinitions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ShiftDefinitionUpdate[]) => api<ShiftDefinitionDto[]>('/config/shift-definitions', { method: 'PUT', body }),
    onSuccess: (data) => {
      qc.setQueryData(configKeys.shiftDefinitions, data)
      void qc.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export const useEscalationRules = () =>
  useQuery({ queryKey: configKeys.escalationRules, queryFn: () => api<EscalationRuleDto[]>('/config/escalation-rules') })

export function useUpdateEscalationRules() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: EscalationRuleInput[]) => api<EscalationRuleDto[]>('/config/escalation-rules', { method: 'PUT', body }),
    onSuccess: (data) => qc.setQueryData(configKeys.escalationRules, data),
  })
}

export const useSettings = () => useQuery({ queryKey: configKeys.settings, queryFn: () => api<Settings>('/config/settings') })

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SettingsUpdate) => api<Settings>('/config/settings', { method: 'PUT', body }),
    onSuccess: (data) => qc.setQueryData(configKeys.settings, data),
  })
}

export const useLookups = (listType?: LookupType) =>
  useQuery({ queryKey: [...configKeys.lookups, listType ?? 'all'], queryFn: () => api<LookupItemDto[]>('/config/lookups', { query: { listType } }) })

export function useCreateLookup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateLookupInput) => api<LookupItemDto>('/config/lookups', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: configKeys.lookups }),
  })
}

export function useUpdateLookup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateLookupInput & { id: number }) => api<LookupItemDto>(`/config/lookups/${id}`, { method: 'PATCH', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: configKeys.lookups }),
  })
}

export const useVehicles = () => useQuery({ queryKey: configKeys.vehicles, queryFn: () => api<VehicleDto[]>('/config/vehicles') })

export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateVehicleInput) => api<VehicleDto>('/config/vehicles', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: configKeys.vehicles }),
  })
}

export function useUpdateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateVehicleInput & { id: number }) => api<VehicleDto>(`/config/vehicles/${id}`, { method: 'PATCH', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: configKeys.vehicles }),
  })
}
