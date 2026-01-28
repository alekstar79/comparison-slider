import { ComparisonSlider } from '../core/ComparisonSlider'
import { SliderHtmlBuilder } from '../core/SliderHtmlBuilder'

export class FilterPlugin {
  private readonly slider: ComparisonSlider
  private uiPanel!: HTMLElement
  private toggleButton!: HTMLButtonElement
  private filterButtons!: HTMLButtonElement[]

  constructor(slider: ComparisonSlider) {
    this.slider = slider
  }

  public initialize() {
    this.createUI()
    this.bindEvents()
    this.setInitialFilter()
  }

  private createUI() {
    const filterNamesStr = this.slider.originalImage.dataset.filters || 'Grayscale,Blur,Invert,Bright'
    const filterNames = filterNamesStr.split(',').map(name => name.trim())

    let filtersToRender = SliderHtmlBuilder.ALL_FILTERS
    if (!filterNames.includes('all') && !filterNames.includes('*')) {
      filtersToRender = SliderHtmlBuilder.ALL_FILTERS.filter(filterDef =>
        filterNames.some(name => name.trim() === filterDef.name)
      )
    }

    const filtersHtml = filtersToRender.map(filterDef =>
      `<button data-filter="${filterDef.value}">${filterDef.name}</button>`
    ).join('')

    this.uiPanel = document.createElement('div')
    this.uiPanel.className = 'ui-panel'
    this.uiPanel.innerHTML = `<div class="filter-buttons">${filtersHtml}</div>`

    this.toggleButton = document.createElement('button')
    this.toggleButton.className = 'ui-toggle-button'
    this.toggleButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`

    const covered = this.slider.container.querySelector('.covered')!
    covered.appendChild(this.uiPanel)
    covered.appendChild(this.toggleButton)

    this.filterButtons = Array.from(this.uiPanel.querySelectorAll('.filter-buttons button'))
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
