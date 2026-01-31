import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderDissolveTransition } from '../../src/effects/dissolve'
import type { FilterEngine } from '../../src/core/FilterEngine'

describe('renderDissolveTransition', () => {
  let engineMock: Partial<FilterEngine>
  let fromImg: HTMLImageElement
  let toImg: HTMLImageElement

  beforeEach(() => {
    const mockImageData = {
      width: 1,
      height: 2,
      data: new Uint8ClampedArray([
        1, 1, 1, 255, // Pixel 1 (from)
        2, 2, 2, 255  // Pixel 2 (from)
      ])
    }

    engineMock = {
      pixelCoordinates: null,
      generatePixelCoordinates: vi.fn().mockReturnValue([{ x: 0, y: 0 }, { x: 0, y: 1 }]),
      getImageData: vi.fn((img: HTMLImageElement) => {
        if (img === toImg) {
          // Return different data for the 'to' image
          return { ...mockImageData, data: new Uint8ClampedArray([10, 10, 10, 255, 20, 20, 20, 255]) }
        }
        return mockImageData
      }),
      originalCtx: {
        createImageData: vi.fn().mockImplementation((w, h) => ({
          width: w,
          height: h,
          data: new Uint8ClampedArray(w * h * 4)
        })),
        putImageData: vi.fn()
      } as any,
      filteredCtx: {
        putImageData: vi.fn()
      } as any
    }

    fromImg = new Image()
    toImg = new Image()
  })

  it('should generate pixel coordinates if not already present', () => {
    renderDissolveTransition(engineMock as FilterEngine, fromImg, toImg, 0.5)
    expect(engineMock.generatePixelCoordinates).toHaveBeenCalled()
  })

  it('should not generate pixel coordinates if they exist', () => {
    engineMock.pixelCoordinates = [{ x: 0, y: 0 }]
    renderDissolveTransition(engineMock as FilterEngine, fromImg, toImg, 0.5)
    expect(engineMock.generatePixelCoordinates).not.toHaveBeenCalled()
  })

  it('should correctly blend pixels based on progress', () => {
    const progress = 0.5 // This means 1 out of 2 pixels should be from the 'to' image
    renderDissolveTransition(engineMock as FilterEngine, fromImg, toImg, progress)

    const putImageDataSpy = engineMock.originalCtx!.putImageData as any
    expect(putImageDataSpy).toHaveBeenCalled()

    const newData = putImageDataSpy.mock.calls[0][0].data
    
    // First pixel should be from 'toImg' (value 10)
    expect(newData[0]).toBe(10)
    // Second pixel should be from 'fromImg' (value 2)
    expect(newData[4]).toBe(2)
  })

  it('should call putImageData on both contexts', () => {
    renderDissolveTransition(engineMock as FilterEngine, fromImg, toImg, 0.5)
    expect(engineMock.originalCtx!.putImageData).toHaveBeenCalled()
    expect(engineMock.filteredCtx!.putImageData).toHaveBeenCalled()
  })
})
