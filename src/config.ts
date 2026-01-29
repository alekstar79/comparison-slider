import { ImageSetPlugin } from './plugins/ImageSetPlugin'
import { FilterPlugin } from './plugins/FilterPlugin'
import { FullscreenPlugin } from './plugins/FullscreenPlugin'
import { LoadImagePlugin } from './plugins/LoadImagePlugin'
import { SavePlugin } from './plugins/SavePlugin'
import { MagnifierPlugin } from './plugins/MagnifierPlugin'
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
  magnifier: {
    button: string;
    size: number;
    zoom: number;
  };
  imageSet?: {
    cyclic: boolean;
    autoplay: boolean;
    interval?: number;
    pauseOnHover?: boolean;
    transitionEffect?: 'slide' | 'blinds' | 'dissolve' | 'wipe' | 'wave';
  }
}

export const defaultConfig: UIConfig = {
  plugins: [
    FilterPlugin,
    SavePlugin,
    FullscreenPlugin,
    LoadImagePlugin,
    ImageSetPlugin,
    MagnifierPlugin,
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
          iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 5v5h2V7h3V5H5zm9 0v2h3v3h2V5h-5zm-9 9v5h5v-2H7v-3H5zm9 5v-2h3v-3h2v5h-5z"/></svg>'
        },
        {
          id: 'magnifierButton',
          iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>'
        }
      ]
    }
  ],
  magnifier: {
    button: '#magnifierButton',
    size: 150,
    zoom: 2,
  },
  imageSet: {
    cyclic: true,
    autoplay: true,
    interval: 3000,
    pauseOnHover: true,
    transitionEffect: 'slide',
  }
}
