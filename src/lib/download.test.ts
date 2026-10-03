import { describe, expect, it } from 'vitest'
import { exportErrorMessage, filenameFromDisposition } from './download'

describe('download helpers', () => {
  it('reads the filename from Content-Disposition with a fallback', () => {
    expect(filenameFromDisposition('attachment; filename="incidents-2026.xlsx"')).toBe('incidents-2026.xlsx')
    expect(filenameFromDisposition("attachment; filename*=UTF-8''my%20file.xlsx")).toBe('my file.xlsx')
    expect(filenameFromDisposition(null)).toBe('incidents.xlsx')
    expect(filenameFromDisposition('attachment')).toBe('incidents.xlsx')
  })
  it('builds the error message from the server body or a generic fallback', () => {
    expect(exportErrorMessage(403, { error: { code: 'FORBIDDEN', message: 'Not allowed' } })).toBe('Not allowed')
    expect(exportErrorMessage(500, null)).toBe('Export failed (500). Please try again.')
  })
})
