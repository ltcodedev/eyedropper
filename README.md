


# @ltcode/eyedropper

> ⚠️ This library is in **alpha** version (`1.0.0-alpha`). APIs and behavior may change without notice.

JavaScript library for picking colors (EyeDropper) in web applications, compatible with all modern browsers, including Linux/Wayland environments.

## Installation
```sh
npm install @ltcode/eyedropper
```

## Usage
```js
import { EyeDropper } from '@ltcode/eyedropper';

const eyedropper = new EyeDropper();
eyedropper.open().then(color => {
	console.log('Selected color:', color.hex);
});
```

## Features
- Magnifier for pixel precision
- Color preview and HEX value
- Example images support for testing

## Picking color from any page region (with html2canvas)

You can use the [html2canvas](https://html2canvas.hertzen.com/) library to capture any part of the page as a canvas and allow color picking from any visible pixel:

```js
import html2canvas from 'html2canvas';
import EyeDropper from '@ltcode/eyedropper';

// Capture the entire screen or a specific element
html2canvas(document.body).then(canvas => {
	const eyedropper = new EyeDropper();
	eyedropper.open(canvas).then(color => {
		console.log(color.hex);
	});
});
```

This way, you can pick the color from any rendered element on the page, not just images!

## License
MIT
