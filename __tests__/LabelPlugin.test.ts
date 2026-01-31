import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type UIConfig, type ComparisonSlider, EventEmitter, LabelPlugin } from '../src'

describe('LabelPlugin', () => {
  let sliderMock: Partial<ComparisonSlider>
  let events: EventEmitter
  let config: UIConfig
  let container: HTMLElement
  let afterLabel: HTMLElement
  let beforeLabel: HTMLElement
  let activeButton: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="slider-container horizontal">
        <div class="label-after"></div>
        <div class="label-before"></div>
        <div class="filter-buttons"><button class="active">Filtered</button></div>
      </div>
    `
    container = document.body.querySelector('.slider-container')!
    afterLabel = container.querySelector('.label-after')!
    beforeLabel = container.querySelector('.label-before')!
    activeButton = container.querySelector('.filter-buttons button')!

    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 }),
      configurable: true
    })
    Object.defineProperty(afterLabel, 'getBoundingClientRect', {
      value: () => ({ left: 10, top: 10, right: 110, bottom: 40, width: 100, height: 30 }),
      configurable: true
    })
    Object.defineProperty(beforeLabel, 'getBoundingClientRect', {
      value: () => ({ left: 690, top: 560, right: 790, bottom: 590, width: 100, height: 30 }),
      configurable: true
    })

    events = new EventEmitter()
    config = {
      labels: { before: 'Original', after: 'With Effect' }
    } as UIConfig

    sliderMock = {
      container,
      events,
      config,
      isComparisonView: true,
      dragController: {
        getPosition: vi.fn().mockReturnValue({ x: 400, y: 300 })
      } as any
    }
  })

  it('should initialize and set initial label text from active button', () => {
    const plugin = new LabelPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()

    expect(afterLabel.textContent).toBe('Filtered')
    expect(beforeLabel.textContent).toBe('Original')
  })

  it('should use fallback text if no active button on init', () => {
    activeButton.remove()
    const plugin = new LabelPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    expect(afterLabel.textContent).toBe('With Effect')
  })

  it('should update label positions on positionChange event (horizontal)', () => {
    const plugin = new LabelPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    events.emit('positionChange', { x: 400, y: 300 })

    expect(afterLabel.style.clipPath).toBe('inset(0 0px 0 0)')
    expect(beforeLabel.style.clipPath).toBe('inset(0 0 0 0px)')
  })

  it('should update label positions on positionChange event (vertical)', () => {
    container.classList.remove('horizontal')
    container.classList.add('vertical')
    const plugin = new LabelPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    // afterLabel top is 10, height is 30. Cursor is at y=20.
    // clipY = 20 - 10 = 10.
    // clampedClipY = 10.
    // clipPath should be inset(0 0 ${30 - 10}px 0) = inset(0 0 20px 0)
    events.emit('positionChange', { x: 400, y: 20 })

    expect(afterLabel.style.clipPath).toBe('inset(0 0 20px 0)')
    // beforeLabel top is 560. Cursor is at y=20.
    // clipY = 20 - 560 = -540.
    // clampedClipY = 0.
    // clipPath should be inset(0px 0 0 0)
    expect(beforeLabel.style.clipPath).toBe('inset(0px 0 0 0)')
  })

  it('should update label text on filterChange event', () => {
    const plugin = new LabelPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    events.emit('filterChange', { name: 'Sepia', value: 'sepia(1)' })
    expect(afterLabel.textContent).toBe('Sepia')
  })

  it('should update labels on comparisonViewChange', () => {
    const plugin = new LabelPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    events.emit('filterChange', { name: 'Sepia', value: 'sepia(1)' })

    // Toggle to single view
    sliderMock.isComparisonView = false
    events.emit('comparisonViewChange', { isComparisonView: false })

    expect(beforeLabel.style.display).toBe('none')
    expect(afterLabel.style.clipPath).toBe('none')
    expect(afterLabel.textContent).toBe('Sepia')

    // Toggle back to comparison view
    sliderMock.isComparisonView = true
    events.emit('comparisonViewChange', { isComparisonView: true })
    expect(beforeLabel.style.display).toBe('')
    expect(beforeLabel.textContent).toBe('Original')
    expect(afterLabel.textContent).toBe('Sepia')
  })

  it('should update positions on resize event', () => {
    const plugin = new LabelPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    const updateSpy = vi.spyOn(plugin as any, 'updateLabelPositions')
    events.emit('resize')
    expect(updateSpy).toHaveBeenCalled()
  })

  it('should not initialize if labels are not in config', () => {
    const onSpy = vi.spyOn(events, 'on')
    const plugin = new LabelPlugin(sliderMock as ComparisonSlider, { ...config, labels: undefined }, events)
    plugin.initialize()
    expect(onSpy).not.toHaveBeenCalled()
  })

  it('should not initialize if label elements are missing', () => {
    afterLabel.remove()
    const onSpy = vi.spyOn(events, 'on')
    const plugin = new LabelPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    expect(onSpy).not.toHaveBeenCalled()
  })
})
