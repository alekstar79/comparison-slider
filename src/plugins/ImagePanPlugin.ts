import { ComparisonSlider, Plugin } from '../core/ComparisonSlider'
import { UIConfig } from '../config'

export class ImagePanPlugin implements Plugin {
  private slider: ComparisonSlider
  private config: UIConfig

  private startPanPosition = { x: 0, y: 0 }
  private startPanOffset = { x: 0, y: 0 }

  private isPannable = false
  private isPanning = false

  constructor(slider: ComparisonSlider, config: UIConfig) {
    this.slider = slider
    this.config = config
  }

  public initialize(): void {
    this.checkPannable()
    this.attachEventListeners()
  }

  public onImageUpdate(): void {
    this.checkPannable()
  }

  public onResize(): void {
    this.checkPannable()
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
    if (!this.isPanning) return

    const target = e.target as HTMLElement
    target.releasePointerCapture(e.pointerId)

    this.isPanning = false
    this.slider.container.style.cursor = this.isPannable
      ? 'grab'
      : ''
  }
}
