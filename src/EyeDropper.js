
// @ltcode/eyedropper
// Color picker library for selecting pixel color from images/canvas on the web

/**
 * EyeDropper - Color picker library for selecting pixel color from images/canvas on the web
 *
 * ReactJS usage example:
 *   import EyeDropper from '@ltcode/eyedropper';
 *   const ref = useRef();
 *   const pickColor = async () => {
 *     const eyedropper = new EyeDropper();
 *     const color = await eyedropper.open(ref.current);
 *     // color.hex, color.rgb
 *   };
 *   <canvas ref={ref} ... />
 *
 * Note: Only call .open() in browser/client-side code (not SSR).
 */
class EyeDropper {
  /**
   * @param {Object} options - Global customization options (can be overridden in open)
   * @param {Object} [options.magnifier] - Magnifier customization (size, border, color, etc)
   * @param {Object} [options.preview] - Preview customization (style, HTML, etc)
   * @param {Object} [options.overlay] - Overlay customization (color, opacity, etc)
   * @param {Function} [options.renderPreview] - Custom function to render the preview
   * @param {Function} [options.onMove] - Callback on mouse move
   * @param {Function} [options.onPick] - Callback on color pick
   */
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * EyeDropper - Color picker library for selecting pixel color from images/canvas on the web
   * Usage:
   *   const eyedropper = new EyeDropper();
   *   eyedropper.open(canvas).then(color => { ... });
   */
  /**
   * Opens the color picker over an existing canvas.
   * @param {HTMLCanvasElement|CanvasRenderingContext2D} canvasOrContext - Canvas or 2D context for color picking
   * @returns {Promise<{hex: string, rgb: [number, number, number]}>}
   */
  /**
   * @param {HTMLCanvasElement|CanvasRenderingContext2D} canvasOrContext
   * @param {Object} [options] - Options to override those from the constructor
   */
    open(canvasOrContext, options = {}) {
      // Ensure running in browser (not SSR)
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('EyeDropper can only be used in the browser environment.');
      }
      this.options = { ...this.options, ...options };
      return new Promise((resolve) => {
        this._resolve = resolve;
        this._createUI(canvasOrContext);
      });
    }

    _createUI(canvasOrContext) {
      this._removeUI();

      // Discover the canvas
      let canvas;
      if (canvasOrContext instanceof HTMLCanvasElement) {
        canvas = canvasOrContext;
      } else if (canvasOrContext && typeof canvasOrContext.getImageData === 'function') {
        canvas = canvasOrContext.canvas;
      } else {
        throw new Error('You must provide a valid canvas or 2D context to EyeDropper.');
      }
      this._canvas = canvas;

  // Overlay container
      this._container = document.createElement('div');
      Object.assign(this._container.style, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: (this.options.overlay && this.options.overlay.background) || 'rgba(0,0,0,0.0)',
        zIndex: (this.options.overlay && this.options.overlay.zIndex) || 99999,
        pointerEvents: 'none',
        ...(this.options.overlay && this.options.overlay.style),
      });
      document.body.appendChild(this._container);

  // Magnifier
      const magOpt = this.options.magnifier || {};
      this._magnifier = document.createElement('div');
      Object.assign(this._magnifier.style, {
        position: 'absolute',
        pointerEvents: 'none',
        width: magOpt.width || '80px',
        height: magOpt.height || '80px',
        border: magOpt.border || '2px solid #333',
        borderRadius: magOpt.borderRadius || '50%',
        overflow: magOpt.overflow || 'hidden',
        boxShadow: magOpt.boxShadow || '0 2px 8px #0008',
        zIndex: magOpt.zIndex || 100000,
        display: 'none',
        background: magOpt.background || '#fff',
        ...magOpt.style,
      });
      this._container.appendChild(this._magnifier);

  // Preview
      const prevOpt = this.options.preview || {};
      this._preview = document.createElement('div');
      Object.assign(this._preview.style, {
        position: 'fixed',
        left: '0px',
        top: '0px',
        padding: prevOpt.padding || '10px 18px',
        background: prevOpt.background || '#fff',
        borderRadius: prevOpt.borderRadius || '8px',
        boxShadow: prevOpt.boxShadow || '0 2px 8px #0002',
        fontFamily: prevOpt.fontFamily || 'monospace',
        fontSize: prevOpt.fontSize || '1.1em',
        display: prevOpt.display || 'flex',
        alignItems: prevOpt.alignItems || 'center',
        gap: prevOpt.gap || '12px',
        zIndex: prevOpt.zIndex || 100001,
        pointerEvents: 'none',
        minWidth: prevOpt.minWidth || '80px',
        ...prevOpt.style,
      });
      this._container.appendChild(this._preview);

  // Events
  this._canvas.addEventListener('mousemove', this._onMouseMoveBound = this._onMouseMove.bind(this));
  this._canvas.addEventListener('mouseleave', this._onMouseLeaveBound = this._onMouseLeave.bind(this));
  this._canvas.addEventListener('click', this._onClickBound = this._onClick.bind(this));
    }

    _onMouseMove(e) {
      const rect = this._canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) * (this._canvas.width / rect.width));
      const y = Math.floor((e.clientY - rect.top) * (this._canvas.height / rect.height));
      const ctx = this._canvas.getContext('2d');
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = this._rgbToHex(pixel[0], pixel[1], pixel[2]);

    // Magnifier
    this._magnifier.style.display = 'block';
    // Center magnifier on cursor
    const magW = parseInt((this.options.magnifier && this.options.magnifier.width) || 80, 10);
    const magH = parseInt((this.options.magnifier && this.options.magnifier.height) || 80, 10);
    this._magnifier.style.left = `${e.clientX - magW / 2}px`;
    this._magnifier.style.top = `${e.clientY - magH / 2}px`;
    this._drawMagnifier(x, y);

    // Preview
    // Custom HTML or default
    if (typeof this.options.renderPreview === 'function') {
      this._preview.innerHTML = this.options.renderPreview({ hex, rgb: [pixel[0], pixel[1], pixel[2]], x, y, event: e });
    } else {
      this._preview.innerHTML = `<span style=\"display:inline-block;width:24px;height:24px;background:${hex};border:1px solid #ccc;\"></span> <span>${hex}</span>`;
    }
    // Position preview below magnifier, centered
    const previewRect = { w: this._preview.offsetWidth, h: this._preview.offsetHeight };
    const px = e.clientX - magW / 2;
    const py = e.clientY + magH / 2 + 8;
    this._preview.style.left = `${px + magW / 2 - previewRect.w / 2}px`;
    this._preview.style.top = `${py}px`;
    // Callback onMove
    if (typeof this.options.onMove === 'function') {
      this.options.onMove({ hex, rgb: [pixel[0], pixel[1], pixel[2]], x, y, event: e });
    }
    }

    _onMouseLeave() {
      this._magnifier.style.display = 'none';
      this._preview.innerHTML = '';
    }

    _onClick(e) {
      const rect = this._canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) * (this._canvas.width / rect.width));
      const y = Math.floor((e.clientY - rect.top) * (this._canvas.height / rect.height));
      const ctx = this._canvas.getContext('2d');
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = this._rgbToHex(pixel[0], pixel[1], pixel[2]);
      if (typeof this.options.onPick === 'function') {
        this.options.onPick({ hex, rgb: [pixel[0], pixel[1], pixel[2]], x, y, event: e });
      }
      this._resolve({ hex, rgb: [pixel[0], pixel[1], pixel[2]] });
      this._removeUI();
    }

    _drawMagnifier(x, y) {
      // Create a temporary canvas for the magnifier
      const size = (this.options.magnifier && this.options.magnifier.size) || 20;
      const zoom = (this.options.magnifier && this.options.magnifier.zoom) || 4;
      const ctx = this._canvas.getContext('2d');
      const magCanvas = document.createElement('canvas');
      magCanvas.width = size * zoom;
      magCanvas.height = size * zoom;
      const magCtx = magCanvas.getContext('2d');
      magCtx.imageSmoothingEnabled = false;
      magCtx.drawImage(
        this._canvas,
        x - size / 2, y - size / 2, size, size,
        0, 0, size * zoom, size * zoom
      );
      this._magnifier.innerHTML = '';
      this._magnifier.appendChild(magCanvas);
    }

    _rgbToHex(r, g, b) {
      return (
        '#' +
        [r, g, b]
          .map((x) => x.toString(16).padStart(2, '0'))
          .join('')
      );
    }

    _removeUI() {
      if (this._container && this._container.parentNode) {
        this._container.parentNode.removeChild(this._container);
      }
      if (this._canvas) {
        this._canvas.removeEventListener('mousemove', this._onMouseMoveBound);
        this._canvas.removeEventListener('mouseleave', this._onMouseLeaveBound);
        this._canvas.removeEventListener('click', this._onClickBound);
      }
      this._container = null;
      this._canvas = null;
      this._magnifier = null;
      this._preview = null;
    }

  attachToImage(imgElement) {
    // Initialize eyedropper on an <img> element
    // Example usage: eyedropper.attachToImage(document.querySelector('img'))
    // Basic implementation will be provided in future versions
    throw new Error('Method not implemented. Coming soon!');
  }
}


// Export for ES Modules
export default EyeDropper;

// Export for CommonJS (require)
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = EyeDropper;
  module.exports.default = EyeDropper;
}
