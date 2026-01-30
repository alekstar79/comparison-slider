import type { UIConfig, Plugin } from '../config'

import { ComparisonSlider } from '../core/ComparisonSlider'
import { EventEmitter } from '../core/EventEmitter'

export class LoadImagePlugin implements Plugin {
  private readonly fileInput: HTMLInputElement
  private readonly slider: ComparisonSlider

  constructor(slider: ComparisonSlider, _config: UIConfig, _events: EventEmitter) {
    this.fileInput = this.createFileInput()
    this.slider = slider
  }

  public initialize() {
    const uploadButton = this.slider.container.querySelector('#uploadButton')
    if (uploadButton) {
      uploadButton.addEventListener('click', () => {
        this.fileInput.click()
      })
    }
  }

  private createFileInput(): HTMLInputElement {
    const input = document.createElement('input')

    input.type = 'file'
    input.accept = 'image/*'
    input.style.display = 'none'
    input.addEventListener('change', (event) => {
      this.onFileSelect(event)
    })

    document.body.appendChild(input)

    return input
  }

  private onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement

    if (input.files && input.files[0]) {
      const reader = new FileReader()

      reader.onload = async (e) => {
        if (e.target?.result) {
          await this.slider.updateImage(e.target.result as string)
        }
      }

      reader.readAsDataURL(input.files[0])
    }
  }
}
