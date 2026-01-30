import type { UIConfig, Plugin } from '../config'

import { ComparisonSlider } from '../core/ComparisonSlider'
import { EventEmitter } from '../core/EventEmitter'

export class FilterPlugin implements Plugin{
  private uiPanel!: HTMLElement
  private toggleButton!: HTMLButtonElement
  private filterButtons!: HTMLButtonElement[]
  private readonly slider: ComparisonSlider
  private readonly events: EventEmitter
  private originalFilterButton: HTMLButtonElement | null = null
  private lastActiveFilterButton: HTMLButtonElement | null = null

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
    this.events.on('comparisonViewChange', ({ isComparisonView }) => this.onComparisonViewChange(isComparisonView))
  }

  private onComparisonViewChange(isComparisonView: boolean) {
    if (!isComparisonView) {
      // Switched to single view
      this.lastActiveFilterButton = this.filterButtons.find(btn => btn.classList.contains('active')) || null

      if (!this.originalFilterButton) {
        const button = document.createElement('button')
        button.dataset.filter = 'none'
        button.textContent = 'Original'
        button.addEventListener('click', (e) => this.onFilterClick(e))

        this.uiPanel.querySelector('.filter-buttons')?.prepend(button)
        this.originalFilterButton = button
        this.filterButtons.unshift(button)
      }
      this.onFilterClick({ currentTarget: this.originalFilterButton } as unknown as MouseEvent)
    } else {
      // Switched to comparison view
      if (this.originalFilterButton) {
        this.originalFilterButton.remove()
        this.filterButtons.shift()
        this.originalFilterButton = null

        if (this.lastActiveFilterButton) {
          this.onFilterClick({ currentTarget: this.lastActiveFilterButton } as unknown as MouseEvent)
        } else {
          this.setInitialFilter()
        }
      }
    }
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
