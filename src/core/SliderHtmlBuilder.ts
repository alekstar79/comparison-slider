import { UIConfig } from '../config'
import { FILTERS } from '../filters'

export class SliderHtmlBuilder {
  public static readonly ALL_FILTERS = FILTERS

  static enhanceImage(img: HTMLImageElement, config: UIConfig): HTMLElement
  {
    const container = document.createElement('div')
    const direction = (img.dataset.direction as 'horizontal' | 'vertical') || 'horizontal'
    const initX = img.dataset.initX || '25'
    const initY = img.dataset.initY || '25'

    const coveredContent = `<div 
      class="covered" 
      data-direction="${direction}" 
      data-init-x="${initX}" 
      data-init-y="${initY}"
    >
      <canvas class="original-canvas"></canvas>
      <canvas class="filtered-canvas"></canvas>
      <div class="handle-line"></div>
    </div>`

    let uiElementsHtml = ''
    config.uiBlocks.forEach(block => {
      let buttonsHtml: string
      if (block.id === 'filterPanel') {
        const filterNamesStr = img.dataset.filters || 'Grayscale,Blur,Invert,Bright'
        const filterNames = filterNamesStr.split(',').map(name => name.trim())
        let filtersToRender = SliderHtmlBuilder.ALL_FILTERS

        if (!filterNames.includes('all') && !filterNames.includes('*')) {
          filtersToRender = SliderHtmlBuilder.ALL_FILTERS.filter(filterDef =>
            filterNames.some(name => name.trim() === filterDef.name)
          )
        }

        buttonsHtml = filtersToRender.map(filterDef =>
          `<button data-filter="${filterDef.value}">${filterDef.name}</button>`
        ).join('')

        uiElementsHtml += `<div class="ui-panel" id="${block.id}">
          <div class="filter-buttons">${buttonsHtml}</div>
        </div>`
      } else {
        buttonsHtml = block.buttons.map(button =>
          `<button class="${button.id}" id="${button.id}">${button.iconSvg || button.text}</button>`
        ).join('')
        uiElementsHtml += `<div class="ui-block ${block.direction}" id="${block.id}">${buttonsHtml}</div>`
      }
    })

    container.className = `slider-container ${img.className}`
    container.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`
    container.innerHTML = coveredContent + uiElementsHtml + `<div class="handle-grip"></div>`

    const parent = img.parentNode!

    parent.insertBefore(container, img)
    parent.removeChild(img)

    // Apply block positions from config
    config.uiBlocks.forEach(block => {
      const blockElement = container.querySelector(`#${block.id}`) as HTMLElement
      if (blockElement && block.position) {
        Object.assign(blockElement.style, block.position)
      }
    })

    return container
  }
}
