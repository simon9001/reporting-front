import { describe, expect, it } from 'vitest'
import { dashboardPanels, hotspotKind } from './dashboardLayout'

describe('dashboard layout', () => {
  it('shows the side comparison and hotspot switch only for All; hides mobile units for Static', () => {
    expect(dashboardPanels(undefined)).toEqual({ sideTrend: true, hotspotSwitch: true, mobileUnits: true })
    expect(dashboardPanels('STATIC')).toEqual({ sideTrend: false, hotspotSwitch: false, mobileUnits: false })
    expect(dashboardPanels('MOBILE')).toEqual({ sideTrend: false, hotspotSwitch: false, mobileUnits: true })
  })
  it('lets the dashboard side force the hotspot type, otherwise uses the switch', () => {
    expect(hotspotKind('STATIC', 'place')).toBe('station')
    expect(hotspotKind('MOBILE', 'station')).toBe('place')
    expect(hotspotKind(undefined, 'place')).toBe('place')
  })
})
