import { FilterEngine } from '../core/FilterEngine'

export function renderDissolveTransition(
  engine: FilterEngine,
  fromImg: HTMLImageElement,
  toImg: HTMLImageElement,
  progress: number
) {
  if (!engine.pixelCoordinates) {
    engine.pixelCoordinates = engine.generatePixelCoordinates()
  }

  const fromData = (engine as any).getImageData(fromImg)
  const toData = (engine as any).getImageData(toImg)
  const newData = engine.originalCtx.createImageData(fromData.width, fromData.height)

  const numPixelsToDissolve = Math.floor(engine.pixelCoordinates!.length * progress)

  for (let i = 0; i < engine.pixelCoordinates!.length; i++) {
    const { x, y } = engine.pixelCoordinates![i]
    const pixelIndex = (y * fromData.width + x) * 4

    const sourceData = i < numPixelsToDissolve ? toData.data : fromData.data

    newData.data[pixelIndex] = sourceData[pixelIndex]
    newData.data[pixelIndex + 1] = sourceData[pixelIndex + 1]
    newData.data[pixelIndex + 2] = sourceData[pixelIndex + 2]
    newData.data[pixelIndex + 3] = sourceData[pixelIndex + 3]
  }

  engine.originalCtx.putImageData(newData, 0, 0)
  engine.filteredCtx.putImageData(newData, 0, 0)
}
