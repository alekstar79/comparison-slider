import '@/styles/style.css'
import '@/styles/FilterPlugin.css'
import '@/styles/LabelPlugin.css'
import '@/styles/MagnifierPlugin.css'
import '@/styles/SavePlugin.css'

import { FilterPlugin } from '@/plugins/FilterPlugin'
import { FullscreenPlugin } from '@/plugins/FullscreenPlugin'
import { ImagePanPlugin } from '@/plugins/ImagePanPlugin'
import { ImageSetPlugin } from '@/plugins/ImageSetPlugin'
import { LabelPlugin } from '@/plugins/LabelPlugin'
import { LoadImagePlugin } from '@/plugins/LoadImagePlugin'
import { MagnifierPlugin } from '@/plugins/MagnifierPlugin'
import { SavePlugin } from '@/plugins/SavePlugin'

import { ComparisonSlider } from './core/ComparisonSlider'
import { defaultConfig } from './config'

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll<HTMLImageElement>('[data-comparison-slide]')
    .forEach(async (img) => {
      try {
        const slider = new ComparisonSlider(img, defaultConfig)

        slider.use(new FilterPlugin(slider, slider.config, slider.events))
        slider.use(new FullscreenPlugin(slider, slider.config, slider.events))
        slider.use(new ImagePanPlugin(slider, slider.config, slider.events))
        slider.use(new ImageSetPlugin(slider, slider.config, slider.events))
        slider.use(new LabelPlugin(slider, slider.config, slider.events))
        slider.use(new LoadImagePlugin(slider, slider.config, slider.events))
        slider.use(new MagnifierPlugin(slider, slider.config, slider.events))
        slider.use(new SavePlugin(slider, slider.config, slider.events))

        await slider.mount()
      } catch (e) {
        console.error(e)
      }
    })
})
