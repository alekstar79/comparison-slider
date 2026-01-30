import { ComparisonSlider, Plugin } from '../core/ComparisonSlider'
import { EventEmitter } from '../core/EventEmitter'
import { UIConfig } from '../config'

export class LabelPlugin implements Plugin {
  private slider: ComparisonSlider
  private events: EventEmitter
  private config: UIConfig

  private beforeLabel!: HTMLElement
  private afterLabel!: HTMLElement

  private currentFilterName = ''

  constructor(
    slider: ComparisonSlider,
    config: UIConfig,
    events: EventEmitter
  ) {
    this.slider = slider
    this.config = config
    this.events = events
  }

  public initialize(): void {
    if (!this.config.labels) return

    this.afterLabel = this.slider.container.querySelector('.label-after')!
    this.beforeLabel = this.slider.container.querySelector('.label-before')!

    if (!this.afterLabel || !this.beforeLabel) return

    // In single view mode, just hide the 'before' label. CSS handles the rest.
    if (!this.config.comparison) {
      this.beforeLabel.style.display = 'none'
    }

    const initialActiveButton = this.slider.container.querySelector('.filter-buttons button.active')
    if (initialActiveButton) {
      this.currentFilterName = initialActiveButton.textContent || ''
    }

    this.updateLabelText()

    if (this.config.comparison) {
      this.updateLabelPositions(this.slider.dragController.getPosition())
      this.events.on('positionChange', (pos: { x: number, y: number }) => {
        this.updateLabelPositions(pos)
      })
    }

    this.events.on('filterChange', (filter: { name: string, value: string }) => {
      this.currentFilterName = filter.name
      this.updateLabelText()
    })

    this.events.on('resize', () => {
      if (this.config.comparison) {
        this.updateLabelPositions(this.slider.dragController.getPosition())
      }
    })
  }

  private updateLabelText(): void {
    const { before, after } = this.config.labels!

    if (!this.config.comparison) {
      this.afterLabel.textContent = this.currentFilterName
    } else {
      this.beforeLabel.textContent = before
      this.afterLabel.textContent = this.currentFilterName
        ? this.currentFilterName
        : after
    }
  }

  private updateLabelPositions({ x, y }: { x: number, y: number }): void {
    const direction = this.slider.container.classList.contains('horizontal') ? 'horizontal' : 'vertical'
    const containerRect = this.slider.container.getBoundingClientRect()

    // After Label (Filtered)
    const afterRect = this.afterLabel.getBoundingClientRect()
    if (direction === 'horizontal') {
      const clipX = x - (afterRect.left - containerRect.left)
      const clampedClipX = Math.max(0, Math.min(afterRect.width, clipX))
      this.afterLabel.style.clipPath = `inset(0 ${afterRect.width - clampedClipX}px 0 0)`
    } else {
      const clipY = y - (afterRect.top - containerRect.top)
      const clampedClipY = Math.max(0, Math.min(afterRect.height, clipY))
      this.afterLabel.style.clipPath = `inset(0 0 ${afterRect.height - clampedClipY}px 0)`
    }

    // Before Label (Original)
    const beforeRect = this.beforeLabel.getBoundingClientRect()
    if (direction === 'horizontal') {
      const clipX = x - (beforeRect.left - containerRect.left)
      const clampedClipX = Math.max(0, Math.min(beforeRect.width, clipX))
      this.beforeLabel.style.clipPath = `inset(0 0 0 ${clampedClipX}px)`
    } else {
      const clipY = y - (beforeRect.top - containerRect.top)
      const clampedClipY = Math.max(0, Math.min(beforeRect.height, clipY))
      this.beforeLabel.style.clipPath = `inset(${clampedClipY}px 0 0 0)`
    }
  }
}
