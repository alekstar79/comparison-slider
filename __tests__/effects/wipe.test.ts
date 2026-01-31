import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWipeTransition } from '../../src/effects/wipe'
import type { FilterEngine } from '../../src/core/FilterEngine'

describe('renderWipeTransition', () => {
  let engineMock: Partial<FilterEngine>
  let fromImg: HTMLImageElement
  let toImg: HTMLImageElement
  let originalCtxMock: any
  let filteredCtxMock: any

  beforeEach(() => {
    originalCtxMock = {
      save: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      clip: vi.fn(),
      restore: vi.fn()
    }
    filteredCtxMock = {
      save: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
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

  it('should draw both images and apply a circular clip to the new image', () => {
    const progress = 0.5
    renderWipeTransition(engineMock as FilterEngine, fromImg, toImg, progress)

    // 1. Check that the 'from' image is drawn first on both canvases
    expect(engineMock.drawOnCanvas).toHaveBeenCalledWith(originalCtxMock, fromImg)
    expect(engineMock.drawOnCanvas).toHaveBeenCalledWith(filteredCtxMock, fromImg)

    // 2. Check that the clipping path is created on both contexts
    expect(originalCtxMock.save).toHaveBeenCalled()
    expect(originalCtxMock.beginPath).toHaveBeenCalled()
    expect(originalCtxMock.arc).toHaveBeenCalled()
    expect(originalCtxMock.clip).toHaveBeenCalled()
    expect(originalCtxMock.restore).toHaveBeenCalled()

    expect(filteredCtxMock.save).toHaveBeenCalled()
    expect(filteredCtxMock.beginPath).toHaveBeenCalled()
    expect(filteredCtxMock.arc).toHaveBeenCalled()
    expect(filteredCtxMock.clip).toHaveBeenCalled()
    expect(filteredCtxMock.restore).toHaveBeenCalled()

    // 3. Check that the 'to' image is drawn after the clip on both canvases
    expect(engineMock.drawOnCanvas).toHaveBeenCalledWith(originalCtxMock, toImg)
    expect(engineMock.drawOnCanvas).toHaveBeenCalledWith(filteredCtxMock, toImg)

    // 4. Verify the parameters of the arc
    const centerX = 800 / 2
    const centerY = 600 / 2
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY)
    const currentRadius = maxRadius * progress
    
    expect(originalCtxMock.arc).toHaveBeenCalledWith(centerX, centerY, currentRadius, 0, 2 * Math.PI)
    expect(filteredCtxMock.arc).toHaveBeenCalledWith(centerX, centerY, currentRadius, 0, 2 * Math.PI)
  })
})
