import { ComparisonSlider, Plugin } from '../core/ComparisonSlider'
import { UIConfig } from '../config'

export class MagnifierPlugin implements Plugin {
  private slider: ComparisonSlider
  private config: UIConfig
  private magnifierEl!: HTMLElement
  private magnifierCanvas!: HTMLCanvasElement
  private ctx!: CanvasRenderingContext2D
  private isEnabled = false
  private lastMousePosition: { x: number; y: number } | null = null
  private iconCache = new Map<string, HTMLImageElement>()
  private zoomPanel!: HTMLElement
  private currentZoom: number
  private magnifierButton!: HTMLElement

  constructor(slider: ComparisonSlider, config: UIConfig) {
    this.slider = slider
    this.config = config
    this.currentZoom = config.magnifier.defaultZoom
  }

  public initialize(): void {
    this.magnifierButton = this.slider.container.querySelector(this.config.magnifier.button)!
    this.createMagnifierElement()
    this.createZoomPanel()
    this.attachEventListeners()
  }

  private createMagnifierElement(): void {
    this.magnifierEl = document.createElement('div')
    this.magnifierEl.classList.add('magnifier')
    const size = this.config.magnifier.size
    this.magnifierEl.style.width = `${size}px`
    this.magnifierEl.style.height = `${size}px`

    this.magnifierCanvas = document.createElement('canvas')
    this.magnifierCanvas.width = size
    this.magnifierCanvas.height = size
    this.ctx = this.magnifierCanvas.getContext('2d')!

    this.magnifierEl.appendChild(this.magnifierCanvas)
    this.slider.container.appendChild(this.magnifierEl)
  }

  private createZoomPanel(): void {
    this.zoomPanel = document.createElement('div')
    this.zoomPanel.classList.add('magnifier-zoom-panel')

    this.config.magnifier.zoomLevels.forEach(level => {
      const button = document.createElement('button')

      button.textContent = `${level}x`
      button.dataset.zoom = level.toString()
      button.addEventListener('click', (e) => {
        e.stopPropagation()
        this.setZoom(level)
      })

      this.zoomPanel.appendChild(button)
    })

    this.slider.container.appendChild(this.zoomPanel)
  }

  private attachEventListeners(): void {
    this.magnifierButton.addEventListener('click', (e) => {
      e.stopPropagation()
      this.handleToggleAction()
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'm') this.handleToggleAction()
    })

    this.slider.container.addEventListener('mousemove', (e) => this.onMouseMove(e))
    this.slider.container.addEventListener('mouseleave', () => this.onMouseLeave())
    this.slider.container.addEventListener('mouseenter', (e) => this.onMouseEnter(e))

