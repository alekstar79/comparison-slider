import { FilterEngine } from '../core/FilterEngine'

export function renderBlindsTransition(
  engine: FilterEngine,
  fromImg: HTMLImageElement,
  toImg: HTMLImageElement,
  progress: number,
  direction: 'next' | 'previous'
) {
  const numBlinds = 10
  const blindWidth = engine.originalCanvas.width / numBlinds

  engine.drawOnCanvas(engine.originalCtx, fromImg)
  engine.drawOnCanvas(engine.filteredCtx, fromImg)

  for (let i = 0; i < numBlinds; i++) {
    const x = direction === 'next' ? i * blindWidth : (numBlinds - 1 - i) * blindWidth
    const width = blindWidth * progress
    const blindX = direction === 'next' ? x : x + (blindWidth - width)

    engine.originalCtx.save()
    engine.originalCtx.beginPath()
    engine.originalCtx.rect(blindX, 0, width, engine.originalCanvas.height)
    engine.originalCtx.clip()
    engine.drawOnCanvas(engine.originalCtx, toImg)
    engine.originalCtx.restore()

    engine.filteredCtx.save()
    engine.filteredCtx.beginPath()
    engine.filteredCtx.rect(blindX, 0, width, engine.filteredCanvas.height)
    engine.filteredCtx.clip()
    engine.drawOnCanvas(engine.filteredCtx, toImg)
    engine.filteredCtx.restore()
  }
}
