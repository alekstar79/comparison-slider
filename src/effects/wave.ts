import { FilterEngine } from '../core/FilterEngine'

export function renderWaveTransition(
  engine: FilterEngine,
  fromImg: HTMLImageElement,
  toImg: HTMLImageElement,
  progress: number,
  direction: 'next' | 'previous'
) {
  const fromData = engine.getImageData(fromImg)
  const toData = engine.getImageData(toImg)
  const newData = engine.originalCtx.createImageData(fromData.width, fromData.height)
  const width = fromData.width
  const height = fromData.height

  const waveAmplitude = 20
  const waveFrequency = 30
  const waveSpeed = 15

  for (let y = 0; y < height; y++) {
    const waveOffset = Math.sin(y / waveFrequency + progress * waveSpeed) * waveAmplitude
    let transitionPoint = progress * (width + waveAmplitude * 2) - waveAmplitude

    if (direction === 'next') { // Inverted the logic here
      transitionPoint = width - transitionPoint
    }

    const threshold = Math.round(transitionPoint + waveOffset)
    const pixelIndex = (y * width) * 4
    const fromStart = pixelIndex + Math.max(0, threshold) * 4
    const fromEnd = pixelIndex + width * 4
    const toStart = pixelIndex
    const toEnd = pixelIndex + Math.min(width, threshold) * 4

    if (direction === 'previous') {
      if (fromStart < fromEnd) newData.data.set(fromData.data.subarray(fromStart, fromEnd), fromStart)
      if (toStart < toEnd) newData.data.set(toData.data.subarray(toStart, toEnd), toStart)
    } else {
      if (fromStart < fromEnd) newData.data.set(toData.data.subarray(fromStart, fromEnd), fromStart)
      if (toStart < toEnd) newData.data.set(fromData.data.subarray(toStart, toEnd), toStart)
    }
  }

  engine.originalCtx.putImageData(newData, 0, 0)
  engine.filteredCtx.putImageData(newData, 0, 0)
}
