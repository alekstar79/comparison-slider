import { SavePlugin } from './plugins/SavePlugin'
import { Plugin } from './core/ComparisonSlider'

interface ButtonPosition {
  bottom?: string;
  top?: string;
  left?: string;
  right?: string;
  transform?: string;
}

export interface UIConfig {
  plugins: { new (slider: any): Plugin }[]; // Array of plugin classes
  buttonPositions: {
    uiToggleButton: ButtonPosition;
    saveButton: ButtonPosition;
    // Add other buttons here as needed
  };
}

export const defaultConfig: UIConfig = {
  plugins: [
    SavePlugin, // SavePlugin will be initialized if present here
  ],
  buttonPositions: {
    uiToggleButton: { bottom: '10px', right: '10px' },
    saveButton: { bottom: '10px', right: '60px' }, // Example position for save button
  },
};
