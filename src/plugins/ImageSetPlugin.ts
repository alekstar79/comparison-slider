import type { UIConfig, Plugin } from '../config'

import { ComparisonSlider } from '../core/ComparisonSlider'
import { EventEmitter } from '../core/EventEmitter'

export class ImageSetPlugin implements Plugin {
  private readonly slider: ComparisonSlider
  private readonly events: EventEmitter
  private readonly config: UIConfig

  private images: HTMLImageElement[] = []
  private currentIndex = 0
  private autoplayTimer: number | null = null
  private isTransitioning = false

  private nextButton!: HTMLButtonElement
  private prevButton!: HTMLButtonElement

  constructor(
    slider: ComparisonSlider,
    config: UIConfig,
    events: EventEmitter
  ) {
    this.slider = slider
    this.config = config
    this.events = events
  }

  public async initialize() {
    const imgSetAttr = this.slider.originalImage.dataset.imgset

    if (imgSetAttr === undefined) return

    const imageUrls = imgSetAttr ? imgSetAttr.split(',').map(s => s.trim()) : []
    const originalSrc = this.slider.originalImage.src.split('/').pop()
    if (originalSrc && !imageUrls.some(url => url.includes(originalSrc))) {
      imageUrls.unshift(this.slider.originalImage.src)
    }

    if (imageUrls.length > 0) {
      this.images = await this.preloadImages(imageUrls)

      if (this.images.length > 1) {
        this.setButtons()
        this.bindEvents()
        this.startAutoplay()
      }
    }
  }

  private preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(urls.map(url => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.src = url
        img.onload = () => resolve(img)
        img.onerror = () => reject(`Failed to load image: ${url}`)
      })
    }))
  }

  private setButtons() {
    const options = this.config.uiBlocks.find(block => block.id === 'navButtons')! ?? {}
    const { direction = 'horizontal', buttons: [prev, next] = [{}, {}] } = options

    const buttonContainer = document.createElement('div')
    buttonContainer.classList.add('ui-block', 'image-set-nav', direction)

    this.prevButton = document.createElement('button')
    this.prevButton.innerHTML = prev.iconSvg ?? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>'
    this.prevButton.className = prev.class || 'nav-button prev'

    this.nextButton = document.createElement('button')
    this.nextButton.innerHTML = next.iconSvg ?? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>'
    this.nextButton.className = next.class || 'nav-button next'

    buttonContainer.appendChild(this.prevButton)
    buttonContainer.appendChild(this.nextButton)

    this.slider.container.appendChild(buttonContainer)
  }

  private bindEvents() {
    this.nextButton.addEventListener('click', () => this.navigate('next', true))
    this.prevButton.addEventListener('click', () => this.navigate('previous', true))

    if (this.config.imageSet?.autoplay && this.config.imageSet?.pauseOnHover) {
      this.slider.container.addEventListener('mouseenter', () => this.stopAutoplay())
      this.slider.container.addEventListener('mouseleave', () => this.startAutoplay())
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopAutoplay()
      } else {
        this.startAutoplay()
      }
    })
  }

  private async navigate(direction: 'next' | 'previous', userInitiated = false) {
    if (this.isTransitioning) return

    this.isTransitioning = true
    if (userInitiated) {
      this.stopAutoplay()
    }

    const newIndex = this.calculateNewIndex(direction)
    if (newIndex === this.currentIndex && !this.config.imageSet?.cyclic) {
      this.isTransitioning = false
      return
    }

    await this.transitionTo(newIndex, direction)
    this.currentIndex = newIndex
    this.isTransitioning = false

    if (userInitiated && this.config.imageSet?.autoplay && this.config.imageSet?.pauseOnHover) {
      // If user initiated and pauseOnHover is true, autoplay will be restarted by mouseleave
      // Do nothing here, let mouseleave handle it
    } else if (this.config.imageSet?.autoplay) {
      this.startAutoplay() // Restart autoplay if not paused on hover
    }
  }

  private calculateNewIndex(direction: 'next' | 'previous'): number {
    let newIndex = this.currentIndex

    if (direction === 'next') {
      newIndex++
      if (newIndex >= this.images.length) {
        newIndex = this.config.imageSet?.cyclic ? 0 : this.images.length - 1
      }
    } else {
      newIndex--
      if (newIndex < 0) {
        newIndex = this.config.imageSet?.cyclic ? this.images.length - 1 : 0
      }
    }

    return newIndex
  }

  private async transitionTo(newIndex: number, direction: 'next' | 'previous') {
    const fromImg = this.images[this.currentIndex]
    const toImg = this.images[newIndex]
    const duration = 400

    let startTime: number | null = null

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp

      const elapsedTime = timestamp - startTime
      const progress = Math.min(elapsedTime / duration, 1)

      switch (this.config.imageSet?.transitionEffect) {
        case 'blinds':
          this.slider.filterEngine.renderBlindsTransition(fromImg, toImg, progress, direction)
          break
        case 'dissolve':
          this.slider.filterEngine.renderDissolveTransition(fromImg, toImg, progress)
          break
        case 'wipe':
          this.slider.filterEngine.renderWipeTransition(fromImg, toImg, progress)
          break
        case 'wave':
          this.slider.filterEngine.renderWaveTransition(fromImg, toImg, progress, direction)
          break
        default:
          this.slider.filterEngine.renderSlideTransition(fromImg, toImg, progress, direction)
          break
      }

      this.events.emit('frameUpdate')

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        this.slider.updateImage(toImg, false) // Do not reset position
      }
    }

    requestAnimationFrame(animate)
  }

  private startAutoplay() {
    if (this.config.imageSet?.autoplay && this.images.length > 1 && !this.autoplayTimer) {
      this.autoplayTimer = window.setInterval(() => this.navigate('next'), this.config.imageSet?.interval || 3000)
    }
  }

  private stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer)
      this.autoplayTimer = null
    }
  }
}
