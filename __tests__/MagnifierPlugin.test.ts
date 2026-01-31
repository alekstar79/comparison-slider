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
        <div class="covered" data-direction="horizontal">
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
    Object.defineProperty(magnifierButton, 'getBoundingClientRect', {
      value: () => ({ left: 10, top: 10, right: 50, bottom: 50, width: 40, height: 40 }),
      configurable: true
    })

    events = new EventEmitter()
    config = JSON.parse(JSON.stringify(defaultConfig))
    config.magnifier.size = 180

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

  it('should toggle magnifier with "m" key', () => {
    const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }))
    const zoomPanel = container.querySelector('.magnifier-zoom-panel') as HTMLElement
    expect(zoomPanel.classList.contains('open')).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }))
    expect(zoomPanel.classList.contains('open')).toBe(false)
  })

  it('should hide zoom panel on outside click', () => {
    const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()

    magnifierButton.click()
    const zoomPanel = container.querySelector('.magnifier-zoom-panel') as HTMLElement
    expect(zoomPanel.classList.contains('open')).toBe(true)

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(zoomPanel.classList.contains('open')).toBe(false)
  })

  it('should request update on relevant events', () => {
    const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    plugin['isEnabled'] = true
    plugin['lastMousePosition'] = { x: 100, y: 150 }

    const updateSpy = vi.spyOn(plugin as any, 'update')

    events.emit('frameUpdate')
    expect(updateSpy).toHaveBeenCalledWith(100, 150)

    events.emit('filterChange')
    expect(updateSpy).toHaveBeenCalledWith(100, 150)

    events.emit('comparisonViewChange')
    expect(updateSpy).toHaveBeenCalledWith(100, 150)
  })

  it('should draw only filtered canvas in single view mode', () => {
    sliderMock.isComparisonView = false
    const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    plugin['setZoom'](2)

    const ctx = (plugin['magnifierCanvas'] as HTMLCanvasElement).getContext('2d')!
    const drawImageSpy = vi.spyOn(ctx, 'drawImage')

    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 150 }))

    expect(drawImageSpy).toHaveBeenCalledOnce()
    expect(drawImageSpy).toHaveBeenCalledWith(
      sliderMock.filterEngine!.filteredCanvas,
      expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number),
      0, 0, config.magnifier.size, config.magnifier.size
    )
  })

  it('should work without a dragController', () => {
    sliderMock.dragController = undefined
    const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    plugin['setZoom'](2)
    const ctx = (plugin['magnifierCanvas'] as HTMLCanvasElement).getContext('2d')!
    const drawImageSpy = vi.spyOn(ctx, 'drawImage')

    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 150 }))

    expect(drawImageSpy).toHaveBeenCalledTimes(2)
  })

  it('should clip correctly in vertical comparison mode', () => {
    const coveredEl = container.querySelector('.covered') as HTMLElement
    coveredEl.dataset.direction = 'vertical'
    sliderMock.dragController!.getPosition = () => ({ x: 400, y: 250 })
    const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    plugin['setZoom'](2)
    const ctx = (plugin['magnifierCanvas'] as HTMLCanvasElement).getContext('2d')!
    const rectSpy = vi.spyOn(ctx, 'rect')

    container.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 200 }))

    expect(rectSpy).toHaveBeenCalledWith(0, 0, config.magnifier.size, 190)
  })

  it('should hide comparison UI elements when isComparisonView is false', () => {
    sliderMock.isComparisonView = false
    const handleGrip = document.createElement('div')
    handleGrip.classList.add('handle-grip')
    Object.defineProperty(handleGrip, 'getBoundingClientRect', {
      value: () => ({ left: 20, top: 20, width: 20, height: 20 }),
    })
    container.appendChild(handleGrip)

    const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    plugin['setZoom'](2)
    const ctx = (plugin['magnifierCanvas'] as HTMLCanvasElement).getContext('2d')!
    const fillSpy = vi.spyOn(ctx, 'fill')

    plugin['drawUIElements'](25, 25)

    expect(fillSpy).toHaveBeenCalledTimes(1)
  })

  describe('positionZoomPanel', () => {
    it('should position panel above the button in horizontal mode', () => {
      const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
      plugin.initialize()
      const uiBlock = container.querySelector('.ui-block')!
      uiBlock.classList.remove('vertical')

      Object.defineProperty(magnifierButton, 'getBoundingClientRect', {
        value: () => ({ top: 100, left: 100, width: 40, height: 40 }),
      })

      plugin['positionZoomPanel']()

      const zoomPanel = container.querySelector('.magnifier-zoom-panel') as HTMLElement
      expect(parseFloat(zoomPanel.style.top)).toBeLessThan(100)
    })

    it('should position panel to the right of the button in vertical mode', () => {
      const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
      plugin.initialize()
      const uiBlock = container.querySelector('.ui-block')!
      uiBlock.classList.add('vertical')

      Object.defineProperty(magnifierButton, 'getBoundingClientRect', {
        value: () => ({ top: 100, left: 100, width: 40, height: 40 }),
      })

      plugin['positionZoomPanel']()
      const zoomPanel = container.querySelector('.magnifier-zoom-panel') as HTMLElement
      expect(parseFloat(zoomPanel.style.left)).toBeGreaterThan(100)
    })

    it('should flip panel below if not enough space above', () => {
      const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
      plugin.initialize()
      const uiBlock = container.querySelector('.ui-block')!
      uiBlock.classList.remove('vertical')

      Object.defineProperty(magnifierButton, 'getBoundingClientRect', {
        value: () => ({ top: 5, left: 100, width: 40, height: 40 }),
      })

      plugin['positionZoomPanel']()
      const zoomPanel = container.querySelector('.magnifier-zoom-panel') as HTMLElement
      expect(parseFloat(zoomPanel.style.top)).toBe(5 + 40 + 10)
    })

    it('should flip panel to the left if not enough space on the right', () => {
      const plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
      plugin.initialize()
      const uiBlock = container.querySelector('.ui-block')!
      uiBlock.classList.add('vertical')

      Object.defineProperty(magnifierButton, 'getBoundingClientRect', {
        value: () => ({ top: 100, left: 755, width: 40, height: 40 }),
      })
      const zoomPanel = container.querySelector('.magnifier-zoom-panel') as HTMLElement
      const panelWidth = zoomPanel.getBoundingClientRect().width

      plugin['positionZoomPanel']()
      expect(parseFloat(zoomPanel.style.left)).toBe(755 - panelWidth - 10)
    })
  })

  describe('drawUIElements', () => {
    let plugin: MagnifierPlugin
    let ctx: CanvasRenderingContext2D

    beforeEach(() => {
      plugin = new MagnifierPlugin(sliderMock as ComparisonSlider, config, events)
      plugin.initialize()
      plugin['setZoom'](2)
      ctx = (plugin['magnifierCanvas'] as HTMLCanvasElement).getContext('2d')!
    })

    it('should draw SVG icon from a button', () => {
      magnifierButton.innerHTML = `<svg><path d="M10 10 H 90 V 90 H 10 Z"></path></svg>`
      const drawImageSpy = vi.spyOn(ctx, 'drawImage')

      plugin['drawUIElements'](20, 20)

      vi.runAllTimers()

      expect(drawImageSpy).toHaveBeenCalled()
      const imageArg = drawImageSpy.mock.calls[0][0] as HTMLImageElement
      expect(imageArg).toBeInstanceOf(HTMLImageElement)
      expect(imageArg.src).toContain('data:image/svg+xml;base64')
    })

    it('should draw text from an element', () => {
      const textButton = document.createElement('button')
      textButton.innerText = 'Hello'
      // Add to a block that is queried by the plugin
      const uiBlock = container.querySelector('.ui-block')!
      uiBlock.appendChild(textButton)
      Object.defineProperty(textButton, 'getBoundingClientRect', {
        value: () => ({ left: 90, top: 90, width: 40, height: 20 }),
      })
      const fillTextSpy = vi.spyOn(ctx, 'fillText')

      plugin['drawUIElements'](100, 100)

      expect(fillTextSpy).toHaveBeenCalledWith('Hello', expect.any(Number), expect.any(Number))
    })

    it('should clip "label-after" correctly in horizontal mode', () => {
      const label = document.createElement('div')
      label.classList.add('comparison-label', 'label-after')
      container.appendChild(label)
      Object.defineProperty(label, 'getBoundingClientRect', {
        value: () => ({ left: 450, top: 10, width: 100, height: 30 }),
      })
      sliderMock.dragController!.getPosition = () => ({ x: 500, y: 300 })
      const clipSpy = vi.spyOn(ctx, 'clip')
      const rectSpy = vi.spyOn(ctx, 'rect')

      plugin['drawUIElements'](480, 20)

      expect(clipSpy).toHaveBeenCalled()
      expect(rectSpy).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 100, 60)
    })

    it('should not draw elements with zero opacity or size', () => {
      const transparentButton = document.createElement('button')
      transparentButton.style.opacity = '0'
      Object.defineProperty(transparentButton, 'getBoundingClientRect', {
        value: () => ({ left: 20, top: 20, width: 40, height: 20 }),
      })
      container.appendChild(transparentButton)

      const zeroSizeButton = document.createElement('button')
      Object.defineProperty(zeroSizeButton, 'getBoundingClientRect', {
        value: () => ({ width: 0, height: 0 }),
      })
      container.appendChild(zeroSizeButton)

      const fillSpy = vi.spyOn(ctx, 'fill')

      plugin['drawUIElements'](25, 25)

      expect(fillSpy).toHaveBeenCalledTimes(1)
    })
  })
})
