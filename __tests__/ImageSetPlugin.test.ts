import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { type UIConfig, type ComparisonSlider, ImageSetPlugin, EventEmitter, defaultConfig } from '../src'

describe('ImageSetPlugin', () => {
  let sliderMock: Partial<ComparisonSlider>
  let events: EventEmitter
  let config: UIConfig
  let container: HTMLElement
  let originalImage: HTMLImageElement
  let preloadedImages: HTMLImageElement[]
  let preloadSpy: any
  let rafSpy: any

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()

    document.body.innerHTML = '<div class="slider-container"></div>'
    container = document.body.querySelector('.slider-container')!
    originalImage = new Image()
    originalImage.src = 'image1.jpg'
    originalImage.dataset.imgset = 'image2.jpg,image3.jpg'

    preloadedImages = [new Image(), new Image(), new Image()]
    preloadedImages[0].src = 'image1.jpg'
    preloadedImages[1].src = 'image2.jpg'
    preloadedImages[2].src = 'image3.jpg'

    preloadSpy = vi.spyOn(ImageSetPlugin.prototype as any, 'preloadImages').mockResolvedValue(preloadedImages)

    events = new EventEmitter()
    config = JSON.parse(JSON.stringify(defaultConfig))

    sliderMock = {
      container,
      originalImage,
      events,
      config,
      updateImage: vi.fn(),
      filterEngine: {
        renderSlideTransition: vi.fn(),
        renderDissolveTransition: vi.fn(),
        renderBlindsTransition: vi.fn(),
        renderWipeTransition: vi.fn(),
        renderWaveTransition: vi.fn()
      }
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    preloadSpy.mockRestore()
    if (rafSpy) rafSpy.mockRestore()
  })

  it('should not initialize if data-imgset is missing', async () => {
    delete originalImage.dataset.imgset
    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    await plugin.initialize()
    expect(container.querySelector('.image-set-nav')).toBeNull()
  })

  it('should create navigation buttons if multiple images are present', async () => {
    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    await plugin.initialize()
    expect(container.querySelector('.nav-button.next')).not.toBeNull()
    expect(container.querySelector('.nav-button.prev')).not.toBeNull()
  })

  it('should navigate to the next image on next button click', async () => {
    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    await plugin.initialize()
    const navigateSpy = vi.spyOn(plugin as any, 'navigate')

    const nextButton = container.querySelector('.nav-button.next') as HTMLButtonElement
    nextButton.click()

    expect(navigateSpy).toHaveBeenCalledWith('next')
  })

  it('should navigate to the previous image on prev button click', async () => {
    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    await plugin.initialize()
    plugin['currentIndex'] = 1
    const navigateSpy = vi.spyOn(plugin as any, 'navigate')

    const prevButton = container.querySelector('.nav-button.prev') as HTMLButtonElement
    prevButton.click()

    expect(navigateSpy).toHaveBeenCalledWith('prev')
  })

  it('should handle cyclic navigation from last to first', async () => {
    config.imageSet!.cyclic = true
    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    await plugin.initialize()
    plugin['currentIndex'] = 2 // Last image
    const transitionSpy = vi.spyOn(plugin as any, 'transitionTo')

    const nextButton = container.querySelector('.nav-button.next') as HTMLButtonElement
    nextButton.click()

    expect(transitionSpy).toHaveBeenCalledWith(0, 'next') // Should go to the first image
  })

  it('should start autoplay if configured', async () => {
    config.imageSet!.autoplay = true
    config.imageSet!.interval = 5000
    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    const navigateSpy = vi.spyOn(plugin as any, 'navigate')
    await plugin.initialize()

    expect(navigateSpy).not.toHaveBeenCalled()
    vi.advanceTimersByTime(5000)
    expect(navigateSpy).toHaveBeenCalledWith('next')
  })

  it('should stop autoplay on mouseenter and resume on mouseleave', async () => {
    config.imageSet!.autoplay = true
    config.imageSet!.pauseOnHover = true
    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    const stopAutoplaySpy = vi.spyOn(plugin as any, 'stopAutoplay')
    const startAutoplaySpy = vi.spyOn(plugin as any, 'startAutoplay')
    await plugin.initialize()

    container.dispatchEvent(new MouseEvent('mouseenter'))
    expect(stopAutoplaySpy).toHaveBeenCalled()

    container.dispatchEvent(new MouseEvent('mouseleave'))
    expect(startAutoplaySpy).toHaveBeenCalled()
  })

  it('should call updateImage after transition completes', async () => {
    config.imageSet!.autoplay = false
    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    await plugin.initialize()

    let animationCallback: FrameRequestCallback | null = null;
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      animationCallback = cb;
      return 0;
    });

    const nextButton = container.querySelector('.nav-button.next') as HTMLButtonElement
    nextButton.click()

    expect(animationCallback).not.toBeNull();
    // Simulate animation loop until completion
    while (animationCallback) {
      const cb = animationCallback;
      animationCallback = null; // Prevent infinite loop if logic doesn't clear it
      cb(performance.now() + 500); // Simulate time passing
    }

    expect(sliderMock.updateImage).toHaveBeenCalledWith(preloadedImages[1], false)
  })

  it('should stop and start autoplay on visibility change', async () => {
    config.imageSet!.autoplay = true
    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    await plugin.initialize()
    const stopSpy = vi.spyOn(plugin as any, 'stopAutoplay')
    const startSpy = vi.spyOn(plugin as any, 'startAutoplay')

    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(stopSpy).toHaveBeenCalled()

    Object.defineProperty(document, 'hidden', { value: false, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(startSpy).toHaveBeenCalled()
    Object.defineProperty(document, 'hidden', { value: false, configurable: true }) // cleanup
  })

  it('should not navigate if a transition is in progress', async () => {
    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    await plugin.initialize()
    const transitionSpy = vi.spyOn(plugin as any, 'transitionTo')

    plugin['isTransitioning'] = true
    const nextButton = container.querySelector('.nav-button.next') as HTMLButtonElement
    nextButton.click()

    expect(transitionSpy).not.toHaveBeenCalled()
  })

  it.each([
    ['blinds', 'renderBlindsTransition'],
    ['dissolve', 'renderDissolveTransition'],
    ['wipe', 'renderWipeTransition'],
    ['wave', 'renderWaveTransition'],
    ['slide', 'renderSlideTransition']
  ])('should call correct render function for "%s" effect', async (effect, renderFn) => {
    config.imageSet!.transitionEffect = effect as any
    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    await plugin.initialize()
    const renderSpy = sliderMock.filterEngine![renderFn as keyof typeof sliderMock.filterEngine]

    let animationCallback: FrameRequestCallback | null = null;
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      animationCallback = cb;
      return 0;
    });

    const nextButton = container.querySelector('.nav-button.next') as HTMLButtonElement
    nextButton.click()

    expect(animationCallback).not.toBeNull();
    if (animationCallback) {
      animationCallback(performance.now());
    }

    expect(renderSpy).toHaveBeenCalled()
  })

  it('should update image on "imageUpdate" event', async () => {
    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    await plugin.initialize()
    const newImage = new Image()
    newImage.src = 'new_image.jpg'

    expect(plugin['images'][0]).toBe(preloadedImages[0])
    events.emit('imageUpdate', { image: newImage })
    expect(plugin['images'][0]).toBe(newImage)
  })

  it('should not start autoplay if pauseOnHover is true and mouse is already over element', async () => {
    config.imageSet!.autoplay = true
    config.imageSet!.pauseOnHover = true
    vi.spyOn(container, 'matches').mockReturnValue(true)
    const setIntervalSpy = vi.spyOn(window, 'setInterval')

    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    await plugin.initialize()

    expect(setIntervalSpy).not.toHaveBeenCalled()
  })

  it('should not navigate past the end if not cyclic', async () => {
    config.imageSet!.cyclic = false
    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    await plugin.initialize()
    plugin['currentIndex'] = preloadedImages.length - 1 // Last image
    const transitionSpy = vi.spyOn(plugin as any, 'transitionTo')

    const nextButton = container.querySelector('.nav-button.next') as HTMLButtonElement
    nextButton.click()

    expect(transitionSpy).not.toHaveBeenCalled()
  })
})
