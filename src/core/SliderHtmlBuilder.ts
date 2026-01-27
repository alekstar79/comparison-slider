import { defaultConfig } from '../config' // Import the default configuration

export class SliderHtmlBuilder
{
  private static readonly ALL_FILTERS = [
    // Basic
    { name: 'Grayscale', value: 'grayscale(100%)' },
    { name: 'Blur', value: 'blur(3px)' },
    { name: 'Invert', value: 'invert(100%)' },
    { name: 'Bright', value: 'brightness(150%)' },

    // Contrast/brightness
    { name: 'Dark', value: 'brightness(50%)' },
    { name: 'Contrast', value: 'contrast(200%)' },
    { name: 'Poster', value: 'contrast(300%) brightness(70%)' },

    // Chromatic
    { name: 'Sepia', value: 'sepia(100%)' },
    { name: 'Blue', value: 'hue-rotate(90deg)' },
    { name: 'Orange', value: 'hue-rotate(180deg)' },
    { name: 'Saturate', value: 'saturate(300%)' },

    // Advanced
    { name: 'Heavy Blur', value: 'blur(8px)' },
    { name: 'Shadow', value: 'brightness(60%) contrast(150%)' },
    { name: 'Glow', value: 'brightness(130%) contrast(120%) drop-shadow(0 0 5px rgba(255,255,255,0.8))' },
    { name: 'Vintage', value: 'sepia(60%) brightness(110%) contrast(110%)' },
    { name: 'Cold', value: 'hue-rotate(-20deg) contrast(110%) brightness(95%)' },
    { name: 'Warm', value: 'hue-rotate(20deg) saturate(120%) brightness(105%)' }
  ]

  static enhanceImage(img: HTMLImageElement): HTMLElement
  {
    const container = document.createElement('div')
    container.className = `slider-container ${img.className}`
    container.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`

    const direction = (img.dataset.direction as 'horizontal' | 'vertical') || 'horizontal'
    const initX = img.dataset.initX || '25'
    const initY = img.dataset.initY || '25'

    const filterNamesStr = img.dataset.filters || 'Grayscale,Blur,Invert,Bright'
    const filterNames = filterNamesStr.split(',').map(name => name.trim())

    let filtersToRender = SliderHtmlBuilder.ALL_FILTERS

    if (!filterNames.includes('all') && !filterNames.includes('*')) {
      filtersToRender = SliderHtmlBuilder.ALL_FILTERS.filter(filterDef =>
        filterNames.some(name => name.trim() === filterDef.name)
      )
    }

    const filtersHtml = filtersToRender.map(filterDef =>
      `<button data-filter="${filterDef.value}">${filterDef.name}</button>`
    ).join('')

    container.innerHTML = `<div 
      class="covered" 
      data-direction="${direction}" 
      data-init-x="${initX}" 
      data-init-y="${initY}"
      style="${img.style.cssText}"
    >
      <canvas class="original-canvas"></canvas>
      <canvas class="filtered-canvas"></canvas>
      <div class="handle-line"></div>
      <div class="ui-panel">
        <div class="filter-buttons">${filtersHtml}</div>
      </div>
      <button class="ui-toggle-button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </button>
    </div>
    <div class="handle-grip"></div>`

    const parent = img.parentNode!
    parent.insertBefore(container, img)
    parent.removeChild(img)

    // Apply button positions from config
    const uiToggleButton = container.querySelector('.ui-toggle-button') as HTMLElement
    if (uiToggleButton && defaultConfig.buttonPositions.uiToggleButton) {
      Object.assign(uiToggleButton.style, defaultConfig.buttonPositions.uiToggleButton)
    }

    return container
  }
}
