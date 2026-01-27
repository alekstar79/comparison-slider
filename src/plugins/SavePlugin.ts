import { ComparisonSlider } from '../core/ComparisonSlider'
import { defaultConfig } from '../config' // Import the default configuration

export class SavePlugin {
  private readonly slider: ComparisonSlider
  private saveButton!: HTMLButtonElement

  constructor(slider: ComparisonSlider) {
    this.slider = slider
  }

  public initialize() {
    this.createButton()
    this.applyStyles()
    this.bindEvents()
  }

  private createButton() {
    this.saveButton = document.createElement('button')
    this.saveButton.className = 'save-button'
    this.saveButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>`
    this.slider.container.appendChild(this.saveButton)
  }

  private applyStyles() {
    const position = defaultConfig.buttonPositions.saveButton
    if (position) {
      Object.assign(this.saveButton.style, position)
    }
  }

  private bindEvents() {
    this.saveButton.addEventListener('click', () => this.download())
  }

  private download() {
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!
    const originalImage = this.slider.originalImage as HTMLImageElement
    const filteredCanvas = this.slider.filterEngine.filteredCanvas as HTMLCanvasElement

    tempCanvas.width = originalImage.naturalWidth
    tempCanvas.height = originalImage.naturalHeight
    tempCtx.filter = filteredCanvas.style.filter
    tempCtx.drawImage(originalImage, 0, 0)

    const link = document.createElement('a')
    
    // Determine file name
    const originalFileName = originalImage.src.split('/').pop()?.split('.')[0] || 'image'
    const currentFilterName = this.getCurrentFilterName() || 'original'
    link.download = `${originalFileName}-${currentFilterName}.png`

    link.href = tempCanvas.toDataURL('image/png')
    link.click()
  }

  private getCurrentFilterName(): string | null {
    const activeFilterButton = this.slider.container.querySelector('.filter-buttons button.active') as HTMLButtonElement | null
    if (activeFilterButton) {
      return activeFilterButton.textContent?.toLowerCase().replace(/\s/g, '-') || null
    }
    return null
  }
}
