import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderSlideTransition } from '../../src/effects/slide'
import type { FilterEngine } from '../../src/core/FilterEngine'

describe('renderSlideTransition', () => {
  let engineMock: Partial<FilterEngine>
  let fromImg: HTMLImageElement
  let toImg: HTMLImageElement

  beforeEach(() => {
    const canvasMock = {
      width: 800,
      height: 600
    } as HTMLCanvasElement

    engineMock = {
      originalCanvas: canvasMock,
      filteredCanvas: canvasMock,
      originalCtx: {
        clearRect: vi.fn()
      } as any,
      filteredCtx: {
        clearRect: vi.fn()
      } as any,
      drawOnCanvas: vi.fn()
    }

    fromImg = new Image()
    toImg = new Image()
  })

  it('should draw images with correct offsets for "next" direction', () => {
    const progress = 0.5
    renderSlideTransition(engineMock as FilterEngine, fromImg, toImg, progress, 'next')

    // Check clears
    expect(engineMock.originalCtx!.clearRect).toHaveBeenCalledWith(0, 0, 800, 600)
    expect(engineMock.filteredCtx!.clearRect).toHaveBeenCalledWith(0, 0, 800, 600)

    // Check draw calls
    expect(engineMock.drawOnCanvas).toHaveBeenCalledTimes(4)

    // fromImg should have a negative offset
    const fromOffset = -progress * engineMock.originalCanvas!.width
    expect(engineMock.drawOnCanvas).toHaveBeenCalledWith(expect.any(Object), fromImg, fromOffset)

    // toImg should have a positive offset
    const toOffset = (1 - progress) * engineMock.originalCanvas!.width
    expect(engineMock.drawOnCanvas).toHaveBeenCalledWith(expect.any(Object), toImg, toOffset)
  })

  it('should draw images with correct offsets for "prev" direction', () => {
    const progress = 0.5
    renderSlideTransition(engineMock as FilterEngine, fromImg, toImg, progress, 'prev')

    // fromImg should have a positive offset
    const fromOffset = progress * engineMock.originalCanvas!.width
    expect(engineMock.drawOnCanvas).toHaveBeenCalledWith(expect.any(Object), fromImg, fromOffset)

    // toImg should have a negative offset
    const toOffset = -(1 - progress) * engineMock.originalCanvas!.width
    expect(engineMock.drawOnCanvas).toHaveBeenCalledWith(expect.any(Object), toImg, toOffset)
  })
})
