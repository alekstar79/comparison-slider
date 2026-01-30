import { EventEmitter } from './core/EventEmitter'
import { FilterPlugin } from './plugins/FilterPlugin'
import { FullscreenPlugin } from './plugins/FullscreenPlugin'
import { ImagePanPlugin } from './plugins/ImagePanPlugin'
import { ImageSetPlugin } from './plugins/ImageSetPlugin'
import { LabelPlugin } from './plugins/LabelPlugin'
import { LoadImagePlugin } from './plugins/LoadImagePlugin'
import { MagnifierPlugin } from './plugins/MagnifierPlugin'
import { SavePlugin } from './plugins/SavePlugin'

export interface Plugin {
  initialize(): void;
  destroy?: () => void;
}

export interface ButtonPosition {
  bottom?: string;
  top?: string;
  left?: string;
  right?: string;
  transform?: string;
}

export interface UIButton {
  tag?: string;
  id?: string;
  class?: string;
  tip?: string;
  text?: string;
  iconSvg?: string;
  filterValue?: string;
}

export interface UIBlock {
  id: string;
  class?: string;
  position: ButtonPosition;
  direction: 'horizontal' | 'vertical';
  buttons: UIButton[];
}

export interface UIConfig {
  comparison: boolean;
  plugins: { new (slider: any, config: UIConfig, events: EventEmitter): Plugin }[];
  uiBlocks: UIBlock[];
  hoverToSlide?: boolean;
  imageSet?: {
    cyclic: boolean;
    autoplay: boolean;
    interval?: number;
    pauseOnHover?: boolean;
    transitionEffect?: 'slide' | 'blinds' | 'dissolve' | 'wipe' | 'wave';
  };
  labels?: {
    before: string;
    after: string;
  };
  magnifier: {
    button: string;
    size: number;
    defaultZoom: number;
    zoomLevels: number[];
  };
  pan?: {
    allowedRatioDeviation: number;
  };
  handle?: {
    gripIconSvg?: string;
  };
}

export const defaultConfig: UIConfig = {
  comparison: true,
  plugins: [
    FilterPlugin,
    FullscreenPlugin,
    ImagePanPlugin,
    ImageSetPlugin,
    LoadImagePlugin,
    MagnifierPlugin,
    SavePlugin,
    LabelPlugin,
  ],
  uiBlocks: [
    {
      id: 'filterPanel',
      position: { bottom: '0', left: '0', right: '0' },
      direction: 'horizontal',
      buttons: [] // Dynamically filled by FilterPlugin
    },
    {
      id: 'navButtons',
      class: 'image-set-nav',
      direction: 'horizontal',
      position: { top: '50%', transform: 'translateY(-50%)', left: '0', right: '0' },
      buttons: [
        {
          tag: 'button',
          class: 'nav-button prev',
          iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>',
          text: 'Prev',
          tip: 'Prev'
        },
        {
          tag: 'button',
          class: 'nav-button next',
          iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>',
          text: 'Next',
          tip: 'Next'
        }
      ]
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
        },
        {
          id: 'comparisonButton',
          iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 0 0-10-10C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10zm-10 8c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /><path d="M13 4.07a8.002 8.002 0 0 1 0 15.86V4.07z" /></svg>'
        }
      ]
    }
  ],
  hoverToSlide: false,
  imageSet: {
    cyclic: true,
    autoplay: true,
    interval: 3000,
    pauseOnHover: true,
    transitionEffect: 'slide' // 'blinds', 'dissolve', 'wipe', 'wave'
  },
  labels: {
    before: 'Original',
    after: 'Filtered'
  },
  magnifier: {
    button: '#magnifierButton',
    size: 180,
    defaultZoom: 2,
    zoomLevels: [1.5, 2, 3]
  },
  pan: {
    allowedRatioDeviation: 0.1
  },
  handle: {
    gripIconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M9 8L5 12l4 4M15 16l4-4-4-4"/></svg>'
  }
}
