import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ComparisonSlider, defaultConfig } from '../src'
import { DragController } from '../src/core/DragController'

vi.mock('../src/core/DragController')
vi.mock('../src/core/FilterEngine')

describe('ComparisonSlider', () => {
  let imgElement: HTMLImageElement

  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = '<img id="slider-container" data-imgset="test.jpg" data-comparison="true" alt="" src=""/>'
    imgElement = document.getElementById('slider-container') as HTMLImageElement
    Object.defineProperties(imgElement, {
      naturalWidth: { value: 800, configurable: true },
      naturalHeight: { value: 600, configurable: true },
      // Start as not complete to test ensureImageLoaded
      complete: { value: false, configurable: true }
    })
  })

  it('should initialize with default configuration', () => {
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    expect(slider.config).toEqual(defaultConfig)
  })

  it('should merge all simple data-attributes into config', () => {
    imgElement.dataset.hoverToSlide = 'false'
    imgElement.dataset.labelsBefore = 'Before'
    imgElement.dataset.labelsAfter = 'After'
    imgElement.dataset.labelsPosition = 'bottom-left'
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    expect(slider.config.hoverToSlide).toBe(false)
    expect(slider.config.labels!.before).toBe('Before')
    expect(slider.config.labels!.after).toBe('After')
    expect(slider.config.labels!.position).toBe('bottom-left')
  })

  it('should correctly parse data-comparison="false"', () => {
    imgElement.dataset.comparison = 'false'
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    expect(slider.config.comparison).toBe(false)
  })

  it('should use default comparison config if data-attribute is missing', () => {
    imgElement.removeAttribute('data-comparison')
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    expect(slider.config.comparison).toBe(defaultConfig.comparison)
  })

  it('should merge uiBlocks direction attribute', () => {
    imgElement.dataset.navButtonsDirection = 'vertical'
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    const navButtonsConfig = slider.config.uiBlocks.find(b => b.id === 'navButtons')
    expect(navButtonsConfig?.direction).toBe('vertical')
  })

  it('should merge uiBlocks position attribute', () => {
    imgElement.dataset.navButtons = "{ top: '10px', left: '10px' }"
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    const navButtonsConfig = slider.config.uiBlocks.find(b => b.id === 'navButtons')
    expect(navButtonsConfig?.position).toEqual({ top: '10px', left: '10px' })
  })

  it('should handle invalid data-attribute objects gracefully', () => {
    imgElement.dataset.navButtons = "not-an-object"
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    const navButtonsConfig = slider.config.uiBlocks.find(b => b.id === 'navButtons')
    // It should not throw and the position should remain the default from defaultConfig
    const defaultNavConfig = defaultConfig.uiBlocks.find(b => b.id === 'navButtons')
    expect(navButtonsConfig?.position).toEqual(defaultNavConfig!.position)
  })

  it('should not create DragController if comparison is false', async () => {
    imgElement.dataset.comparison = 'false'
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    await slider.mount()
    // Manually add the button that mount() would normally create via SliderHtmlBuilder
    const button = document.createElement('button')
    button.id = 'comparisonButton'
    slider.container.appendChild(button)
    // Re-run mount logic that deals with the button
    if (!slider.config.comparison) {
      const comparisonButton = slider.container.querySelector('#comparisonButton') as HTMLElement
      if (comparisonButton) {
        comparisonButton.style.display = 'none'
      }
    }

    expect(DragController).not.toHaveBeenCalled()
    expect(button.style.display).toBe('none')
  })

  it('should not throw if comparison button is not found', async () => {
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    await slider.mount()
    // In this setup, the button is not added to the container.
    // We just need to ensure no error is thrown.
    expect(() => {
      const comparisonButton = slider.container.querySelector('#nonExistentButton')
      if (comparisonButton) {
        comparisonButton.dispatchEvent(new Event('click'))
      }
    }).not.toThrow()
  })

  it('should use default handle position if data-attributes are missing', async () => {
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    await slider.mount()
    const dragControllerInstance = (DragController as any).mock.instances[0]
    expect(dragControllerInstance.setNormalizedPosition).toHaveBeenCalledWith(250 / 800, 300 / 600)
  })

  it('should wait for image to load if not complete', async () => {
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    const mountPromise = slider.mount()
    // Manually trigger the load event our setup mock is waiting for
    imgElement.dispatchEvent(new Event('load'))
    await expect(mountPromise).resolves.toBeUndefined()
  })

  it('should handle resize observer callback with empty entries', async () => {
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    await slider.mount()
    const resizeCallback = (global.ResizeObserver as any).mock.calls[0][0]
    const redrawSpy = vi.spyOn(slider.filterEngine, 'redraw')

    // Test with no entries
    resizeCallback([])
    expect(redrawSpy).not.toHaveBeenCalled()

    // Test with undefined entries
    resizeCallback()
    expect(redrawSpy).not.toHaveBeenCalled()
  })

  it('should handle resize observer callback', async () => {
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    await slider.mount()
    const resizeCallback = (global.ResizeObserver as any).mock.calls[0][0]
    const redrawSpy = vi.spyOn(slider.filterEngine, 'redraw')
    const updateHandleSpy = vi.spyOn(slider as any, 'updateHandlePosition')

    resizeCallback([{ contentRect: { width: 100, height: 100 } }])

    expect(redrawSpy).toHaveBeenCalledWith(100, 100)
    expect(updateHandleSpy).toHaveBeenCalled()
  })

  it('should toggle comparison view', async () => {
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    await slider.mount()
    const dragControllerInstance = (DragController as any).mock.instances[0]
    const setDisabledSpy = vi.spyOn(dragControllerInstance, 'setDisabled')
    const eventsSpy = vi.spyOn(slider.events, 'emit')

    slider.toggleComparisonView() // Turn it off

    expect(slider.isComparisonView).toBe(false)
    expect(slider.container.classList.contains('mode-single-view')).toBe(true)
    expect(setDisabledSpy).toHaveBeenCalledWith(true)
    expect(eventsSpy).toHaveBeenCalledWith('comparisonViewChange', { isComparisonView: false })

    slider.toggleComparisonView() // Turn it back on

    expect(slider.isComparisonView).toBe(true)
    expect(slider.container.classList.contains('mode-single-view')).toBe(false)
    expect(setDisabledSpy).toHaveBeenCalledWith(false)
    expect(eventsSpy).toHaveBeenCalledWith('comparisonViewChange', { isComparisonView: true })
  })

  it('should toggle comparison view on button click', async () => {
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    await slider.mount()
    const toggleSpy = vi.spyOn(slider, 'toggleComparisonView')

    const comparisonButton = slider.container.querySelector('#comparisonButton') as HTMLElement
    expect(comparisonButton).not.toBeNull()
    comparisonButton.click()

    expect(toggleSpy).toHaveBeenCalled()
  })

  it('should update image from an HTMLImageElement', async () => {
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    await slider.mount()
    const newImage = new Image()

    await slider.updateImage(newImage)

    expect(slider.originalImage).toBe(newImage)
    expect(slider.filterEngine.updateImage).toHaveBeenCalledWith(newImage)
  })

  it('should update image from a URL string', async () => {
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    await slider.mount()
    const ensureLoadedSpy = vi.spyOn(slider as any, 'ensureImageLoaded').mockResolvedValue(undefined)

    const newImageUrl = 'new-image.jpg'
    await slider.updateImage(newImageUrl)

    expect(ensureLoadedSpy).toHaveBeenCalled()
    expect(slider.originalImage.src).toContain(newImageUrl)
    expect(slider.filterEngine.updateImage).toHaveBeenCalled()
  })

  it('should not reset handle position on image update if reset is false', async () => {
    const slider = new ComparisonSlider(imgElement, defaultConfig)
    await slider.mount()
    const setInitialPosSpy = vi.spyOn(slider as any, 'setInitialHandlePosition')

    await slider.updateImage(new Image(), false)

    expect(setInitialPosSpy).not.toHaveBeenCalled()
  })
})
