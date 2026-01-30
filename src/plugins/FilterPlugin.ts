import { ComparisonSlider } from '../core/ComparisonSlider'
import { EventEmitter } from '../core/EventEmitter'
import { UIConfig } from '../config'

export class FilterPlugin {
  private uiPanel!: HTMLElement
  private toggleButton!: HTMLButtonElement
  private filterButtons!: HTMLButtonElement[]
  private readonly slider: ComparisonSlider
  private readonly events: EventEmitter

  constructor(slider: ComparisonSlider, _config: UIConfig, events: EventEmitter) {
    this.slider = slider
    this.events = events
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
    const filterValue = targetButton.dataset.filter!
    const filterName = targetButton.textContent || ''
    
    this.slider.filterEngine.applyFilter(filterValue)
    this.setActiveButton(targetButton)
    this.events.emit('filterChange', { name: filterName, value: filterValue })
  }

  private setActiveButton(activeButton: HTMLButtonElement) {
    this.filterButtons.forEach(button => {
      button.classList.toggle('active', button === activeButton)
    })
  }

  private setInitialFilter() {
    if (this.filterButtons.length > 0) {
      const initialButton = this.filterButtons[0]
      const filterValue = initialButton.dataset.filter!
      const filterName = initialButton.textContent || ''

      this.setActiveButton(initialButton)
      this.slider.filterEngine.applyFilter(filterValue)
      this.events.emit('filterChange', { name: filterName, value: filterValue })
    }
  }
}
