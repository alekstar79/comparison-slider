import { EventEmitter } from './EventEmitter'
import type { UIConfig } from '../config'

export class DragController {
  private readonly events: EventEmitter
  private readonly config: UIConfig

  private readonly direction: 'horizontal' | 'vertical'
  private readonly filteredCanvas: HTMLCanvasElement
  private readonly boundary: HTMLElement
  private readonly handleGrip: HTMLElement
  private readonly handleLine: HTMLElement

  private animationFrameId: number | null = null
  private isDragging = false
  private isDisabled = false

  // Normalized coordinates (0.0 to 1.0) are the single source of truth
  private normalizedX = 0.5
  private normalizedY = 0.5

  constructor(
    boundary: HTMLElement,
    handleGrip: HTMLElement,
    handleLine: HTMLElement,
    filteredCanvas: HTMLCanvasElement,
    direction: 'horizontal' | 'vertical',
    config: UIConfig,
    events: EventEmitter
  ) {
    this.boundary = boundary
    this.handleGrip = handleGrip
    this.handleLine = handleLine
    this.filteredCanvas = filteredCanvas
    this.direction = direction
    this.config = config
    this.events = events

    this.handleLine.classList.add(direction)
    this.handleGrip.classList.add(direction)

    this.bindEvents()
  }

  public setDisabled(disabled: boolean) {
    this.isDisabled = disabled
    this.handleGrip.style.display = disabled ? 'none' : ''
    this.handleLine.style.display = disabled ? 'none' : ''

    if (disabled) {
      this.filteredCanvas.style.clipPath = 'none'
    } else {
      this.redraw()
    }
  }

  public getPosition(): { x: number; y: number } {
    const { clientWidth, clientHeight } = this.boundary
    return {
      x: this.normalizedX * clientWidth,
      y: this.normalizedY * clientHeight
    }
  }

  public setNormalizedPosition(normX: number, normY: number) {
    this.normalizedX = Math.max(0, Math.min(1, normX))
    this.normalizedY = Math.max(0, Math.min(1, normY))
    this.redraw()
  }

  public updatePositionFromPixels(pixelX: number, pixelY: number) {
    if (this.isDisabled) return

    const { clientWidth, clientHeight } = this.boundary
    if (clientWidth > 0) {
      this.normalizedX = Math.max(0, Math.min(1, pixelX / clientWidth))
    }
    if (clientHeight > 0) {
      this.normalizedY = Math.max(0, Math.min(1, pixelY / clientHeight))
    }

    this.redraw()
  }

  public redraw() {
    if (this.animationFrameId) return

    this.animationFrameId = requestAnimationFrame(() => {
      this.updateClipAndHandle()
      this.animationFrameId = null
    })
  }

  private getClientPos(e: MouseEvent | TouchEvent) {
    const rect = this.boundary.getBoundingClientRect()
    const touch = 'touches' in e ? e.touches[0] : e

    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  }

  private bindEvents() {
    const onStart = (e: MouseEvent | TouchEvent) => {
      if (this.isDisabled || 'button' in e && e.button !== 0 || 'touches' in e && e.touches.length > 1) return

      e.preventDefault()

      this.isDragging = true
      this.handleGrip.classList.add('draggable')
    }

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!this.isDragging || this.isDisabled) return
      e.preventDefault()

      const { x, y } = this.getClientPos(e)
      this.updatePositionFromPixels(x, y)
    }

    const onEnd = () => {
      if (this.isDisabled) return
      this.isDragging = false
      this.handleGrip.classList.remove('draggable')
    }

    this.handleGrip.addEventListener('mousedown', onStart)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)

    this.handleGrip.addEventListener('touchstart', onStart, { passive: false })
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)

    if (this.config.hoverToSlide) {
      this.boundary.addEventListener('mousemove', (e) => {
        if (this.isDragging || this.isDisabled) return

        const { x, y } = this.getClientPos(e)
        this.updatePositionFromPixels(x, y)
      })
    }
  }

  private updateClipAndHandle() {
    if (this.isDisabled) return

    const { clientWidth, clientHeight } = this.boundary
    const pixelX = this.normalizedX * clientWidth
    const pixelY = this.normalizedY * clientHeight

    this.handleGrip.style.transform = `translate(${pixelX}px, ${pixelY}px)`

    if (this.direction === 'horizontal') {
      this.filteredCanvas.style.clipPath = `inset(0 calc(100% - ${pixelX}px) 0 0)`
      this.handleLine.style.transform = `translateX(${pixelX}px)`
    } else {
      this.filteredCanvas.style.clipPath = `inset(0 0 calc(100% - ${pixelY}px) 0)`
      this.handleLine.style.transform = `translateY(${pixelY}px)`
    }

    this.events.emit('positionChange', { x: pixelX, y: pixelY })
  }
}
