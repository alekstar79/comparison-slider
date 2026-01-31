import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderBlindsTransition } from '../../src/effects/blinds'
import type { FilterEngine } from '../../src/core/FilterEngine'

describe('renderBlindsTransition', () => {
  let engineMock: Partial<FilterEngine>
  let fromImg: HTMLImageElement
  let toImg: HTMLImageElement
  let originalCtxMock: any
  let filteredCtxMock: any

  beforeEach(() => {
    originalCtxMock = {
      save: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      restore: vi.fn()
    }
    filteredCtxMock = {
      save: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      restore: vi.fn()
    }

    engineMock = {
      originalCanvas: { width: 800, height: 600 } as HTMLCanvasElement,
      filteredCanvas: { width: 800, height: 600 } as HTMLCanvasElement,
      originalCtx: originalCtxMock,
      filteredCtx: filteredCtxMock,
      drawOnCanvas: vi.fn()
    }

    fromImg = new Image()
    toImg = new Image()
  })

  it('should draw blinds correctly for "next" direction', () => {
    const progress = 0.5
    const numBlinds = 10
    renderBlindsTransition(engineMock as FilterEngine, fromImg, toImg, progress, 'next')

    // Check initial draw
    expect(engineMock.drawOnCanvas).toHaveBeenCalledWith(originalCtxMock, fromImg)
    expect(engineMock.drawOnCanvas).toHaveBeenCalledWith(filteredCtxMock, fromImg)

    // Check that clipping and drawing happens for each blind
    expect(originalCtxMock.rect).toHaveBeenCalledTimes(numBlinds)
    expect(filteredCtxMock.rect).toHaveBeenCalledTimes(numBlinds)
    expect(originalCtxMock.clip).toHaveBeenCalledTimes(numBlinds)
    expect(filteredCtxMock.clip).toHaveBeenCalledTimes(numBlinds)
    
    // Check the parameters for the first blind
    const blindWidth = 800 / numBlinds
    const width = blindWidth * progress
    expect(originalCtxMock.rect).toHaveBeenCalledWith(0, 0, width, 600)
  })

  it('should draw blinds correctly for "prev" direction', () => {
    const progress = 0.5
    const numBlinds = 10
    renderBlindsTransition(engineMock as FilterEngine, fromImg, toImg, progress, 'prev')

    // Check the parameters for the first blind in "prev" direction
    const blindWidth = 800 / numBlinds
    const width = blindWidth * progress
    const x = (numBlinds - 1) * blindWidth
    const blindX = x + (blindWidth - width)
    expect(originalCtxMock.rect).toHaveBeenCalledWith(blindX, 0, width, 600)
  })
})
