import { FilterEngine } from '../core/FilterEngine'

export function renderWipeTransition(
  engine: FilterEngine,
  fromImg: HTMLImageElement,
  toImg: HTMLImageElement,
  progress: number
) {
  const centerX = engine.originalCanvas.width / 2
  const centerY = engine.originalCanvas.height / 2
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY)
  const currentRadius = maxRadius * progress

  engine.drawOnCanvas(engine.originalCtx, fromImg)
  engine.drawOnCanvas(engine.filteredCtx, fromImg)

  engine.originalCtx.save()
  engine.originalCtx.beginPath()
  engine.originalCtx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI)
  engine.originalCtx.clip()
  engine.drawOnCanvas(engine.originalCtx, toImg)
  engine.originalCtx.restore()

  engine.filteredCtx.save()
  engine.filteredCtx.beginPath()
  engine.filteredCtx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI)
  engine.filteredCtx.clip()
  engine.drawOnCanvas(engine.filteredCtx, toImg)
  engine.filteredCtx.restore()
}
