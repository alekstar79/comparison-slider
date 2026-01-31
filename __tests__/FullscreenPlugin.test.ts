import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type UIConfig, type ComparisonSlider, FullscreenPlugin } from '../src'

describe('FullscreenPlugin', () => {
  let sliderMock: Partial<ComparisonSlider>
  let container: HTMLElement
  let fullscreenButton: HTMLButtonElement

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="slider-container">
        <button id="fullscreenButton"></button>
      </div>
    `
    container = document.body.querySelector('.slider-container')!
    fullscreenButton = container.querySelector('#fullscreenButton')!

    sliderMock = {
      container
    }

    // Mock the Fullscreen API as it's not implemented in JSDOM
    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      writable: true,
      configurable: true
    })
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined)
    Element.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined)
  })

  it('should initialize and bind click event', () => {
    const addEventListenerSpy = vi.spyOn(fullscreenButton, 'addEventListener')
    const plugin = new FullscreenPlugin(sliderMock as ComparisonSlider, {} as UIConfig, {} as any)
    plugin.initialize()
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
  })

  it('should call requestFullscreen when not in fullscreen', () => {
    const requestFullscreenSpy = vi.spyOn(container, 'requestFullscreen')
    const plugin = new FullscreenPlugin(sliderMock as ComparisonSlider, {} as UIConfig, {} as any)
    plugin.initialize()

    fullscreenButton.click()

    expect(requestFullscreenSpy).toHaveBeenCalled()
  })

  it('should call exitFullscreen when in fullscreen', () => {
    const exitFullscreenSpy = vi.spyOn(document, 'exitFullscreen')
    // Set the initial state to be in fullscreen
    Object.defineProperty(document, 'fullscreenElement', { value: container, configurable: true })

    const plugin = new FullscreenPlugin(sliderMock as ComparisonSlider, {} as UIConfig, {} as any)
    plugin.initialize()

    fullscreenButton.click()

    expect(exitFullscreenSpy).toHaveBeenCalled()
  })

  it('should toggle "fullscreen" class on fullscreenchange event', () => {
    const plugin = new FullscreenPlugin(sliderMock as ComparisonSlider, {} as UIConfig, {} as any)
    plugin.initialize()

    // Simulate entering fullscreen
    Object.defineProperty(document, 'fullscreenElement', { value: container, configurable: true })
    document.dispatchEvent(new Event('fullscreenchange'))
    expect(container.classList.contains('fullscreen')).toBe(true)

    // Simulate exiting fullscreen
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
    document.dispatchEvent(new Event('fullscreenchange'))
    expect(container.classList.contains('fullscreen')).toBe(false)
  })

  it('should not fail if button is not found', () => {
    fullscreenButton.remove()
    const plugin = new FullscreenPlugin(sliderMock as ComparisonSlider, {} as UIConfig, {} as any)
    expect(() => plugin.initialize()).not.toThrow()
  })
})
