export class DragController {
  private readonly container: HTMLElement
  private readonly handle: HTMLElement
  private readonly direction: 'horizontal' | 'vertical'
  private readonly filteredCanvas: HTMLCanvasElement
  private readonly border: HTMLElement

  private isDragging = false
  private animationFrameId: number | null = null

  private posX = 200
  private posY = 100

  constructor(container: HTMLElement, direction: 'horizontal' | 'vertical') {
    this.container = container
    this.filteredCanvas = container.querySelector('.filtered-canvas')!
    this.handle = container.querySelector('.handle')!
    this.border = container.querySelector('.dashed-border')!
    this.direction = direction

    this.container.classList.add(this.direction)
    this.handle.classList.add(this.direction)

    this.bindEvents()
  }

  setPosition(x: number, y: number) {
    const { clientWidth, clientHeight } = this.container
    this.posX = Math.max(0, Math.min(clientWidth, x))
    this.posY = Math.max(0, Math.min(clientHeight, y))
    this.scheduleUpdate()
  }

  private getClientPos(e: MouseEvent | TouchEvent) {
    const rect = this.container.getBoundingClientRect()
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
      this.handle.classList.add('draggable')
    }

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!this.isDragging) return
      e.preventDefault()
      const { x, y } = this.getClientPos(e)
      this.setPosition(x, y)
    }

    const onEnd = () => {
      this.isDragging = false
      this.handle.classList.remove('draggable')
    }

    this.handle.addEventListener('mousedown', onStart)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)
    this.handle.addEventListener('touchstart', onStart, { passive: false })
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
  }

  private scheduleUpdate() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
    this.animationFrameId = requestAnimationFrame(() => this.updateClip())
  }

  private updateClip() {
    this.animationFrameId = null

    if (this.direction === 'horizontal') {
      this.filteredCanvas.style.clipPath = `inset(0 calc(100% - ${this.posX}px) 0 0)`
      this.border.style.width = `${this.posX}px`
      this.handle.style.transform = `translate(${this.posX}px, ${this.posY}px)`
    } else {
      this.filteredCanvas.style.clipPath = `inset(0 0 calc(100% - ${this.posY}px) 0)`
      this.border.style.height = `${this.posY}px`
      this.handle.style.transform = `translate(${this.posX}px, ${this.posY}px)`
    }
  }
}
