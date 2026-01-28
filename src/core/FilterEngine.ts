export class FilterEngine {
  public originalImage: HTMLImageElement
  public readonly originalCanvas: HTMLCanvasElement
  public readonly filteredCanvas: HTMLCanvasElement
  private readonly originalCtx: CanvasRenderingContext2D
  private readonly filteredCtx: CanvasRenderingContext2D

  constructor(
    originalCanvas: HTMLCanvasElement,
    filteredCanvas: HTMLCanvasElement,
    originalImage: HTMLImageElement
  ) {
    this.originalCanvas = originalCanvas
    this.filteredCanvas = filteredCanvas
    this.originalImage = originalImage
    this.originalCtx = originalCanvas.getContext('2d')!
    this.filteredCtx = filteredCanvas.getContext('2d')!

    this.redraw()
  }

  public updateImage(newImage: HTMLImageElement) {
    this.originalImage = newImage
    this.redraw()
  }

  public applyFilter(filter: string) {
    this.filteredCanvas.style.filter = filter
  }

  public redraw() {
    this.drawOnCanvas(this.originalCtx, this.originalImage, 0, true)
    this.drawOnCanvas(this.filteredCtx, this.originalImage, 0, true)
  }

  public renderSlideTransition(fromImg: HTMLImageElement, toImg: HTMLImageElement, progress: number, direction: 'next' | 'previous') {
    const d = direction === 'next' ? 1 : -1
    const fromOffset = -progress * this.originalCanvas.width * d
    const toOffset = (this.originalCanvas.width - progress * this.originalCanvas.width) * d

    this.originalCtx.clearRect(0, 0, this.originalCanvas.width, this.originalCanvas.height)
    this.drawOnCanvas(this.originalCtx, fromImg, fromOffset)
    this.drawOnCanvas(this.originalCtx, toImg, toOffset)

    this.filteredCtx.clearRect(0, 0, this.filteredCanvas.width, this.filteredCanvas.height)
    this.drawOnCanvas(this.filteredCtx, fromImg, fromOffset)
    this.drawOnCanvas(this.filteredCtx, toImg, toOffset)
  }

  private drawOnCanvas(ctx: CanvasRenderingContext2D, image: HTMLImageElement, offsetX = 0, clear = false) {
    const canvas = ctx.canvas
    const dpr = window.devicePixelRatio || 1
    const container = canvas.parentElement!
    const { clientWidth: containerWidth, clientHeight: containerHeight } = container

    if (containerWidth === 0 || containerHeight === 0) return

    if (canvas.width !== Math.floor(containerWidth * dpr) || canvas.height !== Math.floor(containerHeight * dpr)) {
      canvas.width = Math.floor(containerWidth * dpr)
      canvas.height = Math.floor(containerHeight * dpr)
      canvas.style.width = `${containerWidth}px`
      canvas.style.height = `${containerHeight}px`
    }

    const { naturalWidth, naturalHeight } = image
    const imgRatio = naturalWidth / naturalHeight
    const containerRatio = containerWidth / containerHeight

    let sWidth, sHeight, sx, sy
    if (imgRatio > containerRatio) {
      sHeight = naturalHeight
      sWidth = sHeight * containerRatio
      sx = (naturalWidth - sWidth) / 2
      sy = 0
    } else {
      sWidth = naturalWidth
      sHeight = sWidth / containerRatio
      sx = 0
      sy = (naturalHeight - sHeight) / 2
    }

    if (clear) ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(offsetX, 0)
    ctx.drawImage(
      image,
      sx, sy, sWidth, sHeight,
      0, 0, canvas.width, canvas.height
    )

    ctx.restore()
  }
}
