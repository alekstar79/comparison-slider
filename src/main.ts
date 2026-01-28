import { ComparisonSlider } from './core/ComparisonSlider'
import { defaultConfig } from './config'
import { FilterPlugin } from './plugins/FilterPlugin'
import { SavePlugin } from './plugins/SavePlugin'

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-comparison-slide]').forEach(img => {
    const slider = new ComparisonSlider(img as HTMLImageElement, defaultConfig)

    // Initialize plugins from the configuration
    defaultConfig.plugins.forEach(PluginClass => {
      slider.addPlugin(new PluginClass(slider, defaultConfig))
    })
  })
})
