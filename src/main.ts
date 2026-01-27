import { ComparisonSlider } from './core/ComparisonSlider'
import { defaultConfig } from './config' // Import the default configuration

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-comparison-slide]').forEach(img => {
    const slider = new ComparisonSlider(img as HTMLImageElement)
    
    // Initialize plugins from the configuration
    defaultConfig.plugins.forEach(PluginClass => {
      slider.addPlugin(new PluginClass(slider))
    })
  })
})
