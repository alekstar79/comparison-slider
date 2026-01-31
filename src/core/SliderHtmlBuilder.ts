import { FilterPlugin } from '@/plugins/FilterPlugin'
import { FullscreenPlugin } from '@/plugins/FullscreenPlugin'
import { LabelPlugin } from '@/plugins/LabelPlugin'
import { LoadImagePlugin } from '@/plugins/LoadImagePlugin'
import { MagnifierPlugin } from '@/plugins/MagnifierPlugin'
import { SavePlugin } from '@/plugins/SavePlugin'

import type { ComparisonSlider } from './ComparisonSlider'
import { FILTERS } from '@/filters'

export class SliderHtmlBuilder {
  static enhanceImage(img: HTMLImageElement, slider: ComparisonSlider): HTMLElement {
    const container = document.createElement('div')
    const direction = (img.dataset.direction as 'horizontal' | 'vertical') || 'horizontal'
    const initX = img.dataset.initX || '250'
    const initY = img.dataset.initY || '300'
    const config = slider.config

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

    const hasPlugin = (pluginClass: any) => slider.plugins.some(p => p instanceof pluginClass)

    let uiElementsHtml = ''
    config.uiBlocks
      .filter(block => block.id !== 'navButtons')
      .forEach(block => {
        let buttonsHtml = ''
        if (block.id === 'filterPanel') {
          if (!hasPlugin(FilterPlugin)) return

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
            if (button.id === 'fullscreenButton') return hasPlugin(FullscreenPlugin)
            if (button.id === 'magnifierButton') return hasPlugin(MagnifierPlugin)
            if (button.id === 'saveButton') return hasPlugin(SavePlugin)
            if (button.id === 'toggleButton') return hasPlugin(FilterPlugin)
            if (button.id === 'uploadButton') return hasPlugin(LoadImagePlugin)
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

    const labelsHtml = hasPlugin(LabelPlugin)
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
