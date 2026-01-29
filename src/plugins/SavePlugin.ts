import { ComparisonSlider } from '../core/ComparisonSlider'
import { EventEmitter } from '../core/EventEmitter'
import { UIConfig } from '../config'

export class SavePlugin {
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
    const { originalImage, filterEngine } = this.slider
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!

    tempCanvas.width = originalImage.naturalWidth
    tempCanvas.height = originalImage.naturalHeight

    const currentFilter = filterEngine.filteredCanvas.style.filter
    if (currentFilter) {
      tempCtx.filter = currentFilter
    }

    tempCtx.drawImage(originalImage, 0, 0, originalImage.naturalWidth, originalImage.naturalHeight)

    const originalFileName = originalImage.src.split('/').pop()?.split('.').slice(0, -1).join('.') || 'image'
    const activeFilterButton = this.slider.container.querySelector('.filter-buttons button.active') as HTMLElement
    const filterName = activeFilterButton ? activeFilterButton.innerText.toLowerCase().replace(/\s+/g, '-') : 'filtered'
    const finalFileName = `${originalFileName}-${filterName}.png`

    const link = document.createElement('a')
    link.download = finalFileName
    link.href = tempCanvas.toDataURL('image/png')
    link.click()
  }
}
