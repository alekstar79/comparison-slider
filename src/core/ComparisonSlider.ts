import { SliderHtmlBuilder } from './SliderHtmlBuilder'
import { DragController } from './DragController'
import { FilterEngine } from './FilterEngine'
import { EventEmitter } from './EventEmitter'
import { UIConfig } from '../config'

export interface Plugin {
  initialize(): void;
  destroy?: () => void;
}

export class ComparisonSlider {
  public readonly events = new EventEmitter()
  public originalImage: HTMLImageElement
  public container!: HTMLElement

  public filterEngine!: FilterEngine
  public dragController!: DragController
  public resizeObserver!: ResizeObserver

  public readonly plugins: Plugin[] = []
  public readonly config: UIConfig

  constructor(img: HTMLImageElement, config: UIConfig)
  {
    this.originalImage = img
    this.config = config
    this.init().catch(console.error)
  }

  public addPlugin(plugin: Plugin) {
    this.plugins.push(plugin)
  }

  public async updateImage(newImage: HTMLImageElement | string, reset = true) {
    if (typeof newImage === 'string') {
      this.originalImage.src = newImage
      await this.ensureImageLoaded()
    } else {
      this.originalImage = newImage
    }

    this.filterEngine.updateImage(this.originalImage)
    if (reset) {
      this.resetPosition()
    }

    this.events.emit('imageUpdate', { image: this.originalImage })
  }

  private async init()
  {
    const imgSetAttr = this.originalImage.dataset.imgset

    if (imgSetAttr && imgSetAttr.length > 0) {
      const images = imgSetAttr.split(',').map(s => s.trim())
      if (images.length > 0 && images[0]) {
        this.originalImage.src = images[0]
      }
    }

    await this.ensureImageLoaded()

    this.container = SliderHtmlBuilder.enhanceImage(this.originalImage, this.config)

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
      this.originalImage.addEventListener('load', () => resolve(), {
        once: true
      })
    })
  }

  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      this.filterEngine.redraw()
      this.resetPosition()
      this.events.emit('resize')
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
