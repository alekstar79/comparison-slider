import { ComparisonSlider } from '../core/ComparisonSlider'
import { UIConfig } from '../config'

export class FullscreenPlugin {
  private readonly slider: ComparisonSlider
  private readonly config: UIConfig
  private fullscreenButton!: HTMLButtonElement

  constructor(slider: ComparisonSlider, config: UIConfig) {
    this.slider = slider
    this.config = config
  }

  public initialize() {
    const fullscreenButtonBlock = this.config.uiBlocks.find(block => block.id === 'featuresButtons')
    if (!fullscreenButtonBlock) return

    const fullscreenButtonConfig = fullscreenButtonBlock.buttons.find(button => button.id === 'fullscreenButton')
    if (!fullscreenButtonConfig) return

    this.fullscreenButton = this.slider.container.querySelector('#fullscreenButton')!
    if (!this.fullscreenButton) return

    this.fullscreenButton.innerHTML = fullscreenButtonConfig.iconSvg || ''
    this.bindEvents()
  }

  private bindEvents() {
    this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen())
    document.addEventListener('fullscreenchange', () => this.onFullscreenChange())
  }

  private async toggleFullscreen() {
    if (!document.fullscreenElement) {
      await this.slider.container.requestFullscreen()
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      }
    }
  }

  private onFullscreenChange() {
    if (!document.fullscreenElement) {
      this.slider.container.classList.remove('fullscreen')
    } else {
      this.slider.container.classList.add('fullscreen')
    }
  }
}
