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
    { name: 'Warm', value: 'hue-rotate(20deg) saturate(120%) brightness(105%)' },
    
    // New Creative Filters
    { name: 'Cinematic', value: 'contrast(1.2) saturate(1.2) sepia(0.3)' },
    { name: 'Duotone', value: 'contrast(1.5) hue-rotate(-35deg) saturate(2)' },
    { name: 'Neon', value: 'brightness(1.5) contrast(1.5) saturate(1.5) hue-rotate(290deg)' },
    { name: 'Matrix', value: 'contrast(1.2) saturate(0.8) hue-rotate(90deg) brightness(0.8)' }
  ]

  static enhanceImage(img: HTMLImageElement): HTMLElement
  {
    const container = document.createElement('div')
    container.className = `slider-container ${img.className}`
    container.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`

    const direction = (img.dataset.direction as 'horizontal' | 'vertical') || 'horizontal'
    const initX = img.dataset.initX || '25'
    const initY = img.dataset.initY || '25'

    const filterNames = img.dataset.filters?.split(',') || ['Grayscale', 'Blur', 'Invert', 'Bright']

    let filtersHtml = ''
    SliderHtmlBuilder.ALL_FILTERS.forEach(filterDef => {
      if (filterNames.some(name => name.trim() === filterDef.name)) {
        filtersHtml += `<button data-filter="${filterDef.value}">${filterDef.name}</button>`
      }
    })

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
      
      <div class="filter-buttons">${filtersHtml}</div>
    </div>
    <div class="handle-grip"></div>` // Moved handle-grip outside .covered

    const parent = img.parentNode!
    parent.insertBefore(container, img)
    parent.removeChild(img)

    return container
  }
}
