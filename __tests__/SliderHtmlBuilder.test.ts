import { describe, it, expect, beforeEach } from 'vitest'
import { SliderHtmlBuilder } from '../src/core/SliderHtmlBuilder'
import { type ComparisonSlider, FilterPlugin, FullscreenPlugin, LabelPlugin, defaultConfig } from '../src'

describe('SliderHtmlBuilder', () => {
  let img: HTMLImageElement
  let sliderMock: Partial<ComparisonSlider>

  beforeEach(() => {
    document.body.innerHTML = '<div id="wrapper"></div>'
    const wrapper = document.getElementById('wrapper')!
    img = document.createElement('img')
    img.className = 'my-slider'
    wrapper.appendChild(img)

    sliderMock = {
      config: JSON.parse(JSON.stringify(defaultConfig)),
      plugins: []
    }
  })

  it('should create the basic slider structure', () => {
    const container = SliderHtmlBuilder.enhanceImage(img, sliderMock as ComparisonSlider)
    expect(container.querySelector('.covered')).not.toBeNull()
    expect(container.querySelector('.original-canvas')).not.toBeNull()
    expect(container.querySelector('.handle-grip')).not.toBeNull()
    expect(container.classList.contains('my-slider')).toBe(true)
  })

  it('should create fullscreen button only if FullscreenPlugin is used', () => {
    let container = SliderHtmlBuilder.enhanceImage(img, sliderMock as ComparisonSlider)
    expect(container.querySelector('#fullscreenButton')).toBeNull()

    sliderMock.plugins = [new FullscreenPlugin({} as any, {} as any, {} as any)]
    document.getElementById('wrapper')!.innerHTML = ''
    document.getElementById('wrapper')!.appendChild(img)
    container = SliderHtmlBuilder.enhanceImage(img, sliderMock as ComparisonSlider)
    expect(container.querySelector('#fullscreenButton')).not.toBeNull()
  })

  it('should create filter panel only if FilterPlugin is used', () => {
    sliderMock.plugins = [new FilterPlugin({} as any, {} as any, {} as any)]
    const container = SliderHtmlBuilder.enhanceImage(img, sliderMock as ComparisonSlider)
    expect(container.querySelector('#filterPanel')).not.toBeNull()
    expect(container.querySelectorAll('.filter-buttons button').length).toBeGreaterThan(0)
  })

  it('should create labels only if LabelPlugin is used', () => {
    sliderMock.plugins = [new LabelPlugin({} as any, {} as any, {} as any)]
    const container = SliderHtmlBuilder.enhanceImage(img, sliderMock as ComparisonSlider)
    expect(container.querySelector('.comparison-label')).not.toBeNull()
  })

  it('should render only specified filters from data-filters attribute', () => {
    sliderMock.plugins = [new FilterPlugin({} as any, {} as any, {} as any)]
    img.dataset.filters = 'Sepia,Blur'
    const container = SliderHtmlBuilder.enhanceImage(img, sliderMock as ComparisonSlider)
    const buttons = container.querySelectorAll('.filter-buttons button')

    // Check for presence and content regardless of order
    const buttonTexts = Array.from(buttons).map(btn => btn.textContent)
    expect(buttons.length).toBe(2)
    expect(buttonTexts).toContain('Sepia')
    expect(buttonTexts).toContain('Blur')
  })

  it('should add "Original" filter button if comparison is false', () => {
    sliderMock.plugins = [new FilterPlugin({} as any, {} as any, {} as any)]
    sliderMock.config!.comparison = false
    const container = SliderHtmlBuilder.enhanceImage(img, sliderMock as ComparisonSlider)
    const originalButton = container.querySelector('.filter-buttons button[data-filter="none"]')
    expect(originalButton).not.toBeNull()
    expect(originalButton?.textContent).toBe('Original')
  })
})
