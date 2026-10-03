import { describe, expect, it } from 'vitest'
import { layerCount, pushLayer } from './layers'

describe('layer stack', () => {
  it('only the most recently pushed layer is on top', () => {
    const a = pushLayer()
    const b = pushLayer()
    expect(a.isTop()).toBe(false)
    expect(b.isTop()).toBe(true)
    b.pop()
    expect(a.isTop()).toBe(true)
    a.pop()
    expect(layerCount()).toBe(0)
  })

  it('popping twice or out of order is safe', () => {
    const a = pushLayer()
    const b = pushLayer()
    a.pop()
    a.pop()
    expect(b.isTop()).toBe(true)
    expect(layerCount()).toBe(1)
    b.pop()
    expect(layerCount()).toBe(0)
  })
})
