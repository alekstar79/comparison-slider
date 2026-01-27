import { FilterEngine } from './FilterEngine'

export class UiController {
  private readonly container: HTMLElement
  private readonly filterButtons: HTMLButtonElement[]
  private readonly filterEngine: FilterEngine
  private readonly uiPanel: HTMLElement
  private readonly toggleButton: HTMLButtonElement

  constructor(container: HTMLElement, filterEngine: FilterEngine) {
    this.container = container
    this.filterEngine = filterEngine
    
    this.uiPanel = this.container.querySelector('.ui-panel')!
    this.toggleButton = this.container.querySelector('.ui-toggle-button')!
    this.filterButtons = Array.from(this.uiPanel.querySelectorAll('.filter-buttons button'))

    this.init()
  }

  private init() {
    this.toggleButton.addEventListener('click', () => this.toggleUiPanel())

    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.onFilterClick(e))
    })

    if (this.filterButtons.length > 0) {
      this.setActiveButton(this.filterButtons[0])
    }
  }

  private toggleUiPanel() {
    this.uiPanel.classList.toggle('open')
  }

  private onFilterClick(event: MouseEvent) {
    const targetButton = event.currentTarget as HTMLButtonElement
    const filter = targetButton.dataset.filter!

    this.filterEngine.applyFilter(filter)
    this.setActiveButton(targetButton)
  }

  private setActiveButton(activeButton: HTMLButtonElement) {
    this.filterButtons.forEach(button => {
      button.classList.toggle('active', button === activeButton)
    })
  }
}
