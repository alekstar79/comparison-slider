# ✨ Comparison Slider TS

[![NPM Version](https://img.shields.io/npm/v/comparison-slider.svg)](https://www.npmjs.com/package/@alekstar79/comparison-slider)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![GitHub](https://img.shields.io/badge/github-repo-green.svg?style=flat)](https://github.com/alekstar79/comparison-slider)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square)](https://www.typescriptlang.org)
[![Coverage](https://img.shields.io/badge/coverage-97.76%25-brightgreen.svg)](https://github.com/alekstar79/comparison-slider)

**Comparison Slider TS** is a powerful, modern, and highly customizable TypeScript library that seamlessly combines the functionality of an image comparison slider with a feature-rich image gallery. Built with TypeScript and a flexible plugin architecture, it's designed for performance, extensibility, and a superior user experience.

This is not just another before-and-after slider. It's a comprehensive toolkit for interactive image presentation, allowing you to compare, filter, magnify, and navigate through image sets with smooth, hardware-accelerated effects.

**[View Live Demo](https://alekstar79.github.io/comparison-slider)**

---

## 📖 Table of Contents

<!-- TOC -->
* [✨ Comparison Slider TS](#-comparison-slider-ts)
  * [📖 Table of Contents](#-table-of-contents)
  * [🌟 Core Concepts](#-core-concepts)
  * [🚀 Getting Started](#-getting-started)
    * [Installation](#installation)
    * [Importing Styles](#importing-styles)
    * [HTML Setup](#html-setup)
    * [Initialization](#initialization)
  * [⚙️ Configuration](#-configuration)
    * [Via Object](#via-object)
    * [Via `data-` Attributes](#via-data--attributes)
    * [Detailed Configuration Options](#detailed-configuration-options)
  * [🔌 Plugins API](#-plugins-api)
  * [🎨 Transition Effects](#-transition-effects)
  * [👨‍💻 API Reference](#-api-reference)
    * [`new ComparisonSlider(image, config)`](#new-comparisonsliderimage-config)
    * [`.mount()`](#mount)
    * [`.updateImage(newImage, reset)`](#updateimagenewimage-reset)
    * [`.toggleComparisonView()`](#togglecomparisonview)
    * [`.use(plugin)`](#useplugin)
  * [🤝 Contributing](#-contributing)
    * [Development Setup](#development-setup)
  * [📜 License](#-license)
<!-- TOC -->

---

## 🌟 Core Concepts

1.  **Hybrid Engine**: The library can function as a classic two-image comparison tool or as a multi-image gallery, or both at the same time. This is controlled by the `comparison` and `data-imgset` options.
2.  **Plugin-Driven Architecture**: Core features like the magnifier, image set navigation, and panning are implemented as independent plugins. This keeps the core light and allows you to bundle only the functionality you need.
3.  **Canvas Rendering**: Instead of manipulating DOM elements, the library renders images onto an HTML5 Canvas. This enables high-performance pixel-level effects, transitions, and filtering that are impossible with standard `<img>` tags.
4.  **Declarative and Imperative Configuration**: Configure everything declaratively via `data-` attributes in your HTML for simplicity, or use a detailed JavaScript object for maximum control and type safety.

---

## 🚀 Getting Started

### Installation

Install the package from the npm registry:

```bash
npm install @alekstar79/comparison-slider

# or

yarn add @alekstar79/comparison-slider
```

### Importing Styles

The library requires a core stylesheet and optional stylesheets for each plugin you use.

```typescript
// Import core styles
import '@alekstar79/comparison-slider-ts/styles/core.css'

// Import styles for the plugins you are using
import '@alekstar79/comparison-slider-ts/styles/ImageSetPlugin.css'
import '@alekstar79/comparison-slider-ts/styles/MagnifierPlugin.css'
// ... and so on for other plugins
```

### HTML Setup

The slider is initialized from a standard `<img>` element. The library will replace it with the full slider component.

```html
<!-- Basic Usage -->
<img id="my-slider" src="images/before.jpg" alt="Before and After" />

<!-- Comparison Slider -->
<img
  src="./images/l1.jpg"
  class="slider-large"
  data-comparison-slide
  data-action-buttons="{ top: '50%', transform: 'translateY(-50%)', left: '10px' }"
  data-features-buttons="{ top: '50%', transform: 'translateY(-50%)', right: '10px' }"
  data-action-buttons-direction="vertical"
  data-features-buttons-direction="vertical"
  data-direction="vertical"
  data-init-x="300"
  data-init-y="150"
  data-filters="all"
  alt="Before and After"
>

<!-- Image Gallery Slider -->
<img
  class="slider-large"
  data-imgset="./images/img1.jpg,./images/img2.jpg,./images/img3.jpg,./images/img4.jpg"
  data-comparison-slide
  data-direction="vertical"
  data-filters="all"
  data-init-x="200"
  data-init-y="300"
  alt="My Awesome Gallery"
  src=""
>
```

### Initialization

Import the `ComparisonSlider` class, create a new instance with your image element and a configuration object, and then call `.mount()`.

```typescript
import { ComparisonSlider, defaultConfig } from '@alekstar79/comparison-slider'

const imageElement = document.getElementById('my-slider')

// You can start with the defaultConfig and override properties
const myConfig = JSON.parse(JSON.stringify(defaultConfig))
myConfig.hoverToSlide = true
myConfig.magnifier.defaultZoom = 3

// Create and mount the slider
const slider = new ComparisonSlider(imageElement, myConfig)
slider.mount()
```

---

## ⚙️ Configuration

You have two ways to configure the slider, which can be used together.

### Via Object

This is the most powerful method, giving you access to all options with full type-safety if you're using TypeScript.

```typescript
const slider = new ComparisonSlider(imageElement, {
  ...defaultConfig,
  direction: 'vertical',
  imageSet: {
    ...defaultConfig.imageSet,
    autoplay: true,
  }
})
```

### Via `data-` Attributes

For quick setup, most configuration options can be set directly in HTML. The library automatically parses these attributes.

-   **Simple values**: `data-direction="vertical"`
-   **Nested values**: Use kebab-case for nested properties. `data-image-set-autoplay="true"`
-   **Complex objects**: For properties that are objects (like UI block positions), pass a JavaScript-like object string.

    ```html
    <img
      id="my-slider"
      src="images/before.jpg"
      data-action-buttons="{ top: '50%', left: '1rem', transform: 'translateY(-50%)' }"
      data-nav-buttons-direction="vertical"
      alt=""
    />
    ```

### Detailed Configuration Options

Below is a comprehensive list of all available options found in the [defaultConfig](/src/config.ts).

| Property                    | Type        | Default        | `data-` Attribute                  | Description                                                                                    |
|:----------------------------|:------------|:---------------|:-----------------------------------|:-----------------------------------------------------------------------------------------------|
| `comparison`                | `boolean`   | `true`         | `data-comparison`                  | Enables the core before/after comparison functionality.                                        |
| `hoverToSlide`              | `boolean`   | `false`        | `data-hover-to-slide`              | If `true`, the handle follows the mouse without clicking.                                      |
| `direction`                 | `string`    | `'horizontal'` | `data-direction`                   | Orientation of the slider: `'horizontal'` or `'vertical'`.                                     |
| `labels.before`             | `string`    | `'Before'`     | `data-labels-before`               | Text for the "before" label.                                                                   |
| `labels.after`              | `string`    | `'After'`      | `data-labels-after`                | Text for the "after" label.                                                                    |
| `labels.position`           | `string`    | `'top-left'`   | `data-labels-position`             | Position of the labels.                                                                        |
| `imageSet.autoplay`         | `boolean`   | `false`        | `data-image-set-autoplay`          | Enables automatic transitioning between images in a set.                                       |
| `imageSet.interval`         | `number`    | `5000`         | `data-image-set-interval`          | Time in milliseconds between transitions in autoplay mode.                                     |
| `imageSet.pauseOnHover`     | `boolean`   | `false`        | `data-image-set-pause-on-hover`    | Pauses autoplay when the mouse is over the slider.                                             |
| `imageSet.cyclic`           | `boolean`   | `false`        | `data-image-set-cyclic`            | Allows navigation to loop from the last image to the first.                                    |
| `imageSet.transitionEffect` | `string`    | `'slide'`      | `data-image-set-transition-effect` | The animation effect to use. See [Transition Effects](#-transition-effects).                   |
| `imageSet.duration`         | `number`    | `1000`         | `data-image-set-duration`          | Duration of the transition effect in milliseconds.                                             |
| `magnifier.enabled`         | `boolean`   | `true`         | `data-magnifier-enabled`           | Enables the magnifier plugin.                                                                  |
| `magnifier.size`            | `number`    | `180`          | `data-magnifier-size`              | Diameter of the magnifier circle in pixels.                                                    |
| `magnifier.defaultZoom`     | `number`    | `2`            | `data-magnifier-default-zoom`      | The initial zoom level.                                                                        |
| `magnifier.zoomLevels`      | `number[]`  | `[2, 3, 4]`    | `data-magnifier-zoom-levels`       | Array of available zoom levels in the panel.                                                   |
| `uiBlocks`                  | `UIBlock[]` | *(array)*      | `data-[block-id]`                  | Defines the layout of UI elements. See [SliderHtmlBuilder.ts](/src/core/SliderHtmlBuilder.ts). |

---

## 🔌 Plugins API

The plugin architecture is the heart of the library's extensibility. Each plugin is a class that hooks into the slider's lifecycle to add new functionality. They are initialized automatically by the main `ComparisonSlider` class.

-   **[`ImageSetPlugin`](/src/plugins/ImageSetPlugin.ts)**: Manages image galleries defined by `data-imgset`. It handles navigation (next/prev), autoplay, and orchestrates the transition effects between images.

-   **[`MagnifierPlugin`](/src/plugins/MagnifierPlugin.ts)**: Adds an interactive magnifying glass. It creates a separate canvas that follows the cursor, rendering a zoomed-in portion of the main canvas, including any applied filters and UI elements.

-   **[`FilterPlugin`](/src/plugins/FilterPlugin.ts)**: Manages the filter selection UI. It dynamically adds/removes an "Original" filter button when switching between comparison and single-view modes and ensures the correct filter is applied.

-   **[`ImagePanPlugin`](/src/plugins/ImagePanPlugin.ts)**: Automatically detects if the source image has a different aspect ratio than the container. If so, it enables panning by clicking and dragging on the image, allowing users to explore the entire image.

-   **[`SavePlugin`](/src/plugins/SavePlugin.ts)**: Adds a "Save" button. When clicked, it creates a new temporary canvas, redraws the current image with any active filters applied, and triggers a browser download of the resulting image.

-   **[`FullscreenPlugin`](/src/plugins/FullscreenPlugin.ts)**: Provides a button to toggle the slider's container into and out of the browser's fullscreen mode.

-   **[`LabelPlugin`](/src/plugins/LabelPlugin.ts)**: Manages the visibility and positioning of the "Before" and "After" labels, ensuring they are correctly clipped as the handle moves.

---

## 🎨 Transition Effects

When using the `ImageSetPlugin`, you can choose from several visually impressive transition effects.

| Effect         | Description                                                                          |
|:---------------|:-------------------------------------------------------------------------------------|
| **`slide`**    | The new image slides in smoothly over the old one.                                   |
| **`dissolve`** | A cross-fade effect where the old image dissolves into the new one.                  |
| **`blinds`**   | The new image is revealed through a series of animated vertical or horizontal slats. |
| **`wipe`**     | A classic directional wipe transition.                                               |
| **`wave`**     | A modern, GLSL-powered wave distortion effect that ripples across the image.         |

---

## 👨‍💻 API Reference

While most functionality can be controlled via the configuration object, the `ComparisonSlider` instance provides several public methods for imperative control.

### `new ComparisonSlider(image, config)`

Creates a new slider instance.
-   `image`: The `HTMLImageElement` to enhance.
-   `config`: A configuration object to override the defaults.

### `.mount()`

Initializes all plugins, builds the required DOM structure, and replaces the original `<img>` element. This method is asynchronous and returns a `Promise` that resolves when the initial image is fully loaded and the slider is ready.

### `.updateImage(newImage, reset)`

Updates the slider with a new source image.
-   `newImage`: An `HTMLImageElement` or a URL `string` for the new image.
-   `reset`: A `boolean` (`true` by default). If `true`, resets the handle to its initial position.

### `.toggleComparisonView()`

Programmatically toggles the comparison view on or off.

### `.use(plugin)`

Registers a custom plugin with the slider instance. This allows for extending the slider with your own functionality.

---

## 🤝 Contributing

Contributions are highly welcome! If you find a bug, have a feature request, or want to improve the documentation, please open an issue or submit a pull request.

### Development Setup

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Start the development server: `npm run dev`
4.  Run tests: `npm test`

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
