import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type UIConfig, type ComparisonSlider, EventEmitter, LabelPlugin } from '../src'

describe('LabelPlugin', () => {
  let sliderMock: Partial<ComparisonSlider>
  let events: EventEmitter
  let config: UIConfig
  let container: HTMLElement
  let afterLabel: HTMLElement
  let beforeLabel: HTMLElement

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

    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 }),
      configurable: true
    })
    Object.defineProperty(afterLabel, 'getBoundingClientRect', {
      value: () => ({ left: 10, top: 10, right: 110, bottom: 40, width: 100, height: 30 }),
      configurable: true
    })
    Object.defineProperty(beforeLabel, 'getBoundingClientRect', {
      value: () => ({ left: 690, top: 10, right: 790, bottom: 40, width: 100, height: 30 }),
      configurable: true
    })

    events = new EventEmitter()
    config = {
      labels: { before: 'Original', after: 'Filtered' }
    } as UIConfig

    sliderMock = {
      container,
      events,
      config,
      isComparisonView: true,
      dragController: {
        getPosition: vi.fn().mockReturnValue({ x: 400, y: 300 })
      }
    }
  })

  it('should initialize and set initial label text from active button', () => {
    const plugin = new LabelPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()

    expect(afterLabel.textContent).toBe('Filtered')
    expect(beforeLabel.textContent).toBe('Original')
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
    // Adjust mock for vertical layout where 'before' label is at the bottom
    Object.defineProperty(beforeLabel, 'getBoundingClientRect', {
      value: () => ({ left: 10, top: 560, right: 110, bottom: 590, width: 100, height: 30 }),
      configurable: true
    })

    const plugin = new LabelPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    // Emit a 'y' value that will actually cause clipping on the 'before' label
    events.emit('positionChange', { x: 400, y: 570 })

    // The 'after' label should be fully visible as y (570) is > its top (10) + height (30)
    expect(afterLabel.style.clipPath).toBe('inset(0 0 0px 0)')
    // The 'before' label should be clipped from the top by 10px (570 - 560)
    expect(beforeLabel.style.clipPath).toBe('inset(10px 0 0 0)')
  })

  it('should update label text on filterChange event', () => {
    const plugin = new LabelPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    events.emit('filterChange', { name: 'Sepia', value: 'sepia(1)' })
    expect(afterLabel.textContent).toBe('Sepia')
  })

  it('should update labels on comparisonViewChange to single view', () => {
    const plugin = new LabelPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()

    events.emit('filterChange', { name: 'Sepia', value: 'sepia(1)' })

    sliderMock.isComparisonView = false
    events.emit('comparisonViewChange', { isComparisonView: false })

    expect(beforeLabel.style.display).toBe('none')
    expect(afterLabel.style.clipPath).toBe('none')
    expect(afterLabel.textContent).toBe('Sepia')
  })

  it('should not initialize if labels are not in config', () => {
    const onSpy = vi.spyOn(events, 'on')
    const plugin = new LabelPlugin(sliderMock as ComparisonSlider, { ...config, labels: undefined }, events)
    plugin.initialize()
    expect(onSpy).not.toHaveBeenCalled()
  })
})
