

# @ltcode/eyedropper

> ⚠️ This library is in **alpha** version (`1.0.0-alpha`). APIs and behavior may change without notice.

An open source library for color picking (EyeDropper) in web applications, focused on cross-platform compatibility, especially for Linux/Wayland, where the native API is not supported.

## Purpose

Allow web developers to easily implement a color picker tool, with magnifier, color preview and HEX copy, without relying on browser or Electron native dependencies.

## Features
- Magnifier for precise pixel selection
- Color preview
- HEX value display and copy
- Example images support (for testing)
- Simple API for integration

## Installation
```sh
npm install @ltcode/eyedropper
```

## Basic Usage
```js
import { EyeDropper } from '@ltcode/eyedropper';

const eyedropper = new EyeDropper();
eyedropper.open().then(color => {
  console.log('Selected color:', color.hex);
});
```

## Contributing
Contributions are welcome! Check the [issues](https://github.com/ltcodedev/eyedropper/issues) and send your PR.

## License
MIT
