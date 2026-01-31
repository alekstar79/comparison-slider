import type { UIConfig, Plugin } from '../config'

import { ComparisonSlider } from '../core/ComparisonSlider'
import { EventEmitter } from '../core/EventEmitter'

export class SavePlugin implements Plugin {
  private readonly slider: ComparisonSlider

  constructor(slider: ComparisonSlider, _config: UIConfig, _events: EventEmitter) {
    this.slider = slider
  }

  public initialize() {
    const saveButton = this.slider.container.querySelector('#saveButton')
    if (saveButton) {
      saveButton.addEventListener('click', () => this.saveImage())
    }
  }

  private saveImage() {
    const { originalImage } = this.slider
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!

    // Set canvas to the full, original image size
    tempCanvas.width = originalImage.naturalWidth
    tempCanvas.height = originalImage.naturalHeight

    // Get the current filter from the active button
    const activeFilterButton = this.slider.container.querySelector('.filter-buttons button.active') as HTMLElement
    // Use textContent for better reliability in different environments (JSDOM)
    const currentFilter = activeFilterButton ? activeFilterButton.dataset.filter : 'none'
    const filterName = activeFilterButton ? (activeFilterButton.textContent || 'filtered').toLowerCase().replace(/\s+/g, '-') : 'filtered'

    // Apply the filter to the high-resolution context
    if (currentFilter && currentFilter !== 'none') {
      tempCtx.filter = currentFilter
    }

    // Draw the original image to the high-resolution canvas
    tempCtx.drawImage(originalImage, 0, 0)

    // Generate file name
    const originalFileName = originalImage.src.split('/').pop()?.split('.').slice(0, -1).join('.') || 'image'
    const finalFileName = `${originalFileName}-${filterName}.png`

    // Trigger download
    const link = document.createElement('a')
    link.download = finalFileName
    link.href = tempCanvas.toDataURL('image/png')
    link.click()
  }
}
