import { renderBlindsTransition } from '../effects/blinds'
import { renderDissolveTransition } from '../effects/dissolve'
import { renderSlideTransition } from '../effects/slide'
import { renderWipeTransition } from '../effects/wipe'
import { renderWaveTransition } from '../effects/wave'

export class FilterEngine {
  public originalImage: HTMLImageElement

  public readonly originalCanvas: HTMLCanvasElement
  public readonly filteredCanvas: HTMLCanvasElement

  public readonly originalCtx: CanvasRenderingContext2D
  public readonly filteredCtx: CanvasRenderingContext2D

  public pixelCoordinates: { x: number, y: number }[] | null = null
  public panOffset = { x: 0, y: 0 }

  private currentFilter = 'none'
  private isApplyingFilter = false
  private filterCache = new Map<string, ImageData>()

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
    this.panOffset = { x: 0, y: 0 } // Reset pan on new image
    this.redraw()
  }

  private applyFilterToCanvas(canvas: HTMLCanvasElement, filter: string): HTMLCanvasElement {
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!

    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height

    if (filter && filter !== 'none') {
      tempCtx.filter = filter
    }

    tempCtx.drawImage(canvas, 0, 0)

    return tempCanvas
  }

  public applyFilter(filter: string) {
    if (this.isApplyingFilter) return
    this.currentFilter = filter

    if (filter === 'none') {
      this.filteredCtx.clearRect(0, 0, this.filteredCanvas.width, this.filteredCanvas.height)
      this.filteredCtx.drawImage(this.originalCanvas, 0, 0)
      return
    }

    this.isApplyingFilter = true

    const filteredResultCanvas = this.applyFilterToCanvas(this.originalCanvas, filter)
    this.filteredCtx.clearRect(0, 0, this.filteredCanvas.width, this.filteredCanvas.height)
    this.filteredCtx.drawImage(filteredResultCanvas, 0, 0)

    this.isApplyingFilter = false
  }

  public setPanOffset(x: number, y: number) {
    this.panOffset.x = x
    this.panOffset.y = y
    this.redraw()
  }

  public redraw(width?: number, height?: number) {
    // 1. Resize and draw original canvas. This is the source of truth for size.
    this.drawOnCanvas(this.originalCtx, this.originalImage, 0, true, width, height)

    // 2. Ensure filtered canvas has the same dimensions.
    const targetWidth = this.originalCanvas.width
    const targetHeight = this.originalCanvas.height
    if (this.filteredCanvas.width !== targetWidth || this.filteredCanvas.height !== targetHeight) {
      this.filteredCanvas.width = targetWidth
      this.filteredCanvas.height = targetHeight
      this.filteredCanvas.style.width = this.originalCanvas.style.width
      this.filteredCanvas.style.height = this.originalCanvas.style.height
    }

    // 3. Clear cache and apply the filter to the now correctly-sized canvases.
    this.filterCache.clear()
    this.pixelCoordinates = null
    this.applyFilter(this.currentFilter)
  }

  private applyFilterToTransitionFrame() {
    if (this.currentFilter !== 'none') {
      const filteredFrame = this.applyFilterToCanvas(this.filteredCanvas, this.currentFilter)
      this.filteredCtx.clearRect(0, 0, this.filteredCanvas.width, this.filteredCanvas.height)
      this.filteredCtx.drawImage(filteredFrame, 0, 0)
    }
  }

  public renderSlideTransition(fromImg: HTMLImageElement, toImg: HTMLImageElement, progress: number, direction: 'next' | 'previous') {
    renderSlideTransition(this, fromImg, toImg, progress, direction)
    this.applyFilterToTransitionFrame()
  }

  public renderBlindsTransition(fromImg: HTMLImageElement, toImg: HTMLImageElement, progress: number, direction: 'next' | 'previous') {
    renderBlindsTransition(this, fromImg, toImg, progress, direction)
    this.applyFilterToTransitionFrame()
  }

  public renderDissolveTransition(fromImg: HTMLImageElement, toImg: HTMLImageElement, progress: number) {
    renderDissolveTransition(this, fromImg, toImg, progress)
    this.applyFilterToTransitionFrame()
  }

  public renderWipeTransition(fromImg: HTMLImageElement, toImg: HTMLImageElement, progress: number) {
    renderWipeTransition(this, fromImg, toImg, progress)
    this.applyFilterToTransitionFrame()
  }

  public renderWaveTransition(fromImg: HTMLImageElement, toImg: HTMLImageElement, progress: number, direction: 'next' | 'previous') {
    renderWaveTransition(this, fromImg, toImg, progress, direction)
    this.applyFilterToTransitionFrame()
  }

  public generatePixelCoordinates(): { x: number, y: number }[] {
    const coordinates = []
    const step = 4 // Process every 4th pixel

    for (let y = 0; y < this.originalCanvas.height; y += step) {
      for (let x = 0; x < this.originalCanvas.width; x += step) {
        coordinates.push({ x, y })
      }
    }

    // Shuffle coordinates for random dissolve effect
    for (let i = coordinates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[coordinates[i], coordinates[j]] = [coordinates[j], coordinates[i]]
    }

    return coordinates
  }

  public getImageData(image: HTMLImageElement): ImageData {
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!
    tempCanvas.width = this.originalCanvas.width
    tempCanvas.height = this.originalCanvas.height

    const { naturalWidth, naturalHeight } = image
    const imgRatio = naturalWidth / naturalHeight
    const containerRatio = tempCanvas.width / tempCanvas.height

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

    tempCtx.drawImage(
      image,
      sx, sy, sWidth, sHeight,
      0, 0, tempCanvas.width, tempCanvas.height
    )

    return tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
  }

  public drawOnCanvas(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    offsetX = 0,
    clear = false,
    width?: number,
    height?: number
  ) {
    const canvas = ctx.canvas
    const dpr = window.devicePixelRatio || 1
    // Use the main slider container for sizing, not the immediate parent
    const container = canvas.parentElement?.parentElement!
    const containerWidth = width || container.clientWidth
    const containerHeight = height || container.clientHeight

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
      sx = (naturalWidth - sWidth) / 2 + this.panOffset.x
      sy = this.panOffset.y
    } else {
      sWidth = naturalWidth
      sHeight = sWidth / containerRatio
      sx = this.panOffset.x
      sy = (naturalHeight - sHeight) / 2 + this.panOffset.y
    }

    // Clamp sx and sy to prevent panning out of bounds
    sx = Math.max(0, Math.min(sx, naturalWidth - sWidth))
    sy = Math.max(0, Math.min(sy, naturalHeight - sHeight))

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
