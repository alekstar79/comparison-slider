export class FilterEngine
{
  private readonly originalImage: HTMLImageElement

  private originalCanvas: HTMLCanvasElement
  private filteredCanvas: HTMLCanvasElement

  private originalCtx: CanvasRenderingContext2D
  private filteredCtx: CanvasRenderingContext2D

  constructor(
    originalCanvas: HTMLCanvasElement,
    filteredCanvas: HTMLCanvasElement,
    originalImage: HTMLImageElement
  ) {
    this.originalCanvas = originalCanvas
    this.filteredCanvas = filteredCanvas

    this.originalCtx = originalCanvas.getContext('2d')!
    this.filteredCtx = filteredCanvas.getContext('2d')!

    this.originalImage = originalImage
  }

  applyFilter(filter: string)
  {
    const covered = this.originalCanvas.parentElement! as HTMLElement
    const dpr = window.devicePixelRatio || 1

    const containerWidth = covered.clientWidth
    const containerHeight = covered.clientHeight
    const pixelWidth = Math.floor(containerWidth * dpr)
    const pixelHeight = Math.floor(containerHeight * dpr)

    this.originalCanvas.width = pixelWidth
    this.originalCanvas.height = pixelHeight
    this.filteredCanvas.width = pixelWidth
    this.filteredCanvas.height = pixelHeight

    this.originalCanvas.style.width = '100%'
    this.originalCanvas.style.height = '100%'
    this.filteredCanvas.style.width = '100%'
    this.filteredCanvas.style.height = '100%'

    const imgRatio = this.originalImage.naturalWidth / this.originalImage.naturalHeight
    const containerRatio = containerWidth / containerHeight

    let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number

    if (imgRatio > containerRatio) {
      drawHeight = containerHeight
      drawWidth = containerHeight * imgRatio
      offsetX = (containerWidth - drawWidth) / 2
      offsetY = 0
    } else {
      drawWidth = containerWidth
      drawHeight = containerWidth / imgRatio
      offsetX = 0
      offsetY = (containerHeight - drawHeight) / 2
    }

    this.originalCtx.save()
    this.originalCtx.scale(dpr, dpr)
    this.originalCtx.clearRect(0, 0, containerWidth, containerHeight)
    this.originalCtx.drawImage(
      this.originalImage,
      offsetX, offsetY, drawWidth, drawHeight
    )

    this.originalCtx.restore()

    this.filteredCtx.save()
    this.filteredCtx.scale(dpr, dpr)
    this.filteredCtx.clearRect(0, 0, containerWidth, containerHeight)
    this.filteredCtx.filter = filter
    this.filteredCtx.drawImage(
      this.originalImage,
      offsetX, offsetY, drawWidth, drawHeight
    )

    this.filteredCtx.restore()
    this.filteredCtx.filter = 'none'
  }
}
