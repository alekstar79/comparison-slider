import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FilterEngine } from '../src/core/FilterEngine'
import * as slideEffect from '../src/effects/slide'
import * as blindsEffect from '../src/effects/blinds'
import * as dissolveEffect from '../src/effects/dissolve'
import * as wipeEffect from '../src/effects/wipe'
import * as waveEffect from '../src/effects/wave'

// Mock the external effect modules
vi.mock('../src/effects/slide')
vi.mock('../src/effects/blinds')
vi.mock('../src/effects/dissolve')
vi.mock('../src/effects/wipe')
vi.mock('../src/effects/wave')

describe('FilterEngine', () => {
  let originalCanvas: HTMLCanvasElement
  let filteredCanvas: HTMLCanvasElement
  let originalImage: HTMLImageElement
  let engine: FilterEngine
  let sliderContainer: HTMLElement

  beforeEach(() => {
    // Reset mocks to ensure test isolation
    vi.clearAllMocks()

    sliderContainer = document.createElement('div')
    sliderContainer.className = 'slider-container'
    Object.defineProperties(sliderContainer, {
      clientWidth: { value: 800, configurable: true },
      clientHeight: { value: 600, configurable: true }
    })

    const covered = document.createElement('div')
    covered.className = 'covered'
    sliderContainer.appendChild(covered)

    originalCanvas = document.createElement('canvas')
    filteredCanvas = document.createElement('canvas')
    covered.appendChild(originalCanvas)

    document.body.appendChild(sliderContainer)

    originalImage = new Image()
    Object.defineProperties(originalImage, {
      naturalWidth: { value: 1920, configurable: true },
      naturalHeight: { value: 1080, configurable: true }
    })

    engine = new FilterEngine(originalCanvas, filteredCanvas, originalImage)
  })

  it('should initialize and perform an initial redraw', () => {
    expect(engine).toBeInstanceOf(FilterEngine)
    expect(engine.originalCtx.drawImage).toHaveBeenCalled()
  })

  it('should not re-apply filter if already applying', () => {
    const applySpy = vi.spyOn(engine as any, 'applyFilterToCanvas')
    engine['isApplyingFilter'] = true
    engine.applyFilter('blur(5px)')
    expect(applySpy).not.toHaveBeenCalled()
  })

  it('should handle the "none" filter', () => {
    engine.applyFilter('none')
    expect(engine.filteredCtx.clearRect).toHaveBeenCalled()
    expect(engine.filteredCtx.drawImage).toHaveBeenCalledWith(originalCanvas, 0, 0)
  })

  it('should update image and redraw', () => {
    const newImage = new Image()
    const redrawSpy = vi.spyOn(engine, 'redraw')
    engine.updateImage(newImage)

    expect(engine.originalImage).toBe(newImage)
    expect(redrawSpy).toHaveBeenCalled()
  })

  it('should set pan offset and redraw', () => {
    const redrawSpy = vi.spyOn(engine, 'redraw')
    engine.setPanOffset(10, 20)

    expect(engine.panOffset).toEqual({ x: 10, y: 20 })
    expect(redrawSpy).toHaveBeenCalled()
  })

  it('should calculate source rect for wide images in getImageData', () => {
    const tempCtx = document.createElement('canvas').getContext('2d')!
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(tempCtx.canvas)
    const drawImageSpy = vi.spyOn(tempCtx, 'drawImage')

    engine.getImageData(originalImage)

    expect(drawImageSpy).toHaveBeenCalledWith(originalImage, 240, 0, 1440, 1080, 0, 0, 800, 600)
    createElementSpy.mockRestore()
  })

  it('should calculate source rect for tall images in getImageData', () => {
    const tallImage = new Image()
    Object.defineProperties(tallImage, {
      naturalWidth: { value: 1080, configurable: true },
      naturalHeight: { value: 1920, configurable: true }
    })
    const tempCtx = document.createElement('canvas').getContext('2d')!
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(tempCtx.canvas)
    const drawImageSpy = vi.spyOn(tempCtx, 'drawImage')

    engine.getImageData(tallImage)

    expect(drawImageSpy).toHaveBeenCalledWith(tallImage, 0, 555, 1080, 810, 0, 0, 800, 600)
    createElementSpy.mockRestore()
  })

  it('should not redraw if container size is zero', () => {
    Object.defineProperty(sliderContainer, 'clientWidth', { value: 0 })
    const drawSpy = vi.spyOn(engine.originalCtx, 'drawImage')
    drawSpy.mockClear() // Clear calls from constructor

    engine.redraw()

    expect(drawSpy).not.toHaveBeenCalled()
  })

  it('should apply filter to transition frame if a filter is active', () => {
    engine.applyFilter('blur(5px)')
    const applyFilterSpy = vi.spyOn(engine as any, 'applyFilterToTransitionFrame')
    engine.renderSlideTransition(originalImage, new Image(), 0.5, 'next')
    expect(applyFilterSpy).toHaveBeenCalled()
  })

  it('should generate and shuffle pixel coordinates', () => {
    const coords = engine.generatePixelCoordinates()
    expect(coords.length).toBeGreaterThan(0)
    expect(coords[0]).toHaveProperty('x')
    expect(coords[0]).toHaveProperty('y')
    // It's hard to test randomness, but we can check if it's not sorted
    const isSorted = coords.every((c, i) => i === 0 || (c.y >= coords[i - 1].y && c.x >= coords[i - 1].x))
    expect(isSorted).toBe(false)
  })

  // Transition effects tests
  it('should call the correct slide transition function', () => {
    const spy = vi.spyOn(slideEffect, 'renderSlideTransition')
    engine.renderSlideTransition(originalImage, new Image(), 0.5, 'next')
    expect(spy).toHaveBeenCalled()
  })

  it('should call the correct blinds transition function', () => {
    const spy = vi.spyOn(blindsEffect, 'renderBlindsTransition')
    engine.renderBlindsTransition(originalImage, new Image(), 0.5, 'next')
    expect(spy).toHaveBeenCalled()
  })

  it('should call the correct dissolve transition function', () => {
    const spy = vi.spyOn(dissolveEffect, 'renderDissolveTransition')
    engine.renderDissolveTransition(originalImage, new Image(), 0.5)
    expect(spy).toHaveBeenCalled()
  })

  it('should call the correct wipe transition function', () => {
    const spy = vi.spyOn(wipeEffect, 'renderWipeTransition')
    engine.renderWipeTransition(originalImage, new Image(), 0.5)
    expect(spy).toHaveBeenCalled()
  })

  it('should call the correct wave transition function', () => {
    const spy = vi.spyOn(waveEffect, 'renderWaveTransition')
    engine.renderWaveTransition(originalImage, new Image(), 0.5, 'next')
    expect(spy).toHaveBeenCalled()
  })
})
