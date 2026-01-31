import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DragController } from '../src/core/DragController'
import { EventEmitter, defaultConfig } from '../src'

describe('DragController', () => {
  let container: HTMLElement
  let handle: HTMLElement
  let line: HTMLElement
  let filteredCanvas: HTMLCanvasElement
  let events: EventEmitter

  beforeEach(() => {
    vi.useFakeTimers()

    const createMockElement = (className: string, tagName: keyof HTMLElementTagNameMap = 'div') => {
      const el = document.createElement(tagName)
      el.className = className
      Object.defineProperties(el, {
        clientWidth: { value: 800, configurable: true },
        clientHeight: { value: 600, configurable: true },
        getBoundingClientRect: {
          value: () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 }),
          configurable: true
        }
      })
      return el
    }

    container = createMockElement('covered')
    handle = createMockElement('handle-grip')
    line = createMockElement('handle-line')
    filteredCanvas = createMockElement('filtered-canvas', 'canvas') as HTMLCanvasElement
    events = new EventEmitter()
    document.body.appendChild(container)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize and attach event listeners', () => {
    const addEventListenerSpy = vi.spyOn(handle, 'addEventListener')
    new DragController(container, handle, line, filteredCanvas, 'horizontal', defaultConfig, events)
    expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false })
  })

  it('should update styles on horizontal drag', async () => {
    new DragController(container, handle, line, filteredCanvas, 'horizontal', defaultConfig, events)
    handle.dispatchEvent(new MouseEvent('mousedown', { clientX: 400, clientY: 300, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 300, bubbles: true }))

    await vi.runOnlyPendingTimersAsync()

    expect(handle.style.transform).toBe('translate(200px, 300px)')
    expect(line.style.transform).toBe('translateX(200px)')
    expect(filteredCanvas.style.clipPath).toBe('inset(0 calc(100% - 200px) 0 0)')
  })

  it('should update styles on vertical drag', async () => {
    new DragController(container, handle, line, filteredCanvas, 'vertical', defaultConfig, events)
    handle.dispatchEvent(new MouseEvent('mousedown', { clientX: 400, clientY: 300, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 200, bubbles: true }))

    await vi.runOnlyPendingTimersAsync()

    expect(handle.style.transform).toBe('translate(400px, 200px)')
    expect(line.style.transform).toBe('translateY(200px)')
    expect(filteredCanvas.style.clipPath).toBe('inset(0 0 calc(100% - 200px) 0)')
  })

  it('should handle touch events', async () => {
    new DragController(container, handle, line, filteredCanvas, 'horizontal', defaultConfig, events)
    const touchStart = new TouchEvent('touchstart', { touches: [{ clientX: 400, clientY: 300 }] as any })
    handle.dispatchEvent(touchStart)
    expect(handle.classList.contains('draggable')).toBe(true)

    const touchMove = new TouchEvent('touchmove', { touches: [{ clientX: 200, clientY: 300 }] as any })
    document.dispatchEvent(touchMove)
    await vi.runOnlyPendingTimersAsync()
    expect(handle.style.transform).toBe('translate(200px, 300px)')

    document.dispatchEvent(new TouchEvent('touchend'))
    expect(handle.classList.contains('draggable')).toBe(false)
  })

  it('should not start drag on right-click', () => {
    const controller = new DragController(container, handle, line, filteredCanvas, 'horizontal', defaultConfig, events)

    // Simulate a right-click mousedown
    handle.dispatchEvent(new MouseEvent('mousedown', { clientX: 400, clientY: 300, bubbles: true, button: 2 }))

    expect((controller as any).isDragging).toBe(false)

    // Move the mouse
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 300, bubbles: true }))

    // The handle should not have moved
    expect(handle.style.transform).toBe('')
  })

  it('should set disabled state and reset styles', () => {
    const controller = new DragController(container, handle, line, filteredCanvas, 'horizontal', defaultConfig, events)
    controller.setDisabled(true)
    expect(handle.style.display).toBe('none')
    expect(line.style.display).toBe('none')
    expect(filteredCanvas.style.clipPath).toBe('none')

    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(handle.classList.contains('draggable')).toBe(false)
  })

  it('should handle hoverToSlide config on mousemove', async () => {
    const hoverConfig = { ...defaultConfig, hoverToSlide: true }
    new DragController(container, handle, line, filteredCanvas, 'horizontal', hoverConfig, events)
    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 300, bubbles: true }))

    await vi.runOnlyPendingTimersAsync()

    expect(handle.style.transform).toBe('translate(400px, 300px)')
  })

  it('should not drag on mousemove if not dragging and hover is off', async () => {
    new DragController(container, handle, line, filteredCanvas, 'horizontal', defaultConfig, events)
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 300, bubbles: true }))

    await vi.runOnlyPendingTimersAsync()

    expect(handle.style.transform).toBe('')
  })

  it('should not update position if container has zero size', () => {
    const controller = new DragController(container, handle, line, filteredCanvas, 'horizontal', defaultConfig, events)
    controller.setNormalizedPosition(0.5, 0.5)
    Object.defineProperty(container, 'clientWidth', { value: 0 })
    Object.defineProperty(container, 'clientHeight', { value: 0 })

    controller.updatePositionFromPixels(100, 100)
    const position = controller.getPosition()
    expect(position.x).toBe(0) // 0.5 * 0
    expect(position.y).toBe(0) // 0.5 * 0
  })

  it('should only schedule one animation frame at a time', () => {
    const controller = new DragController(container, handle, line, filteredCanvas, 'horizontal', defaultConfig, events)
    const rAFSpy = vi.spyOn(window, 'requestAnimationFrame')

    controller.redraw()
    controller.redraw()
    controller.redraw()

    expect(rAFSpy).toHaveBeenCalledTimes(1)
  })
})
