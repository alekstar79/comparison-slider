export class DragController {
  private readonly filteredCanvas: HTMLCanvasElement
  private readonly direction: 'horizontal' | 'vertical'
  private readonly boundary: HTMLElement
  private readonly handleGrip: HTMLElement
  private readonly handleLine: HTMLElement

  private animationFrameId: number | null = null
  private isDragging = false

  public posX = 200
  public posY = 100

  constructor(
    boundary: HTMLElement,
    handleGrip: HTMLElement,
    handleLine: HTMLElement,
    filteredCanvas: HTMLCanvasElement,
    direction: 'horizontal' | 'vertical'
  ) {
    this.boundary = boundary
    this.handleGrip = handleGrip
    this.handleLine = handleLine
    this.filteredCanvas = filteredCanvas
    this.direction = direction

    // Add direction classes to make the line and grip visible and oriented correctly
    this.handleLine.classList.add(direction)
    this.handleGrip.classList.add(direction)

    this.bindEvents()
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.posX, y: this.posY };
  }

  public setPosition(x: number, y: number) {
    const { clientWidth, clientHeight } = this.boundary
    this.posX = Math.max(0, Math.min(clientWidth, x))
    this.posY = Math.max(0, Math.min(clientHeight, y))

    this.handleGrip.style.transform = `translate(${this.posX}px, ${this.posY}px)`
    this.scheduleUpdate()
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
      e.preventDefault()
      this.isDragging = true
      this.handleGrip.classList.add('draggable')
    }

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!this.isDragging) return
      e.preventDefault()
      const { x, y } = this.getClientPos(e)
      this.setPosition(x, y)
    }

    const onEnd = () => {
      this.isDragging = false
      this.handleGrip.classList.remove('draggable')
    }

    this.handleGrip.addEventListener('mousedown', onStart)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)

    this.handleGrip.addEventListener('touchstart', onStart, { passive: false })
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
  }

  private scheduleUpdate() {
    if (this.animationFrameId) return

    this.animationFrameId = requestAnimationFrame(() => {
      this.updateClip()
    })
  }

  private updateClip() {
    this.animationFrameId = null

    if (this.direction === 'horizontal') {
      this.filteredCanvas.style.clipPath = `inset(0 calc(100% - ${this.posX}px) 0 0)`
      this.handleLine.style.transform = `translateX(${this.posX}px)`
    } else {
      this.filteredCanvas.style.clipPath = `inset(0 0 calc(100% - ${this.posY}px) 0)`
      this.handleLine.style.transform = `translateY(${this.posY}px)`
    }
  }
}
