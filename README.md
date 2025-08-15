


# @ltcode/eyedropper

> ⚠️ This library is in **alpha** (`1.2.0`). APIs and behavior may change without notice.

JavaScript library for picking colors (EyeDropper) in web applications, compatible with all modern browsers, including Linux/Wayland environments.

## ✨ Features
- 🎯 **Pixel-perfect color picking** with magnifier
- 🖱️ **Smooth interactions** with throttled mouse events
- 🎨 **Real-time color preview** with HEX values
- 🖼️ **Multiple input support** (canvas, images, URLs)
- 🎭 **Customizable UI** with CSS classes and IDs
- 🌐 **Universal compatibility** (modern browsers, Electron, Wayland)
- 📦 **Zero dependencies** and lightweight

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


### Usage with ReactJS (with image upload)
```jsx
import React, { useRef, useState } from 'react';
import EyeDropper from '@ltcode/eyedropper';

function ColorPicker() {
	const canvasRef = useRef();
	const imgRef = useRef();
	const [imgUrl, setImgUrl] = useState();

	const handleImage = (e) => {
		const file = e.target.files[0];
		if (file) {
			const url = URL.createObjectURL(file);
			setImgUrl(url);
		}
	};

	const drawImage = () => {
		if (imgRef.current && canvasRef.current) {
			EyeDropper.drawImageToCanvas(imgRef.current, canvasRef.current);
		}
	};

	const pickColor = async () => {
		const eyedropper = new EyeDropper();
		const color = await eyedropper.open(canvasRef.current);
		alert(color.hex);
	};

	return (
		<>
			<input type="file" accept="image/*" onChange={handleImage} />
			{imgUrl && (
				<img
					ref={imgRef}
					src={imgUrl}
					alt="preview"
					style={{ display: 'none' }}
					onLoad={drawImage}
				/>
			)}
			<canvas ref={canvasRef} width={300} height={200} style={{ border: '1px solid #ccc' }} />
			<button onClick={pickColor}>Pick color</button>
		</>
	);
}
```

> **Note:** Only call `.open()` in browser/client-side code (not SSR).

## Features
- 🔍 **Magnifier with crosshair** for pixel precision
- 🎨 **Real-time color preview** with HEX values
- 🎭 **Customizable styling** with CSS classes and IDs
- 🖼️ **Multiple formats** support (canvas, images, URLs)
- 📱 **Touch-friendly** interface
- 🌐 **Cross-platform** compatibility

### Performance Optimizations
- Canvas2D contexts optimized with `willReadFrequently: true`
- Mouse events throttled with `requestAnimationFrame`
- Efficient RGB to HEX conversion with bitwise operations
- Smart caching of canvas contexts and dimensions
- Passive event listeners for better scroll performance

### CSS Classes for Customization
The library adds CSS classes to all elements for easy styling:
- `.eyedropper-overlay` - Main overlay container
- `.eyedropper-magnifier` - Magnifier circle
- `.eyedropper-crosshair` - Crosshair inside magnifier
- `.eyedropper-preview` - Color preview box
- `.eyedropper-preview-color` - Color swatch
- `.eyedropper-color-display` - HEX text display
- `.eyedropper-magnifier-canvas` - Magnifier canvas

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
