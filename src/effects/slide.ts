import { FilterEngine } from '../core/FilterEngine'

export function renderSlideTransition(
  engine: FilterEngine,
  fromImg: HTMLImageElement,
  toImg: HTMLImageElement,
  progress: number,
  direction: 'next' | 'previous'
) {
  const d = direction === 'next' ? 1 : -1
  const fromOffset = -progress * engine.originalCanvas.width * d
  const toOffset = (engine.originalCanvas.width - progress * engine.originalCanvas.width) * d

  engine.originalCtx.clearRect(0, 0, engine.originalCanvas.width, engine.originalCanvas.height)
  engine.drawOnCanvas(engine.originalCtx, fromImg, fromOffset)
  engine.drawOnCanvas(engine.originalCtx, toImg, toOffset)

  engine.filteredCtx.clearRect(0, 0, engine.filteredCanvas.width, engine.filteredCanvas.height)
  engine.drawOnCanvas(engine.filteredCtx, fromImg, fromOffset)
  engine.drawOnCanvas(engine.filteredCtx, toImg, toOffset)
}
