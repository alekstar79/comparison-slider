import { ImageSetPlugin } from './plugins/ImageSetPlugin'
import { FilterPlugin } from './plugins/FilterPlugin'
import { FullscreenPlugin } from './plugins/FullscreenPlugin'
import { LoadImagePlugin } from './plugins/LoadImagePlugin'
import { SavePlugin } from './plugins/SavePlugin'

import { Plugin } from './core/ComparisonSlider'

export interface ButtonPosition {
  bottom?: string;
  top?: string;
  left?: string;
  right?: string;
  transform?: string;
}

export interface UIButton {
  id: string;
  text?: string;
  iconSvg?: string;
  filterValue?: string;
}

export interface UIBlock {
  id: string;
  position: ButtonPosition;
  direction: 'horizontal' | 'vertical';
  buttons: UIButton[];
}

export interface UIConfig {
  plugins: { new (slider: any, config: UIConfig): Plugin }[];
  uiBlocks: UIBlock[];
  imageSet?: {
    cyclic: boolean;
    autoplay: boolean;
    interval?: number;
    pauseOnHover?: boolean;
  }
}

export const defaultConfig: UIConfig = {
  plugins: [
    FilterPlugin,
    SavePlugin,
    FullscreenPlugin,
    LoadImagePlugin,
    ImageSetPlugin,
  ],
  uiBlocks: [
    {
      id: 'filterPanel',
      position: { bottom: '0', left: '0', right: '0' },
      direction: 'horizontal',
      buttons: [] // Dynamically filled by FilterPlugin
    },
    {
      id: 'actionButtons',
      position: { bottom: '10px', right: '10px' },
      direction: 'horizontal',
      buttons: [
        {
          id: 'uploadButton',
          iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>'
        },
        {
          id: 'saveButton',
          iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>'
        },
        {
          id: 'toggleButton',
          iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>'
        }
      ]
    },
    {
      id: 'featuresButtons',
      position: { top: '10px', right: '10px' },
      direction: 'vertical',
      buttons: [
        {
          id: 'fullscreenButton',
          iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 5v5h2V7h3V5H5zm9 0v2h3v3h2V5h-5zm-9 9v5h5v-2H7v-3H5zm9 5v-2h3v-3h2v5h-5z"/></svg>`
        }
      ]
    }
  ],
  imageSet: {
    cyclic: true,
    autoplay: true,
    interval: 2000,
    pauseOnHover: true,
  }
}
