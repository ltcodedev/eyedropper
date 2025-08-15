


# @ltcode/eyedropper

> ⚠️ This library is in **alpha** (`1.1.0`). APIs and behavior may change without notice.

JavaScript library for picking colors (EyeDropper) in web applications, compatible with all modern browsers, including Linux/Wayland environments.

## Installation
```sh
npm install @ltcode/eyedropper
```


## Usage
```js
import EyeDropper from '@ltcode/eyedropper';

const eyedropper = new EyeDropper();
eyedropper.open(canvas).then(color => {
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
