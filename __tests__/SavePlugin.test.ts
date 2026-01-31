import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type UIConfig, type ComparisonSlider, SavePlugin } from '../src'

describe('SavePlugin', () => {
  let sliderMock: Partial<ComparisonSlider>
  let container: HTMLElement
  let saveButton: HTMLButtonElement
  let activeFilterButton: HTMLButtonElement

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="slider-container">
        <div class="filter-buttons">
          <button class="active" data-filter="sepia(1)"></button>
        </div>
        <button id="saveButton"></button>
      </div>
    `
    container = document.body.querySelector('.slider-container')!
    saveButton = container.querySelector('#saveButton')!
    activeFilterButton = container.querySelector('.filter-buttons button')!
    // Use textContent for reliability in JSDOM
    activeFilterButton.textContent = 'Sepia'

    const originalImage = new Image()
    // This now works because of the improved mock in setup.ts
    originalImage.src = 'path/to/my-image.jpg'
    Object.defineProperty(originalImage, 'naturalWidth', { value: 1920, configurable: true })
    Object.defineProperty(originalImage, 'naturalHeight', { value: 1080, configurable: true })

    sliderMock = {
      container,
      originalImage
    }
  })

  it('should initialize and bind click event', () => {
    const addEventListenerSpy = vi.spyOn(saveButton, 'addEventListener')
    const plugin = new SavePlugin(sliderMock as ComparisonSlider, {} as UIConfig, {} as any)
    plugin.initialize()
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
  })

  it('should create a canvas, apply filter, and trigger download on click', () => {
    const createElementSpy = vi.spyOn(document, 'createElement')
    const toDataURLSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,test')
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const plugin = new SavePlugin(sliderMock as ComparisonSlider, {} as UIConfig, {} as any)
    plugin.initialize()

    saveButton.click()

    const tempCanvas = createElementSpy.mock.results[0].value as HTMLCanvasElement
    expect(tempCanvas.tagName).toBe('CANVAS')
    expect(tempCanvas.width).toBe(1920)

    const tempCtx = tempCanvas.getContext('2d')!
    expect(tempCtx.filter).toBe('sepia(1)')
    expect(tempCtx.drawImage).toHaveBeenCalledWith(sliderMock.originalImage, 0, 0)

    expect(createElementSpy).toHaveBeenCalledTimes(2)
    const link = createElementSpy.mock.results[1].value as HTMLAnchorElement
    expect(link.tagName).toBe('A')
    expect(link.download).toBe('my-image-sepia.png')
    expect(link.href).toBe('data:image/png;base64,test')

    expect(clickSpy).toHaveBeenCalled()

    toDataURLSpy.mockRestore()
    clickSpy.mockRestore()
    createElementSpy.mockRestore()
  })

  it('should not fail if save button is not found', () => {
    saveButton.remove()
    const plugin = new SavePlugin(sliderMock as ComparisonSlider, {} as UIConfig, {} as any)
    expect(() => plugin.initialize()).not.toThrow()
  })
})
