import { ComparisonSlider } from '../core/ComparisonSlider'
import { UIConfig } from '../config'

export class SavePlugin {
  private readonly slider: ComparisonSlider
  private saveButton!: HTMLButtonElement

  constructor(slider: ComparisonSlider, _config: UIConfig) {
    this.slider = slider
  }

  public initialize() {
    this.saveButton = this.slider.container.querySelector('#saveButton')!
    this.bindEvents()
  }

  private bindEvents() {
    this.saveButton.addEventListener('click', () => this.download())
  }

  private download() {
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!
    const originalImage = this.slider.originalImage
    const filteredCanvas = this.slider.filterEngine.filteredCanvas

    tempCanvas.width = originalImage.naturalWidth
    tempCanvas.height = originalImage.naturalHeight
    tempCtx.filter = filteredCanvas.style.filter
    tempCtx.drawImage(originalImage, 0, 0)

    const link = document.createElement('a')
    const originalFileName = originalImage.src.split('/').pop()?.split('.')[0] || 'image'
    const currentFilterName = this.getCurrentFilterName() || 'original'
    link.download = `${originalFileName}-${currentFilterName}.png`

    link.href = tempCanvas.toDataURL('image/png')
    link.click()
  }

  private getCurrentFilterName(): string | null {
    const activeFilterButton = this.slider.container.querySelector('.filter-buttons button.active') as HTMLButtonElement

    if (activeFilterButton) {
      return activeFilterButton.textContent.toLowerCase()
        .replace(/\s/g, '-')
    }

    return null
  }
}
