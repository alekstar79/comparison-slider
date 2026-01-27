import { SliderHtmlBuilder } from './SliderHtmlBuilder'
import { DragController } from './DragController'
import { FilterEngine } from './FilterEngine'
import { UiController } from './UIController'

export class ComparisonSlider
{
  private readonly originalImage: HTMLImageElement

  private container: HTMLElement
  private dragController!: DragController
  private filterEngine!: FilterEngine

  constructor(img: HTMLImageElement)
  {
    this.originalImage = img
    this.container = SliderHtmlBuilder.enhanceImage(img)
    this.init().catch(console.error)
  }

  private async init()
  {
    await this.waitForImageLoad()

    const covered = this.container.querySelector('.covered')! as HTMLElement
    const originalCanvas = this.container.querySelector('.original-canvas') as HTMLCanvasElement
    const filteredCanvas = this.container.querySelector('.filtered-canvas') as HTMLCanvasElement
    const filterButtons = [...this.container.querySelectorAll('.filter-buttons button')] as HTMLButtonElement[]

    const direction = covered.dataset.direction as 'horizontal' | 'vertical'
    const initX = parseInt(covered.dataset.initX || '25')
    const initY = parseInt(covered.dataset.initY || '25')

    originalCanvas.style.display = 'block'
    filteredCanvas.style.display = 'block'

    const firstFilterBtn = filterButtons[0] as HTMLElement
    const initialFilter = firstFilterBtn.dataset.filter || 'grayscale(100%)'

    this.filterEngine = new FilterEngine(originalCanvas, filteredCanvas, this.originalImage)
    this.filterEngine.applyFilter(initialFilter)

    this.dragController = new DragController(covered, direction)
    this.dragController.setPosition(initX, initY)

    new UiController(filterButtons, this.filterEngine)
  }

  private waitForImageLoad(): Promise<void> {
    return new Promise((resolve) => {
      const resolveLoad = this.loadedResolver(resolve)

      resolveLoad()
      if (!this.originalImage.complete || this.originalImage.naturalWidth === 0) {
        this.originalImage.addEventListener('load', resolveLoad, { once: true })
      }
    })
  }

  private loadedResolver(callback: () => void) {
    return () => {
      const { complete, naturalWidth } = this.originalImage

      if (complete && naturalWidth > 0) {
        callback()
      }
    }
  }
}
