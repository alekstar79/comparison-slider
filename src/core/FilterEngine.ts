export class FilterEngine {
  public originalImage: HTMLImageElement
  public readonly originalCanvas: HTMLCanvasElement
  public readonly filteredCanvas: HTMLCanvasElement
  public readonly originalCtx: CanvasRenderingContext2D
  public readonly filteredCtx: CanvasRenderingContext2D
  public pixelCoordinates: { x: number, y: number }[] | null = null

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
    this.drawOnCanvas(this.originalCtx, this.originalImage)
    this.drawOnCanvas(this.filteredCtx, this.originalImage)
    this.pixelCoordinates = null // Reset pixel coordinates on redraw
  }

  public renderSlideTransition(
    fromImg: HTMLImageElement,
    toImg: HTMLImageElement,
    progress: number,
    direction: 'next' | 'previous'
  ) {
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

  public renderBlindsTransition(
    fromImg: HTMLImageElement,
    toImg: HTMLImageElement,
    progress: number,
    direction: 'next' | 'previous'
  ) {
    const numBlinds = 10
    const blindWidth = this.originalCanvas.width / numBlinds

    this.drawOnCanvas(this.originalCtx, fromImg)
    this.drawOnCanvas(this.filteredCtx, fromImg)

    for (let i = 0; i < numBlinds; i++) {
      const x = direction === 'next' ? i * blindWidth : (numBlinds - 1 - i) * blindWidth
      const width = blindWidth * progress
      const blindX = direction === 'next' ? x : x + (blindWidth - width)

      this.originalCtx.save()
      this.originalCtx.beginPath()
      this.originalCtx.rect(blindX, 0, width, this.originalCanvas.height)
      this.originalCtx.clip()
      this.drawOnCanvas(this.originalCtx, toImg)
      this.originalCtx.restore()

      this.filteredCtx.save()
      this.filteredCtx.beginPath()
      this.filteredCtx.rect(blindX, 0, width, this.filteredCanvas.height)
      this.filteredCtx.clip()
      this.drawOnCanvas(this.filteredCtx, toImg)
      this.filteredCtx.restore()
    }
  }

  public renderDissolveTransition(
    fromImg: HTMLImageElement,
    toImg: HTMLImageElement,
    progress: number
  ) {
    if (!this.pixelCoordinates) {
      this.pixelCoordinates = this.generatePixelCoordinates()
    }

    const fromData = this.getImageData(fromImg)
    const toData = this.getImageData(toImg)
    const newData = this.originalCtx.createImageData(fromData.width, fromData.height)

    const numPixelsToDissolve = Math.floor(this.pixelCoordinates.length * progress)

    for (let i = 0; i < this.pixelCoordinates.length; i++) {
      const { x, y } = this.pixelCoordinates[i] as typeof this.pixelCoordinates[0]
      const pixelIndex = (y * fromData.width + x) * 4

      const sourceData = i < numPixelsToDissolve ? toData.data : fromData.data

      newData.data[pixelIndex] = sourceData[pixelIndex]
      newData.data[pixelIndex + 1] = sourceData[pixelIndex + 1]
      newData.data[pixelIndex + 2] = sourceData[pixelIndex + 2]
      newData.data[pixelIndex + 3] = sourceData[pixelIndex + 3]
    }

    this.originalCtx.putImageData(newData, 0, 0)
    this.filteredCtx.putImageData(newData, 0, 0)
  }

  public renderWipeTransition(
    fromImg: HTMLImageElement,
    toImg: HTMLImageElement,
    progress: number
  ) {
    const centerX = this.originalCanvas.width / 2
    const centerY = this.originalCanvas.height / 2
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY)
    const currentRadius = maxRadius * progress

    this.drawOnCanvas(this.originalCtx, fromImg)
    this.drawOnCanvas(this.filteredCtx, fromImg)

    this.originalCtx.save()
    this.originalCtx.beginPath()
    this.originalCtx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI)
    this.originalCtx.clip()
    this.drawOnCanvas(this.originalCtx, toImg)
    this.originalCtx.restore()

    this.filteredCtx.save()
    this.filteredCtx.beginPath()
    this.filteredCtx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI)
    this.filteredCtx.clip()
    this.drawOnCanvas(this.filteredCtx, toImg)
    this.filteredCtx.restore()
  }

  public renderWaveTransition(
    fromImg: HTMLImageElement,
    toImg: HTMLImageElement,
    progress: number,
    direction: 'next' | 'previous'
  ) {
    const fromData = this.getImageData(fromImg)
    const toData = this.getImageData(toImg)
    const newData = this.originalCtx.createImageData(fromData.width, fromData.height)
    const width = fromData.width
    const height = fromData.height

    const waveAmplitude = 20
    const waveFrequency = 30
    const waveSpeed = 15

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const waveOffset = Math.sin(y / waveFrequency + progress * waveSpeed) * waveAmplitude
        let transitionPoint = progress * (width + waveAmplitude * 2) - waveAmplitude

        if (direction === 'next') { // Inverted the logic here
          transitionPoint = width - transitionPoint
        }

        const threshold = transitionPoint + waveOffset
        const pixelIndex = (y * width + x) * 4
        const sourceData = (direction === 'next' && x > threshold) || (direction === 'previous' && x < threshold) ? toData.data : fromData.data

        newData.data[pixelIndex] = sourceData[pixelIndex]
        newData.data[pixelIndex + 1] = sourceData[pixelIndex + 1]
        newData.data[pixelIndex + 2] = sourceData[pixelIndex + 2]
        newData.data[pixelIndex + 3] = sourceData[pixelIndex + 3]
      }
    }

    this.originalCtx.putImageData(newData, 0, 0)
    this.filteredCtx.putImageData(newData, 0, 0)
  }

  private generatePixelCoordinates(): { x: number, y: number }[] {
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

  private getImageData(image: HTMLImageElement): ImageData {
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

  private drawOnCanvas(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    offsetX = 0,
    clear = false
  ) {
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
