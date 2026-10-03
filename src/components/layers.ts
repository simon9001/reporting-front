/** Stack of open modal layers (drawers, viewers) so only the topmost one reacts to keys, and scroll stays locked until the last closes. */
export interface Layer {
  isTop(): boolean
  pop(): void
}

const stack: symbol[] = []
let savedOverflow: string | null = null

function lockScroll() {
  if (typeof document === 'undefined') return
  if (stack.length === 1) {
    savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
}

function unlockScroll() {
  if (typeof document === 'undefined') return
  if (stack.length === 0 && savedOverflow !== null) {
    document.body.style.overflow = savedOverflow
    savedOverflow = null
  }
}

export function pushLayer(): Layer {
  const token = Symbol('layer')
  stack.push(token)
  lockScroll()
  return {
    isTop: () => stack[stack.length - 1] === token,
    pop: () => {
      const i = stack.indexOf(token)
      if (i === -1) return
      stack.splice(i, 1)
      unlockScroll()
    },
  }
}

export const layerCount = () => stack.length
