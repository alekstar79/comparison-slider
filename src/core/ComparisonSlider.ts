import type { UIConfig, Plugin } from '../config'

import { SliderHtmlBuilder } from './SliderHtmlBuilder'
import { DragController } from './DragController'
import { FilterEngine } from './FilterEngine'
import { EventEmitter } from './EventEmitter'

function isObject(item: any): item is Record<string, any> {
  return (item && typeof item === 'object' && !Array.isArray(item))
}

/**
 * A robust parser for data-attribute "objects".
 * This function is safer than using regex to convert to JSON.
 * It creates a temporary function to evaluate the object-like string.
 */
function parseDataAttribute(value: string): object | null {
  try {
    // By wrapping the value in `return` and creating a new Function,
    // we can safely evaluate the object-like string into a real object.
    const parser = new Function(`return ${value}`)
    const result = parser()

    return isObject(result) ? result : null
  } catch (e) {
    return null
  }
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
  public isComparisonView = true

  constructor(img: HTMLImageElement, config: UIConfig) {
    this.originalImage = img
    this.config = this.buildConfig(config)
    this.isComparisonView = this.config.comparison
  }

  private buildConfig(baseConfig: UIConfig): UIConfig {
    const newConfig = JSON.parse(JSON.stringify(baseConfig))
    const data = this.originalImage.dataset

    // Merge simple data-attributes
    if (data.comparison) {
      newConfig.comparison = data.comparison === 'true'
    }
    if (data.hoverToSlide) {
      newConfig.hoverToSlide = data.hoverToSlide === 'true'
    }
    if (data.labelsBefore) {
      newConfig.labels.before = data.labelsBefore
    }
    if (data.labelsAfter) {
      newConfig.labels.after = data.labelsAfter
    }
    if (data.labelsPosition) {
      newConfig.labels.position = data.labelsPosition as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    }

    // Merge uiBlocks data-attributes
    newConfig.uiBlocks.forEach((block: any) => {
      const blockIdCamelCase = block.id.replace(/-(\w)/g, (_: any, c: string) => {
        return c.toUpperCase()
      })

      // Handle complex object attributes (like 'position')
      const positionAttributeValue = data[blockIdCamelCase]
      if (positionAttributeValue) {
        const parsedConfig = parseDataAttribute(positionAttributeValue)
        if (isObject(parsedConfig)) {
          block.position = parsedConfig
        }
      }

      // Handle simple property attributes (like 'direction')
      const directionAttributeValue = data[`${blockIdCamelCase}Direction`]
      if (directionAttributeValue) {
        block.direction = directionAttributeValue
      }
    })

    return newConfig
  }

  public use(plugin: Plugin) {
    this.plugins.push(plugin)
  }

  public async mount() {
    const imgSetAttr = this.originalImage.dataset.imgset

    if (imgSetAttr && imgSetAttr.length > 0) {
      const images = imgSetAttr.split(',').map(s => s.trim())
      if (images.length > 0 && images[0]) {
        this.originalImage.src = images[0]
      }
    }

    await this.ensureImageLoaded()

    this.container = SliderHtmlBuilder.enhanceImage(this.originalImage, this)

    const covered = this.container.querySelector('.covered')! as HTMLElement
    const originalCanvas = covered.querySelector('.original-canvas')! as HTMLCanvasElement
    const filteredCanvas = covered.querySelector('.filtered-canvas')! as HTMLCanvasElement
    const handleLine = covered.querySelector('.handle-line')! as HTMLElement
    const handleGrip = this.container.querySelector('.handle-grip')! as HTMLElement
    const direction = covered.dataset.direction as 'horizontal' | 'vertical'

    this.container.classList.add(direction)
    if (!this.isComparisonView) {
      this.container.classList.add('mode-single-view')
    }

    this.filterEngine = new FilterEngine(originalCanvas, filteredCanvas, this.originalImage)
    if (this.config.comparison) {
      this.dragController = new DragController(covered, handleGrip, handleLine, filteredCanvas, direction, this.config, this.events)

      this.setInitialHandlePosition()

      const comparisonButton = this.container.querySelector('#comparisonButton')
      if (comparisonButton) {
        comparisonButton.addEventListener('click', () => this.toggleComparisonView())
      }
    } else {
      const comparisonButton = this.container.querySelector('#comparisonButton') as HTMLElement
      if (comparisonButton) {
        comparisonButton.style.display = 'none'
      }
    }

    this.plugins.forEach(plugin => plugin.initialize())
    this.setupResizeObserver()
  }

  public async updateImage(newImage: HTMLImageElement | string, reset = true) {
    if (typeof newImage === 'string') {
      this.originalImage.src = newImage
      await this.ensureImageLoaded()
    } else {
      this.originalImage = newImage
    }

    this.filterEngine.updateImage(this.originalImage)
    if (reset && this.isComparisonView && this.dragController) {
      this.setInitialHandlePosition()
    }

    this.events.emit('imageUpdate', { image: this.originalImage })
  }

  public toggleComparisonView() {
    this.isComparisonView = !this.isComparisonView
    this.container.classList.toggle('mode-single-view', !this.isComparisonView)
    this.dragController.setDisabled(!this.isComparisonView)

    if (this.isComparisonView) {
      this.updateHandlePosition()
    }

    this.events.emit('comparisonViewChange', { isComparisonView: this.isComparisonView })
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
    this.resizeObserver = new ResizeObserver((entries) => {
      if (!entries || !entries.length) return

      const { width, height } = entries[0].contentRect

      this.filterEngine.redraw(width, height)

      if (this.isComparisonView && this.dragController) {
        this.updateHandlePosition()
      }

      this.events.emit('resize')
    })

    this.resizeObserver.observe(this.container)
  }

  private updateHandlePosition() {
    if (this.dragController) {
      this.dragController.redraw()
    }
  }

  private setInitialHandlePosition() {
    const covered = this.container.querySelector('.covered')! as HTMLElement
    const initX = parseInt(covered.dataset.initX || '250', 10)
    const initY = parseInt(covered.dataset.initY || '300', 10)
    const normX = initX / this.originalImage.naturalWidth
    const normY = initY / this.originalImage.naturalHeight

    this.dragController.setNormalizedPosition(normX, normY)
  }
}
