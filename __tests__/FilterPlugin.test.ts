import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type UIConfig, type ComparisonSlider, EventEmitter, FilterPlugin } from '../src'

describe('FilterPlugin', () => {
  let sliderMock: Partial<ComparisonSlider>
  let events: EventEmitter
  let config: UIConfig
  let container: HTMLElement
  let uiPanel: HTMLElement
  let toggleButton: HTMLButtonElement
  let filterButton1: HTMLButtonElement
  let filterButton2: HTMLButtonElement

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="slider-container">
        <div id="filterPanel">
          <div class="filter-buttons">
            <button data-filter="sepia(1)">Sepia</button>
            <button data-filter="blur(5px)">Blur</button>
          </div>
        </div>
        <button id="toggleButton"></button>
      </div>
    `
    container = document.body.querySelector('.slider-container')!
    uiPanel = container.querySelector('#filterPanel')!
    toggleButton = container.querySelector('#toggleButton')!
    ;[filterButton1, filterButton2] = Array.from(uiPanel.querySelectorAll('button'))

    events = new EventEmitter()
    config = {} as UIConfig

    sliderMock = {
      container,
      events,
      config,
      filterEngine: {
        applyFilter: vi.fn()
      } as any
    }
  })

  it('should initialize, set initial filter, and bind events', () => {
    const plugin = new FilterPlugin(sliderMock as ComparisonSlider, config, events)
    const emitSpy = vi.spyOn(events, 'emit')

    plugin.initialize()

    // Check initial filter
    expect(sliderMock.filterEngine!.applyFilter).toHaveBeenCalledWith('sepia(1)')
    expect(emitSpy).toHaveBeenCalledWith('filterChange', { name: 'Sepia', value: 'sepia(1)' })
    expect(filterButton1.classList.contains('active')).toBe(true)

    // Check event binding
    const toggleSpy = vi.spyOn(uiPanel.classList, 'toggle')
    toggleButton.click()
    expect(toggleSpy).toHaveBeenCalledWith('open')
  })

  it('should toggle UI panel on button click', () => {
    const plugin = new FilterPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()

    toggleButton.click()
    expect(uiPanel.classList.contains('open')).toBe(true)

    toggleButton.click()
    expect(uiPanel.classList.contains('open')).toBe(false)
  })

  it('should apply filter and set active button on filter click', () => {
    const plugin = new FilterPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    const emitSpy = vi.spyOn(events, 'emit')

    // Click the second button
    filterButton2.click()

    expect(sliderMock.filterEngine!.applyFilter).toHaveBeenCalledWith('blur(5px)')
    expect(emitSpy).toHaveBeenCalledWith('filterChange', { name: 'Blur', value: 'blur(5px)' })
    expect(filterButton1.classList.contains('active')).toBe(false)
    expect(filterButton2.classList.contains('active')).toBe(true)
  })

  it('should add "Original" button when switching to single view', () => {
    const plugin = new FilterPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()

    events.emit('comparisonViewChange', { isComparisonView: false })

    const originalButton = uiPanel.querySelector('button[data-filter="none"]')
    expect(originalButton).not.toBeNull()
    expect(originalButton?.textContent).toBe('Original')
    // It should also be set to active
    expect(originalButton?.classList.contains('active')).toBe(true)
    expect(sliderMock.filterEngine!.applyFilter).toHaveBeenCalledWith('none')
  })

  it('should remove "Original" button and restore last active filter', () => {
    const plugin = new FilterPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()
    filterButton2.click() // Set a different active filter

    // Go to single view first
    events.emit('comparisonViewChange', { isComparisonView: false })
    expect(uiPanel.querySelector('button[data-filter="none"]')).not.toBeNull()

    // Go back to comparison view
    events.emit('comparisonViewChange', { isComparisonView: true })
    expect(uiPanel.querySelector('button[data-filter="none"]')).toBeNull()
    // It should restore the last active filter (filterButton2)
    expect(filterButton2.classList.contains('active')).toBe(true)
    expect(sliderMock.filterEngine!.applyFilter).toHaveBeenCalledWith('blur(5px)')
  })

  it('should remove "Original" button and set initial filter if last active was "Original"', () => {
    const plugin = new FilterPlugin(sliderMock as ComparisonSlider, config, events)
    plugin.initialize()

    // Go to single view and click "Original"
    events.emit('comparisonViewChange', { isComparisonView: false })
    const originalButton = uiPanel.querySelector('button[data-filter="none"]') as HTMLButtonElement
    originalButton.click()

    // Go back to comparison view
    events.emit('comparisonViewChange', { isComparisonView: true })
    expect(uiPanel.querySelector('button[data-filter="none"]')).toBeNull()

    // It should fall back to the initial filter (filterButton1)
    expect(filterButton1.classList.contains('active')).toBe(true)
    expect(sliderMock.filterEngine!.applyFilter).toHaveBeenCalledWith('sepia(1)')
  })
})
