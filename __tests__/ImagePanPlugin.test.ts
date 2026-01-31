import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type UIConfig, type ComparisonSlider, EventEmitter, ImagePanPlugin, defaultConfig } from '../src'

describe('ImagePanPlugin', () => {
  let sliderMock: Partial<ComparisonSlider>
  let events: EventEmitter
  let config: UIConfig
  let container: HTMLElement
  let originalImage: HTMLImageElement
  let originalCanvas: HTMLCanvasElement

  beforeEach(() => {
    document.body.innerHTML = '<div class="slider-container"><canvas class="original-canvas"></canvas></div>'
    container = document.body.querySelector('.slider-container')!
    originalCanvas = container.querySelector('.original-canvas')!
    originalImage = new Image()

    Object.defineProperties(container, {
      clientWidth: { value: 800, configurable: true },
      clientHeight: { value: 600, configurable: true }
    })
    Object.defineProperties(originalImage, {
      naturalWidth: { value: 1920, configurable: true },
      naturalHeight: { value: 1080, configurable: true }
    })

    events = new EventEmitter()
    config = JSON.parse(JSON.stringify(defaultConfig))

    sliderMock = {
      container,
      originalImage,
      events,
      config,
      filterEngine: {
        setPanOffset: vi.fn(),
        panOffset: { x: 0, y: 0 },
        originalCanvas: originalCanvas,
        filteredCanvas: document.createElement('canvas')
      }
    }
  })

  it('should set cursor to "grab" if image is pannable on initialize', () => {
    const plugin = new ImagePanPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    expect(container.style.cursor).toBe('grab')
  })

  it('should not set cursor to "grab" if image is not pannable', () => {
    // Make image and container have the same aspect ratio
    Object.defineProperty(originalImage, 'naturalWidth', { value: 800, configurable: true })
    Object.defineProperty(originalImage, 'naturalHeight', { value: 600, configurable: true })

    const plugin = new ImagePanPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    expect(container.style.cursor).toBe('')
  })

  it('should start panning on pointerdown on canvas', () => {
    const plugin = new ImagePanPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()

    const pointerDownEvent = new MouseEvent('pointerdown', { bubbles: true })
    originalCanvas.dispatchEvent(pointerDownEvent)

    expect(plugin['isPanning']).toBe(true)
    expect(container.style.cursor).toBe('grabbing')
  })

  it('should not start panning if not pannable', () => {
    // Make image and container have the same aspect ratio
    Object.defineProperty(originalImage, 'naturalWidth', { value: 800, configurable: true })
    Object.defineProperty(originalImage, 'naturalHeight', { value: 600, configurable: true })

    const plugin = new ImagePanPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()

    const pointerDownEvent = new MouseEvent('pointerdown', { bubbles: true })
    originalCanvas.dispatchEvent(pointerDownEvent)

    expect(plugin['isPanning']).toBe(false)
  })

  it('should call setPanOffset on pointermove', () => {
    const plugin = new ImagePanPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()

    originalCanvas.dispatchEvent(new MouseEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true }))
    document.dispatchEvent(new MouseEvent('pointermove', { clientX: 150, clientY: 120, bubbles: true }))

    expect(sliderMock.filterEngine!.setPanOffset).toHaveBeenCalledWith(expect.closeTo(-90), expect.closeTo(-36))
  })

  it('should stop panning on pointerup', () => {
    const plugin = new ImagePanPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()

    originalCanvas.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    expect(plugin['isPanning']).toBe(true)

    document.dispatchEvent(new MouseEvent('pointerup'))
    expect(plugin['isPanning']).toBe(false)
    expect(container.style.cursor).toBe('grab')
  })
})
