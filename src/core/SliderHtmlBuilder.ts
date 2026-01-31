import type { UIConfig } from '../config'
import { FILTERS } from '@/filters'

// import { FilterPlugin } from '../plugins/FilterPlugin'
// import { FullscreenPlugin } from '../plugins/FullscreenPlugin'
// import { LabelPlugin } from '../plugins/LabelPlugin'
// import { LoadImagePlugin } from '../plugins/LoadImagePlugin'
// import { MagnifierPlugin } from '../plugins/MagnifierPlugin'
// import { SavePlugin } from '../plugins/SavePlugin'

export class SliderHtmlBuilder {
  static enhanceImage(img: HTMLImageElement, config: UIConfig): HTMLElement {
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

    const activePluginSet = new Set(config.plugins.map(p => p.name))

    let uiElementsHtml = ''
    // Filter out navButtons, as they are handled by ImageSetPlugin itself
    config.uiBlocks
      .filter(block => block.id !== 'navButtons')
      .forEach(block => {
        let buttonsHtml = ''
        if (block.id === 'filterPanel') {
          if (!activePluginSet.has(FilterPlugin.name)) return

          const filterNamesStr = img.dataset.filters || 'Grayscale,Blur,Invert,Bright'
          const filterNames = filterNamesStr.split(',').map(name => name.trim())

          let filtersToRender = FILTERS
          if (!filterNames.includes('all') && !filterNames.includes('*')) {
            filtersToRender = FILTERS.filter(filterDef =>
              filterNames.some(name => name.trim() === filterDef.name)
            )
          }

          if (config.comparison) {
            filtersToRender = filtersToRender.filter(f => f.value !== 'none')
          } else {
            if (!filtersToRender.some(f => f.value === 'none')) {
              filtersToRender.unshift({ name: 'Original', value: 'none' })
            }
          }

          buttonsHtml = filtersToRender.map(filterDef =>
            `<button data-filter="${filterDef.value}">${filterDef.name}</button>`
          ).join('')

          uiElementsHtml += `<div class="ui-panel" id="${block.id}"><div class="filter-buttons">${buttonsHtml}</div></div>`
        } else {
          const filteredButtons = block.buttons.filter(button => {
            if (button.id === 'comparisonButton') return config.comparison
            if (button.id === 'fullscreenButton') return activePluginSet.has(FullscreenPlugin.name)
            if (button.id === 'magnifierButton') return activePluginSet.has(MagnifierPlugin.name)
            if (button.id === 'saveButton') return activePluginSet.has(SavePlugin.name)
            if (button.id === 'toggleButton') return activePluginSet.has(FilterPlugin.name)
            if (button.id === 'uploadButton') return activePluginSet.has(LoadImagePlugin.name)
            return true
          })

          if (filteredButtons.length === 0) return

          buttonsHtml = filteredButtons.map(button =>
            `<button ${button.id ? `id="${button.id}"` : ''} ${button.class ? `class="${button.class}"` : ''}>${button.iconSvg || button.text}</button>`
          ).join('')

          if (buttonsHtml) {
            uiElementsHtml += `<div id="${block.id}" ${block.class ? `class="${block.class}"` : `class="ui-block ${block.direction}`}">${buttonsHtml}</div>`
          }
        }
      })

    const labelsHtml = activePluginSet.has(LabelPlugin.name)
      ? `<div class="comparison-label label-after"></div><div class="comparison-label label-before"></div>`
      : ''

    const handleGripHtml = `<div class="handle-grip">${config.handle?.gripIconSvg || ''}</div>`

    container.className = `slider-container ${img.className}`
    container.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`
    container.innerHTML = coveredContent + uiElementsHtml + labelsHtml + handleGripHtml

    const parent = img.parentNode!
    parent.insertBefore(container, img)
    parent.removeChild(img)

    config.uiBlocks.forEach(block => {
      const blockElement = container.querySelector(`#${block.id}`) as HTMLElement
      if (blockElement && block.position) {
        Object.assign(blockElement.style, block.position)
      }
    })

    return container
  }
}
