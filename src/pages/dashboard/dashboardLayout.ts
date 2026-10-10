import type { HotspotDto, IncidentSide } from '@sr/shared'

export type HotspotKind = HotspotDto['kind']

/** Which optional panels the dashboard shows for the chosen side (undefined = All). */
export function dashboardPanels(side: IncidentSide | undefined) {
  return { sideTrend: !side, hotspotSwitch: !side, mobileUnits: side !== 'STATIC' }
}

/** Static → stations, Mobile → places; with All, the panel's own switch decides. */
export function hotspotKind(side: IncidentSide | undefined, chosen: HotspotKind): HotspotKind {
  if (side === 'STATIC') return 'station'
  if (side === 'MOBILE') return 'place'
  return chosen
}
