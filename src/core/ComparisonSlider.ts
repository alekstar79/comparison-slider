import { SliderHtmlBuilder } from './SliderHtmlBuilder'
import { DragController } from './DragController'
import { FilterEngine } from './FilterEngine'
import { UIConfig } from '../config'

export interface Plugin {
  initialize(): void;
}

export class ComparisonSlider
{
  public readonly originalImage: HTMLImageElement
  public readonly container: HTMLElement
  public filterEngine!: FilterEngine
  private readonly plugins: Plugin[] = []
  private readonly config: UIConfig

  private dragController!: DragController
  private resizeObserver!: ResizeObserver

  constructor(img: HTMLImageElement, config: UIConfig)
  {
    this.originalImage = img
    this.config = config
    this.container = SliderHtmlBuilder.enhanceImage(img, this.config)
    this.init().catch(console.error)
  }

  public addPlugin(plugin: Plugin) {
    this.plugins.push(plugin)
  }

  private async init()
  {
    await this.ensureImageLoaded()

    const covered = this.container.querySelector('.covered')! as HTMLElement
    const originalCanvas = covered.querySelector('.original-canvas')! as HTMLCanvasElement
    const filteredCanvas = covered.querySelector('.filtered-canvas')! as HTMLCanvasElement
    const handleLine = covered.querySelector('.handle-line')! as HTMLElement
    const handleGrip = this.container.querySelector('.handle-grip')! as HTMLElement
    
    const direction = covered.dataset.direction as 'horizontal' | 'vertical'

    this.filterEngine = new FilterEngine(originalCanvas, filteredCanvas, this.originalImage)
    
    this.dragController = new DragController(covered, handleGrip, handleLine, filteredCanvas, direction)
    this.resetPosition()

    this.plugins.forEach(plugin => plugin.initialize())

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
    
    const newX = (initX / this.originalImage.naturalWidth) * covered.clientWidth
    const newY = (initY / this.originalImage.naturalHeight) * covered.clientHeight

    this.dragController.setPosition(newX, newY)
  }
}
