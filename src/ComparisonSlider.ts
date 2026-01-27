import { SliderHtmlBuilder } from './SliderHtmlBuilder'
import { DragController } from './DragController'
import { FilterEngine } from './FilterEngine'
import { UiController } from './UIController'

export class ComparisonSlider
{
  private readonly originalImage: HTMLImageElement
  private readonly container: HTMLElement

  private dragController!: DragController
  private filterEngine!: FilterEngine
  private resizeObserver!: ResizeObserver

  constructor(img: HTMLImageElement)
  {
    this.originalImage = img
    this.container = SliderHtmlBuilder.enhanceImage(img)
    this.init().catch(console.error)
  }

  private async init()
  {
    await this.ensureImageLoaded()

    const covered = this.container.querySelector('.covered')! as HTMLElement
    const originalCanvas = this.container.querySelector('.original-canvas') as HTMLCanvasElement
    const filteredCanvas = this.container.querySelector('.filtered-canvas') as HTMLCanvasElement
    const filterButtons = [...this.container.querySelectorAll('.filter-buttons button')] as HTMLButtonElement[]

    const direction = covered.dataset.direction as 'horizontal' | 'vertical'

    const firstFilterBtn = filterButtons[0] as HTMLElement
    const initialFilter = firstFilterBtn.dataset.filter || 'grayscale(100%)'

    this.filterEngine = new FilterEngine(originalCanvas, filteredCanvas, this.originalImage)
    this.filterEngine.applyFilter(initialFilter)

    this.dragController = new DragController(this.container, direction)
    this.resetPosition()

    new UiController(filterButtons, this.filterEngine)

    this.setupResizeObserver()
  }

  private ensureImageLoaded(): Promise<void> {
    if (this.originalImage.complete && this.originalImage.naturalWidth > 0) {
      return Promise.resolve()
    }
    return new Promise(resolve => {
      this.originalImage.addEventListener('load', () => resolve(), { once: true })
    })
  }

  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      this.filterEngine.redraw()
      this.resetPosition()
    })
    this.resizeObserver.observe(this.container)
  }

  private resetPosition() {
    const covered = this.container.querySelector('.covered')! as HTMLElement
    const initX = parseInt(covered.dataset.initX || '0', 10)
    const initY = parseInt(covered.dataset.initY || '0', 10)
    
    // Calculate position based on the current size of the container
    const newX = (initX / this.originalImage.naturalWidth) * covered.clientWidth
    const newY = (initY / this.originalImage.naturalHeight) * covered.clientHeight
    
    this.dragController.setPosition(newX, newY)
  }
}
