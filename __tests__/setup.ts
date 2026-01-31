import { vi } from 'vitest'

// Mock ResizeObserver
vi.stubGlobal('ResizeObserver', vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
})))

// FIX for Pointer Events API
if (typeof PointerEvent === 'undefined') {
  // @ts-ignore
  global.PointerEvent = class PointerEvent extends MouseEvent {
    public pointerId: number
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 1
    }
  }
}

// JSDOM doesn't implement setPointerCapture or releasePointerCapture.
// We add empty mock functions to the Element prototype to prevent errors.
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = vi.fn()
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = vi.fn()
}

// FIX for getComputedStyle
const mockComputedStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  opacity: '1',
  borderRadius: '16px',
  borderWidth: '1px',
  borderColor: 'rgba(255, 255, 255, 0.3)',
  color: 'white',
  fontSize: '16px',
  fontFamily: 'sans-serif',
  content: '""'
}
vi.stubGlobal('getComputedStyle', vi.fn(() => mockComputedStyle))

// FIX for Path2D
vi.stubGlobal('Path2D', class Path2D {
  rect = vi.fn()
  arc = vi.fn()
  moveTo = vi.fn()
  lineTo = vi.fn()
  closePath = vi.fn()
  arcTo = vi.fn()
})


// THE FINAL CORRECT IMAGE MOCK
const srcStore = new WeakMap()

Object.defineProperty(global.Image.prototype, 'src', {
  get() {
    return srcStore.get(this) || ''
  },
  set(src) {
    srcStore.set(this, src)
    if (src) {
      Object.defineProperty(this, 'complete', { value: true, configurable: true })
      Object.defineProperty(this, 'naturalWidth', { value: 800, configurable: true })
      Object.defineProperty(this, 'naturalHeight', { value: 600, configurable: true })

      // Use process.nextTick to simulate async loading and trigger both event listeners and onload property
      process.nextTick(() => {
        this.dispatchEvent(new Event('load'))
        if (typeof this.onload === 'function') {
          this.onload(new Event('load'))
        }
      })
    }
  }
})

// Correct and more complete Canvas Mock
const contextStore = new WeakMap()

const originalGetContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, contextId: string, ...args: any[]) {
  if (contextId === '2d') {
    // If a context for this canvas already exists, return it (browser behavior)
    if (contextStore.has(this)) {
      return contextStore.get(this)
    }

    let _filter = 'none'
    const mock2dContext = {
      canvas: this, // Add a reference back to the canvas
      get filter() { return _filter },
      set filter(val) { _filter = val },

      // Drawing methods
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: this.width, height: this.height })),
      putImageData: vi.fn(),
      createImageData: vi.fn((...args: [any, any]) => ({ data: new Uint8ClampedArray(args[0] * args[1] * 4), width: args[0], height: args[1] })),
      setTransform: vi.fn(),
      drawImage: vi.fn(),

      // Path methods
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      arcTo: vi.fn(),
      rect: vi.fn(),
      roundRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      fillText: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      clip: vi.fn(),
    }

    contextStore.set(this, mock2dContext)

    return mock2dContext
  }

  // @ts-ignore
  return originalGetContext.apply(this, [contextId, ...args])
}
