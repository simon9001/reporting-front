import type { AttentionItemDto, CountByDto, DayNightDto, HotspotDto, IncidentSide, IncidentSummaryDto, IncidentTrendDto, MobileHealthDto, SideTrendDto } from '@sr/shared'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Period } from '../lib/periods'

function usePeriodQuery<T>(name: string, period: Period, side?: IncidentSide, enabled = true) {
  return useQuery({
    queryKey: ['analytics', name, period.from, period.to, side ?? 'ALL'],
    queryFn: () => api<T>(`/analytics/incidents/${name}`, { query: { from: period.from, to: period.to, side } }),
    enabled,
  })
}

export function useAnalytics(period: Period, side?: IncidentSide) {
  const showMobile = side !== 'STATIC'
  return {
    summary: usePeriodQuery<IncidentSummaryDto>('summary', period, side),
    trend: usePeriodQuery<IncidentTrendDto>('trend', period, side),
    sideTrend: usePeriodQuery<SideTrendDto>('by-side-trend', period, undefined, !side),
    severity: usePeriodQuery<CountByDto[]>('by-severity', period, side),
    categories: usePeriodQuery<CountByDto[]>('by-category', period, side),
    hotspots: usePeriodQuery<HotspotDto[]>('by-location', period, side),
    dayNight: usePeriodQuery<DayNightDto>('day-night', period, side),
    vehicles: usePeriodQuery<CountByDto[]>('by-vehicle', period, undefined, showMobile),
    mobileHealth: usePeriodQuery<MobileHealthDto>('mobile-health', period, undefined, showMobile),
    attention: useQuery({
      queryKey: ['analytics', 'attention', side ?? 'ALL'],
      queryFn: () => api<AttentionItemDto[]>('/analytics/incidents/attention', { query: { side } }),
    }),
  }
}
