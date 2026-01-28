import { ComparisonSlider } from '../core/ComparisonSlider'
import { UIConfig } from '../config'

export class LoadImagePlugin {
  private readonly slider: ComparisonSlider
  private readonly config: UIConfig
  private uploadButton!: HTMLButtonElement
  private fileInput!: HTMLInputElement

  constructor(slider: ComparisonSlider, config: UIConfig) {
    this.slider = slider
    this.config = config
  }

  public initialize() {
    if (this.slider.originalImage.dataset.imgset === undefined) return

    const uploadButtonBlock = this.config.uiBlocks.find(block => block.id === 'actionButtons')
    if (!uploadButtonBlock) return

    const uploadButtonConfig = uploadButtonBlock.buttons.find(button => button.id === 'uploadButton')
    if (!uploadButtonConfig) return

    this.uploadButton = this.slider.container.querySelector('#uploadButton')!
    if (!this.uploadButton) return

    this.createFileInput()
    this.bindEvents()
  }

  private createFileInput() {
    this.fileInput = document.createElement('input')
    this.fileInput.type = 'file'
    this.fileInput.accept = 'image/*'
    this.fileInput.style.display = 'none'
    this.fileInput.multiple = true
    this.slider.container.appendChild(this.fileInput)
  }

  private bindEvents() {
    this.uploadButton.addEventListener('click', () => this.fileInput.click())
    this.fileInput.addEventListener('change', (event) => this.handleFileSelect(event))
  }

  private async handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    const files = target.files

    if (files && files.length > 0) {
      const dataUrls = Array.from(files).map(file => URL.createObjectURL(file))

      if (this.slider.imageSetPlugin) {
        await this.slider.imageSetPlugin.addImages(dataUrls)
      } else {
        await this.slider.updateImage(dataUrls[0])
      }
    }
  }
}
