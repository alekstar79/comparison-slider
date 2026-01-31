import { describe, it, expect, beforeEach, vi } from 'vitest'
import { type UIConfig, type ComparisonSlider, SavePlugin } from '../src'

describe('SavePlugin', () => {
  let sliderMock: Partial<ComparisonSlider>
  let container: HTMLElement
  let saveButton: HTMLButtonElement
  let activeFilterButton: HTMLButtonElement
  let originalImage: HTMLImageElement

  // Mock link click and toDataURL
  const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,test')

  beforeEach(() => {
    vi.clearAllMocks()
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
    activeFilterButton.textContent = 'Sepia'

    originalImage = new Image()
    originalImage.src = 'path/to/my-image.jpg'
    Object.defineProperties(originalImage, {
      naturalWidth: { value: 1920, configurable: true },
      naturalHeight: { value: 1080, configurable: true }
    })

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
    const plugin = new SavePlugin(sliderMock as ComparisonSlider, {} as UIConfig, {} as any)
    plugin.initialize()

    saveButton.click()

    const tempCanvas = createElementSpy.mock.results[0].value as HTMLCanvasElement
    expect(tempCanvas.width).toBe(1920)
    expect(tempCanvas.height).toBe(1080)

    const tempCtx = tempCanvas.getContext('2d')!
    expect(tempCtx.filter).toBe('sepia(1)')
    expect(tempCtx.drawImage).toHaveBeenCalledWith(originalImage, 0, 0)

    const link = createElementSpy.mock.results[1].value as HTMLAnchorElement
    expect(link.download).toBe('my-image-sepia.png')
    expect(clickSpy).toHaveBeenCalled()
  })

  it('should handle case with no active filter button', () => {
    activeFilterButton.classList.remove('active')
    const createElementSpy = vi.spyOn(document, 'createElement')
    const plugin = new SavePlugin(sliderMock as ComparisonSlider, {} as UIConfig, {} as any)
    plugin.initialize()

    saveButton.click()

    const tempCtx = (createElementSpy.mock.results[0].value as HTMLCanvasElement).getContext('2d')!
    expect(tempCtx.filter).toBe('none')

    const link = createElementSpy.mock.results[1].value as HTMLAnchorElement
    expect(link.download).toBe('my-image-filtered.png')
  })

  it('should handle image source without a file name', () => {
    sliderMock.originalImage!.src = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...'
    const createElementSpy = vi.spyOn(document, 'createElement')
    const plugin = new SavePlugin(sliderMock as ComparisonSlider, {} as UIConfig, {} as any)
    plugin.initialize()

    saveButton.click()

    const link = createElementSpy.mock.results[1].value as HTMLAnchorElement
    expect(link.download).toBe('image-sepia.png')
  })

  it('should handle filter button without textContent', () => {
    activeFilterButton.textContent = ''
    const createElementSpy = vi.spyOn(document, 'createElement')
    const plugin = new SavePlugin(sliderMock as ComparisonSlider, {} as UIConfig, {} as any)
    plugin.initialize()

    saveButton.click()

    const link = createElementSpy.mock.results[1].value as HTMLAnchorElement
    expect(link.download).toBe('my-image-filtered.png')
  })

  it('should not fail if save button is not found', () => {
    saveButton.remove()
    const plugin = new SavePlugin(sliderMock as ComparisonSlider, {} as UIConfig, {} as any)
    expect(() => plugin.initialize()).not.toThrow()
  })
})
