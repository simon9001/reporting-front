import type { AttentionItemDto, CountByDto, DayNightDto, HotspotDto, IncidentSummaryDto, IncidentTrendDto } from '@sr/shared'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Period } from '../lib/periods'

function usePeriodQuery<T>(name: string, period: Period) {
  return useQuery({
    queryKey: ['analytics', name, period.from, period.to],
    queryFn: () => api<T>(`/analytics/incidents/${name}`, { query: { from: period.from, to: period.to } }),
  })
}

export function useAnalytics(period: Period) {
  return {
    summary: usePeriodQuery<IncidentSummaryDto>('summary', period),
    trend: usePeriodQuery<IncidentTrendDto>('trend', period),
    severity: usePeriodQuery<CountByDto[]>('by-severity', period),
    categories: usePeriodQuery<CountByDto[]>('by-category', period),
    hotspots: usePeriodQuery<HotspotDto[]>('by-location', period),
    dayNight: usePeriodQuery<DayNightDto>('day-night', period),
    attention: useQuery({ queryKey: ['analytics', 'attention'], queryFn: () => api<AttentionItemDto[]>('/analytics/incidents/attention') }),
  }
}
