import { EventEmitter } from './EventEmitter'
import { UIConfig } from '../config'

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

  public posX = 200
  public posY = 100

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

    // Add direction classes to make the line and grip visible and oriented correctly
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
      this.updateClip()
    }
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.posX, y: this.posY };
  }

  public setPosition(x: number, y: number) {
    if (this.isDisabled) return

    const { clientWidth, clientHeight } = this.boundary
    this.posX = Math.max(0, Math.min(clientWidth, x))
    this.posY = Math.max(0, Math.min(clientHeight, y))

    this.handleGrip.style.transform = `translate(${this.posX}px, ${this.posY}px)`
    this.scheduleUpdate()
    this.events.emit('positionChange', { x: this.posX, y: this.posY })
  }

  private getClientPos(e: MouseEvent | TouchEvent) {
    const rect = this.boundary.getBoundingClientRect()
    const touch = 'touches' in e ? e.touches[0] : e

    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    }
  }

  private bindEvents() {
    const onStart = (e: MouseEvent | TouchEvent) => {
      if (this.isDisabled) return
      e.preventDefault()

      this.isDragging = true
      this.handleGrip.classList.add('draggable')
    }

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!this.isDragging || this.isDisabled) return
      e.preventDefault()

      const { x, y } = this.getClientPos(e)
      this.setPosition(x, y)
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
        this.setPosition(x, y)
      })
    }
  }

  private scheduleUpdate() {
    if (this.animationFrameId) return

    this.animationFrameId = requestAnimationFrame(() => {
      this.updateClip()
    })
  }

  private updateClip() {
    this.animationFrameId = null
    if (this.isDisabled) return

    if (this.direction === 'horizontal') {
      this.filteredCanvas.style.clipPath = `inset(0 calc(100% - ${this.posX}px) 0 0)`
      this.handleLine.style.transform = `translateX(${this.posX}px)`
    } else {
      this.filteredCanvas.style.clipPath = `inset(0 0 calc(100% - ${this.posY}px) 0)`
      this.handleLine.style.transform = `translateY(${this.posY}px)`
    }
  }
}
