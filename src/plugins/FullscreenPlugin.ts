import { ComparisonSlider } from '../core/ComparisonSlider'
import { EventEmitter } from '../core/EventEmitter'
import { UIConfig } from '../config'

export class FullscreenPlugin {
  private readonly slider: ComparisonSlider
  private button!: HTMLElement

  constructor(slider: ComparisonSlider, _config: UIConfig, _events: EventEmitter) {
    this.slider = slider
  }

  public initialize() {
    this.button = this.slider.container.querySelector('#fullscreenButton')!
    if (!this.button) return

    this.button.addEventListener('click', () => this.toggleFullscreen())
    document.addEventListener('fullscreenchange', () => this.onFullscreenChange())
  }

  private async toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.slider.container.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`)
      })
    } else {
      await document.exitFullscreen()
    }
  }

  private onFullscreenChange() {
    const isFullscreen = !!document.fullscreenElement
    this.slider.container.classList.toggle('fullscreen', isFullscreen)
  }
}
