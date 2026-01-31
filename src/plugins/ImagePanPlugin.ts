import type { UIConfig, Plugin } from '../config'

import { ComparisonSlider } from '../core/ComparisonSlider'
import { EventEmitter } from '../core/EventEmitter'

export class ImagePanPlugin implements Plugin {
  private slider: ComparisonSlider
  private events: EventEmitter
  private config: UIConfig

  private startPanPosition = { x: 0, y: 0 }
  private startPanOffset = { x: 0, y: 0 }
  private panTarget: HTMLElement | null = null; // Store the element that is being panned

  private isPannable = false
  private isPanning = false

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
    this.checkPannable()
    this.attachEventListeners()
    this.events.on('imageUpdate', this.checkPannable.bind(this))
    this.events.on('resize', this.checkPannable.bind(this))
  }

  private checkPannable(): void {
    const { naturalWidth, naturalHeight } = this.slider.originalImage
    const { clientWidth, clientHeight } = this.slider.container
    const imageRatio = naturalWidth / naturalHeight
    const containerRatio = clientWidth / clientHeight
    const ratioDifference = Math.abs(imageRatio - containerRatio)

    this.isPannable = ratioDifference > (this.config.pan?.allowedRatioDeviation || 0.1)
    this.slider.container.style.cursor = this.isPannable ? 'grab' : ''
  }

  private attachEventListeners(): void {
    this.slider.container.addEventListener('pointerdown', (e) => this.onPointerDown(e))
    document.addEventListener('pointermove', (e) => this.onPointerMove(e))
    document.addEventListener('pointerup', (e) => this.onPointerUp(e))
  }

  private onPointerDown(e: PointerEvent): void {
    const target = e.target as HTMLElement
    const isCanvas = target === this.slider.filterEngine.originalCanvas || target === this.slider.filterEngine.filteredCanvas

    if (!this.isPannable || !isCanvas) return

    e.preventDefault()
    target.setPointerCapture(e.pointerId)

    this.panTarget = target
    this.isPanning = true
    this.startPanPosition = { x: e.clientX, y: e.clientY }
    this.startPanOffset = { ...this.slider.filterEngine.panOffset }
    this.slider.container.style.cursor = 'grabbing'
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isPanning) return

    e.preventDefault()

    const dx = e.clientX - this.startPanPosition.x
    const dy = e.clientY - this.startPanPosition.y

    const { naturalWidth, naturalHeight } = this.slider.originalImage
    const { clientWidth, clientHeight } = this.slider.container

    const imageRatio = naturalWidth / naturalHeight
    const containerRatio = clientWidth / clientHeight
    const scale = imageRatio > containerRatio
      ? clientHeight / naturalHeight
      : clientWidth / naturalWidth

    const newOffsetX = this.startPanOffset.x - (dx / scale)
    const newOffsetY = this.startPanOffset.y - (dy / scale)

    this.slider.filterEngine.setPanOffset(newOffsetX, newOffsetY)
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.isPanning || !this.panTarget) return

    // Use the stored target to release the pointer capture
    this.panTarget.releasePointerCapture(e.pointerId)
    this.panTarget = null
    this.isPanning = false
    this.slider.container.style.cursor = this.isPannable
      ? 'grab'
      : ''
  }
}
