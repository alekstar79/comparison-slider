import { ComparisonSlider } from './core/ComparisonSlider'
import { defaultConfig } from './config'

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-comparison-slide]').forEach(img => {
    const slider = new ComparisonSlider(img as HTMLImageElement, defaultConfig)

    // Initialize plugins from the configuration
    defaultConfig.plugins.forEach(PluginClass => {
      slider.addPlugin(new PluginClass(slider, defaultConfig))
    })
  })
})
