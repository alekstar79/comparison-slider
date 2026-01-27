export class FilterEngine {
  private readonly originalImage: HTMLImageElement
  private readonly originalCanvas: HTMLCanvasElement
  private readonly filteredCanvas: HTMLCanvasElement

  constructor(
    originalCanvas: HTMLCanvasElement,
    filteredCanvas: HTMLCanvasElement,
    originalImage: HTMLImageElement
  ) {
    this.originalCanvas = originalCanvas
    this.filteredCanvas = filteredCanvas
    this.originalImage = originalImage

    this.redraw()
  }

  applyFilter(filter: string) {
    this.filteredCanvas.style.filter = filter
  }

  redraw() {
    const dpr = window.devicePixelRatio || 1
    const container = this.originalCanvas.parentElement!
    const { clientWidth: containerWidth, clientHeight: containerHeight } = container

    if (containerWidth === 0 || containerHeight === 0) {
      return
    }

    const setCanvasSize = (canvas: HTMLCanvasElement) => {
      canvas.width = Math.floor(containerWidth * dpr)
      canvas.height = Math.floor(containerHeight * dpr)
      canvas.style.width = `${containerWidth}px`
      canvas.style.height = `${containerHeight}px`
    }

    setCanvasSize(this.originalCanvas)
    setCanvasSize(this.filteredCanvas)

    const { naturalWidth, naturalHeight } = this.originalImage
    const imgRatio = naturalWidth / naturalHeight
    const containerRatio = containerWidth / containerHeight

    let sWidth, sHeight, sx, sy
    
    // This logic mimics object-fit: cover
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

    const draw = (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(
        this.originalImage,
        sx, sy, sWidth, sHeight, // Source rectangle (part of the image to draw)
        0, 0, canvas.width, canvas.height // Destination rectangle (the full canvas)
      )
    }

    draw(this.originalCanvas)
    draw(this.filteredCanvas)
  }
}
