import { describe, it, expect, beforeEach } from 'vitest'
import { SliderHtmlBuilder } from '../src/core/SliderHtmlBuilder'
import { type UIBlock, type ComparisonSlider, defaultConfig, FilterPlugin } from '../src'

describe('SliderHtmlBuilder', () => {
  let img: HTMLImageElement
  let sliderMock: Partial<ComparisonSlider>

  beforeEach(() => {
    document.body.innerHTML = '<div id="parent"><img id="test-img" class="my-class" data-direction="vertical" alt="" src=""/></div>'
    img = document.getElementById('test-img') as HTMLImageElement
    Object.defineProperties(img, {
      naturalWidth: { value: 800, configurable: true },
      naturalHeight: { value: 600, configurable: true }
    })

    sliderMock = {
      config: JSON.parse(JSON.stringify(defaultConfig)),
      plugins: [new FilterPlugin({} as ComparisonSlider, defaultConfig, {} as any)]
    }
  })

  it('should create a container and replace the original image', () => {
    const parent = img.parentNode
    const container = SliderHtmlBuilder.enhanceImage(img, sliderMock as ComparisonSlider)

    expect(container.classList.contains('slider-container')).toBe(true)
    expect(parent?.contains(img)).toBe(false)
    expect(parent?.contains(container)).toBe(true)
  })

  it('should copy classes from the original image', () => {
    const container = SliderHtmlBuilder.enhanceImage(img, sliderMock as ComparisonSlider)
    expect(container.classList.contains('my-class')).toBe(true)
  })

  it('should set aspect-ratio based on image dimensions', () => {
    const container = SliderHtmlBuilder.enhanceImage(img, sliderMock as ComparisonSlider)
    expect(container.style.aspectRatio).toBe('800 / 600')
  })

  it('should create covered content with correct data attributes', () => {
    const container = SliderHtmlBuilder.enhanceImage(img, sliderMock as ComparisonSlider)
    const covered = container.querySelector('.covered')!
    expect(covered).not.toBeNull()
    expect(covered.querySelector('.original-canvas')).not.toBeNull()
    expect(covered.querySelector('.filtered-canvas')).not.toBeNull()
    expect((covered as HTMLElement).dataset.direction).toBe('vertical')
  })

  it('should create filter buttons based on data-filters attribute', () => {
    img.dataset.filters = 'Grayscale,Invert'
    const container = SliderHtmlBuilder.enhanceImage(img, sliderMock as ComparisonSlider)
    const filterButtons = container.querySelectorAll('.filter-buttons button')
    expect(filterButtons.length).toBe(2)
    expect(filterButtons[0].textContent).toBe('Grayscale')
    expect(filterButtons[1].textContent).toBe('Invert')
  })

  it('should not create a ui-block if all its buttons are filtered out', () => {
    // Mock a config where the only button requires a plugin that is not present
    sliderMock.config!.uiBlocks = [{
      id: 'testBlock',
      direction: 'horizontal',
      buttons: [{ id: 'saveButton', iconSvg: '...' }]
    } as UIBlock]
    // Ensure the SavePlugin is NOT in the plugins array
    Object.defineProperty(sliderMock, 'plugins', { value: [], configurable: true })

    const container = SliderHtmlBuilder.enhanceImage(img, sliderMock as ComparisonSlider)
    const testBlock = container.querySelector('#testBlock')
    expect(testBlock).toBeNull()
  })
})
