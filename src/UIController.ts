import { FilterEngine } from './FilterEngine'

export class UiController {
  constructor(
    private readonly filterButtons: HTMLButtonElement[],
    private readonly filterEngine: FilterEngine
  ) {
    this.init()
  }

  private init() {
    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', this.onFilterClick.bind(this))
    })

    if (this.filterButtons.length > 0) {
      this.setActiveButton(this.filterButtons[0])
    }
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
