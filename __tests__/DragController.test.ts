import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DragController } from '../src/core/DragController'
import { EventEmitter, defaultConfig } from '../src'

describe('DragController', () => {
  let container: HTMLElement
  let handle: HTMLElement
  let line: HTMLElement
  let filteredCanvas: HTMLElement
  let events: EventEmitter

  beforeEach(() => {
    // Use fake timers to control requestAnimationFrame
    vi.useFakeTimers()

    const createMockElement = (className: string) => {
      const el = document.createElement('div')
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
    filteredCanvas = createMockElement('filtered-canvas')
    events = new EventEmitter()
    document.body.appendChild(container)
  })

  afterEach(() => {
    // Restore real timers after each test
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

    // Advance timers to execute the rAF callback
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

  it('should stop dragging on mouseup', () => {
    new DragController(container, handle, line, filteredCanvas, 'horizontal', defaultConfig, events)
    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(handle.classList.contains('draggable')).toBe(true)
    document.dispatchEvent(new MouseEvent('mouseup'))
    expect(handle.classList.contains('draggable')).toBe(false)
  })

  it('should set position with setNormalizedPosition', async () => {
    const controller = new DragController(container, handle, line, filteredCanvas, 'horizontal', defaultConfig, events)
    controller.setNormalizedPosition(0.25, 0.75)

    await vi.runOnlyPendingTimersAsync()

    expect(handle.style.transform).toBe('translate(200px, 450px)')
    expect(filteredCanvas.style.clipPath).toBe('inset(0 calc(100% - 200px) 0 0)')
  })

  it('should be disabled and not react to events', () => {
    const controller = new DragController(container, handle, line, filteredCanvas, 'horizontal', defaultConfig, events)
    controller.setDisabled(true)
    expect(handle.style.display).toBe('none')
    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(handle.classList.contains('draggable')).toBe(false)
  })

  it('should handle hoverToSlide config', async () => {
    const hoverConfig = { ...defaultConfig, hoverToSlide: true }
    new DragController(container, handle, line, filteredCanvas, 'horizontal', hoverConfig, events)
    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 300, bubbles: true }))

    await vi.runOnlyPendingTimersAsync()

    expect(handle.style.transform).toBe('translate(400px, 300px)')
    expect(filteredCanvas.style.clipPath).toBe('inset(0 calc(100% - 400px) 0 0)')
  })
})
