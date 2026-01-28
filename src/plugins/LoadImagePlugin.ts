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
    this.slider.container.appendChild(this.fileInput)
  }

  private bindEvents() {
    this.uploadButton.addEventListener('click', () => this.fileInput.click())
    this.fileInput.addEventListener('change', (event) => this.handleFileSelect(event))
  }

  private handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (file) {
      const reader = new FileReader()

      reader.onload = async (e) => {
        if (e.target?.result) {
          await this.slider.updateImage(e.target.result as string)
        }
      }

      reader.readAsDataURL(file)
    }
  }
}
