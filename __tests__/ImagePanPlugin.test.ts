import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type UIConfig, type ComparisonSlider, EventEmitter, ImagePanPlugin, defaultConfig } from '../src'

describe('ImagePanPlugin', () => {
  let sliderMock: Partial<ComparisonSlider>
  let events: EventEmitter
  let config: UIConfig
  let container: HTMLElement
  let plugin: ImagePanPlugin

  beforeEach(() => {
    document.body.innerHTML = '<div class="slider-container"></div>'
    container = document.body.querySelector('.slider-container')!
    Object.defineProperties(container, {
      clientWidth: { value: 800, configurable: true },
      clientHeight: { value: 600, configurable: true }
    })

    events = new EventEmitter()
    config = JSON.parse(JSON.stringify(defaultConfig))

    const originalImage = new Image()
    Object.defineProperties(originalImage, {
      naturalWidth: { value: 1920, configurable: true }, // Wide image
      naturalHeight: { value: 1080, configurable: true }
    })

    sliderMock = {
      container,
      events,
      config,
      originalImage,
      filterEngine: {
        panOffset: { x: 0, y: 0 },
        setPanOffset: vi.fn(),
        originalCanvas: document.createElement('canvas'),
        filteredCanvas: document.createElement('canvas')
      }
    }

    plugin = new ImagePanPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
  })

  it('should enable panning for wide images', () => {
    expect(container.style.cursor).toBe('grab')
  })

  it('should not enable panning for images with similar aspect ratio', () => {
    Object.defineProperties(sliderMock.originalImage!, {
      naturalWidth: { value: 800, configurable: true },
      naturalHeight: { value: 600, configurable: true }
    })
    // Re-check pannable state
    plugin['checkPannable']()
    expect(container.style.cursor).toBe('')
  })

  it('should start panning on pointerdown on a canvas', () => {
    const canvas = sliderMock.filterEngine!.originalCanvas
    const pointerDownEvent = new PointerEvent('pointerdown', { bubbles: true })
    Object.defineProperty(pointerDownEvent, 'target', { value: canvas, configurable: true })

    // Dispatch on the container, which is where the listener is
    container.dispatchEvent(pointerDownEvent)
    expect(container.style.cursor).toBe('grabbing')
  })

  it('should not start panning if target is not a canvas', () => {
    const notCanvas = document.createElement('div')
    const pointerDownEvent = new PointerEvent('pointerdown', { bubbles: true })
    Object.defineProperty(pointerDownEvent, 'target', { value: notCanvas, configurable: true })

    container.dispatchEvent(pointerDownEvent)
    expect(container.style.cursor).toBe('grab') // Should not change to 'grabbing'
  })

  it('should update pan offset on pointermove', () => {
    const setPanOffsetSpy = sliderMock.filterEngine!.setPanOffset
    // Manually set isPanning to true to simulate the state after pointerdown
    plugin['isPanning'] = true
    plugin['startPanPosition'] = { x: 100, y: 100 }
    plugin['startPanOffset'] = { x: 0, y: 0 }

    // Move pointer
    const pointerMoveEvent = new PointerEvent('pointermove', { clientX: 150, clientY: 120, bubbles: true })
    document.dispatchEvent(pointerMoveEvent)

    expect(setPanOffsetSpy).toHaveBeenCalled()
    // Check the calculation
    // dx = 50, dy = 20
    // scale = 600 / 1080 = 0.555...
    // newOffsetX = 0 - (50 / scale) = -90
    // newOffsetY = 0 - (20 / scale) = -36
    expect(setPanOffsetSpy).toHaveBeenCalledWith(-90, -36)
  })

  it('should stop panning on pointerup', () => {
    // Set grabbing state
    plugin['isPanning'] = true
    plugin['panTarget'] = sliderMock.filterEngine!.originalCanvas
    container.style.cursor = 'grabbing'

    // Stop panning
    const pointerUpEvent = new PointerEvent('pointerup', { pointerId: 1, bubbles: true })
    document.dispatchEvent(pointerUpEvent)
    expect(container.style.cursor).toBe('grab')
  })
})
