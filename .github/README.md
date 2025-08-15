

# @ltcode/eyedropper

> ⚠️ This library is in **alpha** (`1.1.0`). APIs and behavior may change without notice.

An open source library for color picking (EyeDropper) in web applications, focused on cross-platform compatibility, especially for Linux/Wayland, where the native API is not supported.

## Purpose

Allow web developers to easily implement a color picker tool, with magnifier, color preview and HEX copy, without relying on browser or Electron native dependencies.

## Features
- Magnifier for precise pixel selection
- Color preview
- HEX value display and copy
- Example images support (for testing)
- Simple API for integration
- **NEW:** Automated mode - just pass image URL!

## Installation
```sh
npm install @ltcode/eyedropper
```

## Usage

### Manual Usage (with canvas)
```js
import EyeDropper from '@ltcode/eyedropper';

const eyedropper = new EyeDropper();
eyedropper.open(canvas).then(color => {
  console.log('Selected color:', color.hex);
});
```

### Automated Usage (with image URL)
```js
import EyeDropper from '@ltcode/eyedropper';

// Simple usage - just pass image URL
const eyedropper = new EyeDropper();
eyedropper.openFromImageUrl('https://example.com/image.jpg').then(color => {
  console.log('Selected color:', color.hex);
});

// With custom canvas options
eyedropper.openFromImageUrl('image.jpg', {}, {
  width: 500,
  height: 400,
  cover: true,
  position: { top: '20%', left: '20%' }
}).then(color => {
  console.log('Selected color:', color.hex);
});
```

## Contributing
Contributions are welcome! Check the [issues](https://github.com/ltcodedev/eyedropper/issues) and send your PR.

## License
MIT
