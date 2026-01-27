export class DragController
{
  private container: HTMLElement
  private handle: HTMLElement

  private readonly direction: 'horizontal' | 'vertical'
  private filteredCanvas: HTMLCanvasElement
  private isDragging = false

  private posX = 200
  private posY = 100

  private startX = 0
  private startY = 0

  constructor(container: HTMLElement, direction: 'horizontal' | 'vertical')
  {
    this.container = container
    this.filteredCanvas = container.querySelector('.filtered-canvas')!
    this.handle = container.querySelector('.handle')!
    this.direction = direction

    this.bindEvents()
  }

  setPosition(x: number, y: number)
  {
    this.posX = Math.max(0, Math.min(this.container.clientWidth, x))
    this.posY = Math.max(0, Math.min(this.container.clientHeight, y))

    this.updateClip()
  }

  private getClientPos(e: MouseEvent | TouchEvent): {
    x: number;
    y: number;
  } {
    const rect = this.container.getBoundingClientRect()

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      }
    }

    return {
      x: (e as MouseEvent).clientX - rect.left,
      y: (e as MouseEvent).clientY - rect.top
    }
  }

  private bindEvents()
  {
    let dragStartX = 0
    let dragStartY = 0

    const onStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()

      this.isDragging = true
      this.handle.classList.add('draggable')

      const pos = this.getClientPos(e)

      dragStartX = pos.x
      dragStartY = pos.y

      this.startX = this.posX
      this.startY = this.posY
    }

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!this.isDragging) return

      e.preventDefault()

      const currentPos = this.getClientPos(e)

      let newX = this.startX + (currentPos.x - dragStartX)
      let newY = this.startY + (currentPos.y - dragStartY)

      newX = Math.max(0, Math.min(this.container.clientWidth, newX))
      newY = Math.max(0, Math.min(this.container.clientHeight, newY))

      this.posX = newX
      this.posY = newY

      this.updateClip()
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

  private updateClip()
  {
    const border = this.container.querySelector('.dashed-border') as HTMLElement

    this.container.classList.remove('horizontal', 'vertical')
    this.handle.classList.remove('horizontal', 'vertical')

    if (this.direction === 'horizontal') {
      this.filteredCanvas.style.clipPath = `inset(0 calc(100% - ${this.posX}px) 0 0)`
      border.style.width = `${this.posX}px`
      this.handle.style.left = `${this.posX}px`
      this.handle.style.top = `${this.posY}px`
      this.container.classList.add('horizontal')

    } else {
      this.filteredCanvas.style.clipPath = `inset(0 0 calc(100% - ${this.posY}px) 0)`
      border.style.height = `${this.posY}px`
      this.handle.style.left = `${this.posX}px`
      this.handle.style.top = `${this.posY}px`
      this.handle.classList.add('vertical')
      this.container.classList.add('vertical')
    }
  }
}
