export class DragController {
  private readonly container: HTMLElement
  private readonly covered: HTMLElement
  private readonly handleGrip: HTMLElement
  private readonly handleLine: HTMLElement
  private readonly direction: 'horizontal' | 'vertical'
  private readonly filteredCanvas: HTMLCanvasElement

  private isDragging = false
  private animationFrameId: number | null = null

  private posX = 200
  private posY = 100

  constructor(container: HTMLElement, direction: 'horizontal' | 'vertical') {
    this.container = container
    this.covered = container.querySelector('.covered')!
    this.filteredCanvas = this.covered.querySelector('.filtered-canvas')!
    this.handleGrip = container.querySelector('.handle-grip')!
    this.handleLine = this.covered.querySelector('.handle-line')!
    this.direction = direction

    this.container.classList.add(this.direction)
    this.handleGrip.classList.add(this.direction)
    this.handleLine.classList.add(this.direction)

    this.bindEvents()
  }

  setPosition(x: number, y: number) {
    const { clientWidth, clientHeight } = this.covered
    this.posX = Math.max(0, Math.min(clientWidth, x))
    this.posY = Math.max(0, Math.min(clientHeight, y))

    // Update grip immediately for responsiveness
    this.handleGrip.style.transform = `translate(${this.posX}px, ${this.posY}px)`

    this.scheduleUpdate()
  }

  private getClientPos(e: MouseEvent | TouchEvent) {
    const rect = this.covered.getBoundingClientRect()
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

    // We only drag the grip, not the line
    this.handleGrip.addEventListener('mousedown', onStart)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)
    this.handleGrip.addEventListener('touchstart', onStart, { passive: false })
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
  }

  private scheduleUpdate() {
    if (this.animationFrameId) {
      // No need to cancel, just let the last scheduled update run
      return
    }
    this.animationFrameId = requestAnimationFrame(() => this.updateClip())
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
