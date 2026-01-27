import { ComparisonSlider } from './ComparisonSlider'

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-comparison-slide]')
    .forEach(img => {
      new ComparisonSlider(img as HTMLImageElement)
    })
})
