import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWaveTransition } from '../../src/effects/wave'
import type { FilterEngine } from '../../src/core/FilterEngine'

describe('renderWaveTransition', () => {
  let engineMock: Partial<FilterEngine>
  let fromImg: HTMLImageElement
  let toImg: HTMLImageElement
  let fromData: ImageData
  let toData: ImageData
  let newData: ImageData

  beforeEach(() => {
    fromData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(400).fill(1) // 'from' is all 1s
    }
    toData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(400).fill(10) // 'to' is all 10s
    }
    newData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(400).fill(0) // 'new' is all 0s
    }

    engineMock = {
      getImageData: vi.fn((img: HTMLImageElement) => (img === fromImg ? fromData : toData)),
      originalCtx: {
        createImageData: vi.fn().mockReturnValue(newData),
        putImageData: vi.fn()
      } as any,
      filteredCtx: {
        putImageData: vi.fn()
      } as any
    }

    fromImg = new Image()
    toImg = new Image()
  })

  it('should call putImageData on both contexts', () => {
    renderWaveTransition(engineMock as FilterEngine, fromImg, toImg, 0.5, 'next')
    expect(engineMock.originalCtx!.putImageData).toHaveBeenCalledWith(newData, 0, 0)
    expect(engineMock.filteredCtx!.putImageData).toHaveBeenCalledWith(newData, 0, 0)
  })

  it('should blend pixels using subarray set', () => {
    const setSpy = vi.spyOn(newData.data, 'set')
    
    renderWaveTransition(engineMock as FilterEngine, fromImg, toImg, 0.5, 'next')

    // Check that we are trying to set pixel data from both sources
    expect(setSpy).toHaveBeenCalled()
    
    // Check one of the calls to ensure it's using a subarray from one of the sources
    const firstCall = setSpy.mock.calls[0][0] as Uint8ClampedArray
    // The value should be 1 (from fromData) or 10 (from toData)
    expect([1, 10]).toContain(firstCall[0])
  })

  it('should handle "next" and "prev" directions differently', () => {
    const setSpyNext = vi.spyOn(newData.data, 'set')
    renderWaveTransition(engineMock as FilterEngine, fromImg, toImg, 0.1, 'next')
    const nextCallArgs = setSpyNext.mock.calls
    setSpyNext.mockClear()

    const setSpyPrev = vi.spyOn(newData.data, 'set')
    renderWaveTransition(engineMock as FilterEngine, fromImg, toImg, 0.1, 'prev')
    const prevCallArgs = setSpyPrev.mock.calls

    // The arguments passed to .set() should be different for next and prev directions
    // This is a simple way to check that the direction logic has an effect
    expect(nextCallArgs).not.toEqual(prevCallArgs)
  })
})
