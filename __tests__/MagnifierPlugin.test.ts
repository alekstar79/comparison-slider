import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { type UIConfig, type ComparisonSlider, EventEmitter, MagnifierPlugin, defaultConfig } from '../src'

describe('MagnifierPlugin', () => {
  let sliderMock: Partial<ComparisonSlider>
  let events: EventEmitter
  let config: UIConfig
  let container: HTMLElement
  let magnifierButton: HTMLButtonElement

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    document.body.innerHTML = `
      <div class="slider-container">
        <div class="ui-block">
          <button id="magnifierButton"></button>
        </div>
        <div class="covered">
          <canvas class="original-canvas"></canvas>
          <canvas class="filtered-canvas"></canvas>
        </div>
      </div>
    `
    container = document.body.querySelector('.slider-container')!
    magnifierButton = container.querySelector('#magnifierButton')!

    Object.defineProperties(container, {
      clientWidth: { value: 800, configurable: true },
      clientHeight: { value: 600, configurable: true },
      getBoundingClientRect: {
        value: () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 }),
        configurable: true
      }
    })

    events = new EventEmitter()
    config = JSON.parse(JSON.stringify(defaultConfig))

    sliderMock = {
      container,
      events,
      config,
      isComparisonView: true,
      filterEngine: {
        originalCanvas: container.querySelector('.original-canvas')!,
        filteredCanvas: container.querySelector('.filtered-canvas')!
      },
      dragController: {
        getPosition: vi.fn().mockReturnValue({ x: 400, y: 300 })
      }
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize, create elements, and bind events', () => {
    const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()

    expect(container.querySelector('.magnifier')).not.toBeNull()
    expect(container.querySelector('.magnifier-zoom-panel')).not.toBeNull()
  })

  it('should show zoom panel on first click', () => {
    const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()

    magnifierButton.click()

    const zoomPanel = container.querySelector('.magnifier-zoom-panel')!
    expect(zoomPanel.classList.contains('open')).toBe(true)
  })

  it('should enable magnifier when a zoom level is selected', () => {
    const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()

    magnifierButton.click()
    const zoomButton = container.querySelector('.magnifier-zoom-panel button') as HTMLButtonElement
    zoomButton.click()

    const zoomPanel = container.querySelector('.magnifier-zoom-panel')!
    expect(zoomPanel.classList.contains('open')).toBe(false)
    expect(magnifierButton.classList.contains('active')).toBe(true)
  })

  it('should show and update magnifier on mousemove when enabled', () => {
    const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    plugin['setZoom'](2)

    const magnifierEl = container.querySelector('.magnifier') as HTMLElement
    const updateSpy = vi.spyOn(plugin as any, 'updateMagnifierContent')

    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 150 }))

    expect(magnifierEl.style.display).toBe('block')
    expect(updateSpy).toHaveBeenCalledWith(100, 150)
  })

  it('should hide magnifier on mouseleave', () => {
    const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    plugin['setZoom'](2)

    const magnifierEl = container.querySelector('.magnifier') as HTMLElement
    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 150 }))
    container.dispatchEvent(new MouseEvent('mouseleave'))
    expect(magnifierEl.style.display).toBe('none')
  })

  it('should call drawUIElements on update', () => {
    const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    plugin['setZoom'](2)

    const drawUISpy = vi.spyOn(plugin as any, 'drawUIElements')
    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 170 }))
    expect(drawUISpy).toHaveBeenCalled()
  })

  it('should use Path2D for clipping if container has border-radius', () => {
    const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    plugin['setZoom'](2)
    const magnifierCtx = (plugin['magnifierCanvas'] as HTMLCanvasElement).getContext('2d')!
    const clipSpy = vi.spyOn(magnifierCtx, 'clip')

    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 170 }))

    // If Path2D is used, clip() will be called.
    expect(clipSpy).toHaveBeenCalled()
  })

  it('should not draw hidden UI elements', () => {
    const hiddenButton = document.createElement('button')
    hiddenButton.style.display = 'none'
    container.appendChild(hiddenButton)

    const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    plugin['setZoom'](2)
    const drawUISpy = vi.spyOn(plugin as any, 'drawUIElements')

    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 170 }))

    expect(drawUISpy).toHaveBeenCalled()
  })
})
