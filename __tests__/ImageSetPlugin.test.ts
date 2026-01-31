import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { type UIConfig, type ComparisonSlider, ImageSetPlugin, EventEmitter, defaultConfig } from '../src'

describe('ImageSetPlugin', () => {
  let sliderMock: Partial<ComparisonSlider>
  let events: EventEmitter
  let config: UIConfig
  let container: HTMLElement
  let originalImage: HTMLImageElement

  beforeEach(() => {
    vi.useFakeTimers()

    document.body.innerHTML = '<div class="slider-container"></div>'
    container = document.body.querySelector('.slider-container')!
    originalImage = new Image()
    originalImage.src = 'image1.jpg'
    originalImage.dataset.imgset = 'image2.jpg,image3.jpg'

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
        renderDissolveTransition: vi.fn()
      }
    }
  })

  afterEach(() => {
    vi.useRealTimers()
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
    const transitionSpy = vi.spyOn(plugin as any, 'transitionTo')

    const nextButton = container.querySelector('.nav-button.next') as HTMLButtonElement
    nextButton.click()

    expect(transitionSpy).toHaveBeenCalledWith(1, 'next')
  })

  it('should navigate to the previous image on prev button click', async () => {
    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    await plugin.initialize()
    plugin['currentIndex'] = 1
    const transitionSpy = vi.spyOn(plugin as any, 'transitionTo')

    const prevButton = container.querySelector('.nav-button.prev') as HTMLButtonElement
    prevButton.click()

    expect(transitionSpy).toHaveBeenCalledWith(0, 'prev')
  })

  it('should handle cyclic navigation from last to first', async () => {
    config.imageSet!.cyclic = true
    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    await plugin.initialize()
    plugin['currentIndex'] = 2
    const transitionSpy = vi.spyOn(plugin as any, 'transitionTo')

    const nextButton = container.querySelector('.nav-button.next') as HTMLButtonElement
    nextButton.click()

    expect(transitionSpy).toHaveBeenCalledWith(0, 'next')
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

  it('should stop autoplay on mouseenter if configured', async () => {
    config.imageSet!.autoplay = true
    config.imageSet!.pauseOnHover = true
    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    const stopAutoplaySpy = vi.spyOn(plugin as any, 'stopAutoplay')
    await plugin.initialize()

    container.dispatchEvent(new MouseEvent('mouseenter'))
    expect(stopAutoplaySpy).toHaveBeenCalled()
  })

  it('should call updateImage after transition completes', async () => {
    // Disable autoplay to prevent infinite loops with fake timers
    config.imageSet!.autoplay = false

    const plugin = new ImageSetPlugin(sliderMock as ComparisonSlider, config, events)
    await plugin.initialize()

    // Use a smart local mock for requestAnimationFrame
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      // "Catch" the animation callback but don't run it
      return 0
    })

    const nextButton = container.querySelector('.nav-button.next') as HTMLButtonElement
    nextButton.click()

    // The first call to rAF is now caught by our spy.
    expect(rafSpy).toHaveBeenCalled()
    const animate = rafSpy.mock.calls[0][0]

    // Manually run the animation loop
    const startTime = performance.now()
    animate(startTime) // First frame to set startTime
    animate(startTime + 1000) // Second frame to finish (duration is 400ms)

    expect(sliderMock.updateImage).toHaveBeenCalled()

    rafSpy.mockRestore()
  })
})
