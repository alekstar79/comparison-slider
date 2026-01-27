import { ComparisonSlider } from './ComparisonSlider'
import { SavePlugin } from './plugins/SavePlugin'

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-comparison-slide]').forEach(img => {
    const slider = new ComparisonSlider(img as HTMLImageElement)
    
    // Add the SavePlugin to this slider instance
    slider.addPlugin(new SavePlugin(slider))
  })
})
