import { ComparisonSlider } from '../core/ComparisonSlider'
import { EventEmitter } from '../core/EventEmitter'
import { UIConfig } from '../config'

export class FilterPlugin {
  private uiPanel!: HTMLElement
  private toggleButton!: HTMLButtonElement
  private filterButtons!: HTMLButtonElement[]
  private readonly slider: ComparisonSlider

  constructor(slider: ComparisonSlider, _config: UIConfig, _events: EventEmitter) {
    this.slider = slider
  }

  public initialize() {
    this.uiPanel = this.slider.container.querySelector('#filterPanel')!
    this.toggleButton = this.slider.container.querySelector('#toggleButton')!
    this.filterButtons = Array.from(this.uiPanel.querySelectorAll('.filter-buttons button'))

    this.bindEvents()
    this.setInitialFilter()
  }

  private bindEvents() {
    this.toggleButton.addEventListener('click', () => this.toggleUiPanel())
    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.onFilterClick(e))
    })
  }

  private toggleUiPanel() {
    this.uiPanel.classList.toggle('open')
  }

  private onFilterClick(event: MouseEvent) {
    const targetButton = event.currentTarget as HTMLButtonElement
    const filter = targetButton.dataset.filter!
    this.slider.filterEngine.applyFilter(filter)
    this.setActiveButton(targetButton)
  }

  private setActiveButton(activeButton: HTMLButtonElement) {
    this.filterButtons.forEach(button => {
      button.classList.toggle('active', button === activeButton)
    })
  }

  private setInitialFilter() {
    if (this.filterButtons.length > 0) {
      this.setActiveButton(this.filterButtons[0])
      this.slider.filterEngine.applyFilter(this.filterButtons[0].dataset.filter!)
    }
  }
}