    document.addEventListener('click', (e) => {
      if (this.zoomPanel.classList.contains('open') && !this.zoomPanel.contains(e.target as Node) && e.target !== this.magnifierButton) {
        this.hideZoomPanel()
      }
    })
  }

  private handleToggleAction(): void {
    if (this.isEnabled) {
      this.isEnabled = false
      this.hide()
      this.magnifierButton.classList.remove('active')
    } else if (this.zoomPanel.classList.contains('open')) {
      this.hideZoomPanel()
    } else {
      this.showZoomPanel()
    }
  }

  private showZoomPanel(): void {
    this.positionZoomPanel()
    this.zoomPanel.classList.add('open')
  }

  private hideZoomPanel(): void {
    this.zoomPanel.classList.remove('open')
  }

  private positionZoomPanel(): void {
    const parentBlock = this.magnifierButton.closest('.ui-block') as HTMLElement
    const containerRect = this.slider.container.getBoundingClientRect()
    const buttonRect = this.magnifierButton.getBoundingClientRect()

    const isVertical = parentBlock.classList.contains('vertical')
    this.zoomPanel.classList.toggle('vertical', !isVertical)
    this.zoomPanel.classList.toggle('horizontal', isVertical)

    // Temporarily apply display to measure, but keep it invisible
    this.zoomPanel.style.visibility = 'hidden'
    this.zoomPanel.style.display = 'flex'
    const panelRect = this.zoomPanel.getBoundingClientRect()

    // Reset temporary styles
    this.zoomPanel.style.display = ''
    this.zoomPanel.style.visibility = ''

    let top = buttonRect.top - containerRect.top
    let left = buttonRect.left - containerRect.left

    if (isVertical) {
      // Try to position to the right
      left += buttonRect.width + 10
      top += (buttonRect.height - panelRect.height) / 2

      // If not enough space on the right, position to the left
      if (left + panelRect.width > containerRect.width) {
        left = buttonRect.left - containerRect.left - panelRect.width - 10
      }
    } else { // horizontal
      // Try to position above
      top -= panelRect.height + 10
      left += (buttonRect.width - panelRect.width) / 2

      // If not enough space above, position below
      if (top < 0) {
        top = buttonRect.top - containerRect.top + buttonRect.height + 10
      }
    }

    // Final boundary checks
    if (left < 0) left = 0
    if (top < 0) top = 0
    if (left + panelRect.width > containerRect.width) left = containerRect.width - panelRect.width
    if (top + panelRect.height > containerRect.height) top = containerRect.height - panelRect.height

    this.zoomPanel.style.top = `${top}px`
    this.zoomPanel.style.left = `${left}px`
  }

  private setZoom(zoom: number): void {
    this.currentZoom = zoom
    this.hideZoomPanel()
    this.isEnabled = true
    this.magnifierButton.classList.add('active')

    if (this.lastMousePosition) {
      this.show()
      this.update(this.lastMousePosition.x, this.lastMousePosition.y)
    }
  }

  private show(): void {
    this.magnifierEl.style.display = 'block'
  }

  private hide(): void {
    this.magnifierEl.style.display = 'none'
  }

  private onMouseEnter(e: MouseEvent): void {
    const rect = this.slider.container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    this.lastMousePosition = { x, y }
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.slider.container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    this.lastMousePosition = { x, y }

    if (this.isEnabled) {
      this.show()
      this.update(x, y)
    }
  }

  private onMouseLeave(): void {
    this.lastMousePosition = null
    if (this.isEnabled) {
        this.hide()
    }
  }

  private update(x: number, y: number): void {
    this.magnifierEl.style.left = `${x}px`
    this.magnifierEl.style.top = `${y}px`

    this.updateMagnifierContent(x, y)
  }

  private updateMagnifierContent(x: number, y: number): void {
    const { originalCanvas, filteredCanvas } = this.slider.filterEngine
    const { size } = this.config.magnifier
    const zoom = this.currentZoom
    const radius = size / 2

    const sx = (x / this.slider.container.clientWidth) * originalCanvas.width - (radius / zoom)
    const sy = (y / this.slider.container.clientHeight) * originalCanvas.height - (radius / zoom)
    const sw = size / zoom
    const sh = size / zoom

    this.ctx.clearRect(0, 0, size, size)
    this.ctx.save()

    const coveredEl = this.slider.container.querySelector('.covered') as HTMLElement
    const clientRadius = parseFloat(getComputedStyle(coveredEl).borderRadius)

    if (clientRadius > 0) {
      const path = new Path2D()
      const clientWidth = this.slider.container.clientWidth
      const clientHeight = this.slider.container.clientHeight
      const zoomedRadius = clientRadius * zoom

      const transformX = (c_x: number) => (c_x - x) * zoom + radius
      const transformY = (c_y: number) => (c_y - y) * zoom + radius

      path.moveTo(transformX(clientRadius), transformY(0))
      path.lineTo(transformX(clientWidth - clientRadius), transformY(0))
      path.arcTo(transformX(clientWidth), transformY(0), transformX(clientWidth), transformY(clientRadius), zoomedRadius)
      path.lineTo(transformX(clientWidth), transformY(clientHeight - clientRadius))
      path.arcTo(transformX(clientWidth), transformY(clientHeight), transformX(clientWidth - clientRadius), transformY(clientHeight), zoomedRadius)
      path.lineTo(transformX(clientRadius), transformY(clientHeight))
      path.arcTo(transformX(0), transformY(clientHeight), transformX(0), transformY(clientHeight - clientRadius), zoomedRadius)
      path.lineTo(transformX(0), transformY(clientRadius))
      path.arcTo(transformX(0), transformY(0), transformX(clientRadius), transformY(0), zoomedRadius)
      path.closePath()

      this.ctx.clip(path)
    }

    // 1. Draw original image
    this.ctx.drawImage(originalCanvas, sx, sy, sw, sh, 0, 0, size, size)

    // 2. Calculate clipping region for the filtered part
    const handleX = this.slider.dragController.posX
    const handleY = this.slider.dragController.posY
    const direction = coveredEl.dataset.direction as 'horizontal' | 'vertical'

    const handlePosition = direction === 'horizontal' ? handleX : handleY
    const cursorPosition = direction === 'horizontal' ? x : y

    const magnifierHandlePosition = ((handlePosition - cursorPosition) * zoom) + radius

    // 3. Clip and draw the filtered image
    this.ctx.save()

    const currentFilter = this.slider.filterEngine.filteredCanvas.style.filter
    if (currentFilter) {
      this.ctx.filter = currentFilter
    }

    this.ctx.beginPath()
    if (direction === 'horizontal') {
        this.ctx.rect(0, 0, magnifierHandlePosition, size)
    } else {
        this.ctx.rect(0, 0, size, magnifierHandlePosition)
    }
    this.ctx.clip()
    this.ctx.drawImage(originalCanvas, sx, sy, sw, sh, 0, 0, size, size)
    this.ctx.restore()

    // 4. Draw UI elements
    this.drawUIElements(x, y)

    this.ctx.restore()
  }

  private drawUIElements(mouseX: number, mouseY: number): void {
    const { size } = this.config.magnifier
    const zoom = this.currentZoom
    const radius = size / 2
    const containerRect = this.slider.container.getBoundingClientRect()

    const elements = this.slider.container.querySelectorAll('.ui-block button, .handle-grip, .handle-line, .nav-button, .ui-panel, .filter-buttons button')

    elements.forEach(el => {
      const htmlEl = el as HTMLElement
      const styles = getComputedStyle(htmlEl)

      if (htmlEl.id === 'filterPanel' && !htmlEl.classList.contains('open')) {
        return
      }

      const rect = htmlEl.getBoundingClientRect()

      if (rect.width === 0 || rect.height === 0 || styles.display === 'none' || styles.opacity === '0') {
        return
      }

      const elX = rect.left - containerRect.left
      const elY = rect.top - containerRect.top

      const dx = (elX - mouseX) * zoom + radius
      const dy = (elY - mouseY) * zoom + radius
      const dWidth = rect.width * zoom
      const dHeight = rect.height * zoom

      if (dx + dWidth < 0 || dx > size || dy + dHeight < 0 || dy > size) {
        return
      }

      this.ctx.save()
      this.ctx.fillStyle = styles.backgroundColor
      this.ctx.globalAlpha = parseFloat(styles.opacity)

      const isCircular = (
        htmlEl.classList.contains('handle-grip') ||
        htmlEl.classList.contains('nav-button') ||
        (htmlEl.tagName === 'BUTTON' && !!htmlEl.closest('.ui-block'))
      )

      this.ctx.beginPath()
      if (isCircular) {
        this.ctx.arc(dx + dWidth / 2, dy + dHeight / 2, dWidth / 2, 0, 2 * Math.PI)
      } else {
        const borderRadius = parseFloat(styles.borderRadius) * zoom
        this.ctx.roundRect(dx, dy, dWidth, dHeight, borderRadius)
      }
      this.ctx.fill()

      const borderWidth = parseFloat(styles.borderWidth)
      if (borderWidth > 0) {
        this.ctx.strokeStyle = styles.borderColor
        this.ctx.lineWidth = borderWidth * zoom
        this.ctx.stroke()
      }

      // Draw icon or text
      const svgEl = htmlEl.querySelector('svg')
      const after = getComputedStyle(htmlEl, '::after')

      if (svgEl) {
        const color = styles.color
        const svgString = svgEl.outerHTML.replace(/currentColor/g, color)

        let cachedImage = this.iconCache.get(svgString)
        if (!cachedImage) {
          const img = new Image()
          img.onload = () => {
            if (this.isEnabled && this.lastMousePosition) {
              this.update(this.lastMousePosition.x, this.lastMousePosition.y)
            }
          }
          img.src = `data:image/svg+xml;base64,${btoa(svgString)}`
          cachedImage = img
          this.iconCache.set(svgString, cachedImage)
        }

        if (cachedImage.complete && cachedImage.naturalWidth > 0) {
          const iconSize = dWidth * 0.55
          const iconX = dx + (dWidth - iconSize) / 2
          const iconY = dy + (dHeight - iconSize) / 2
          this.ctx.drawImage(cachedImage, iconX, iconY, iconSize, iconSize)
        }
      } else if (after.content && after.content !== 'none' && after.content !== '""') {
        const text = after.content.replace(/['"]/g, '')
        const baseFontSize = parseFloat(after.fontSize)
        const magnifiedFontSize = baseFontSize * zoom

        this.ctx.font = `${magnifiedFontSize}px ${after.fontFamily}`
        this.ctx.fillStyle = after.color
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText(text, dx + dWidth / 2, dy + dHeight / 2)
      } else if (htmlEl.tagName === 'BUTTON' && htmlEl.innerText) {
        const baseFontSize = parseFloat(styles.fontSize)
        const magnifiedFontSize = baseFontSize * zoom

        this.ctx.font = `${magnifiedFontSize}px ${styles.fontFamily}`
        this.ctx.fillStyle = styles.color
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText(htmlEl.innerText, dx + dWidth / 2, dy + dHeight / 2)
      }

      this.ctx.restore()
    })
  }
}
