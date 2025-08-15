
// @ltcode/eyedropper
// Color picker library for selecting pixel color from images/canvas on the web

/**
 * EyeDropper - Color picker library for selecting pixel color from images/canvas on the web
 *
 * Manual usage (with canvas):
 *   const eyedropper = new EyeDropper();
 *   eyedropper.open(canvas).then(color => console.log(color.hex));
 *
 * Automated usage (with image URL):
 *   const eyedropper = new EyeDropper();
 *   eyedropper.openFromImageUrl('image.jpg').then(color => console.log(color.hex));
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
   * Utility to draw an <img> element onto a <canvas> (for React usage)
   * @param {HTMLImageElement} img - The image element
   * @param {HTMLCanvasElement} canvas - The canvas element
   * @param {Object} [options] - { cover: boolean } (if true, image will cover canvas, else fit)
   */
  static drawImageToCanvas(img, canvas, options = {}) {
    if (!img || !canvas || !img.naturalWidth || !img.naturalHeight) return;
    
    const ctx = canvas.getContext('2d');
    const { width: canvasW, height: canvasH } = canvas;
    const { naturalWidth: imgW, naturalHeight: imgH } = img;
    
    ctx.clearRect(0, 0, canvasW, canvasH);
    
    let dx, dy, dw, dh;
    
    if (options.cover) {
      // Cover logic (center crop) - optimized calculations
      const ratio = Math.max(canvasW / imgW, canvasH / imgH);
      dw = imgW * ratio;
      dh = imgH * ratio;
      dx = (canvasW - dw) * 0.5; // Faster than division by 2
      dy = (canvasH - dh) * 0.5;
    } else {
      // Fit logic - optimized calculations
      const ratio = Math.min(canvasW / imgW, canvasH / imgH);
      dw = imgW * ratio;
      dh = imgH * ratio;
      dx = (canvasW - dw) * 0.5;
      dy = (canvasH - dh) * 0.5;
    }
    
    ctx.drawImage(img, dx, dy, dw, dh);
  }
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
   * Opens the color picker over an existing canvas.
   * @param {HTMLCanvasElement|CanvasRenderingContext2D} canvasOrContext - Canvas or 2D context for color picking
   * @param {Object} [options] - Options to override those from the constructor
   * @returns {Promise<{hex: string, rgb: [number, number, number]}>}
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

            // Optimize canvas context for frequent getImageData operations
      const ctx = this._canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Failed to get 2D context from canvas.');
      }

  // Overlay container
      this._container = document.createElement('div');
      this._container.className = 'eyedropper-overlay';
      this._container.id = 'eyedropper-overlay';
      Object.assign(this._container.style, {
        position: 'fixed',
        top: '0',
        left: '0',
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
      this._magnifier.className = 'eyedropper-magnifier';
      this._magnifier.id = 'eyedropper-magnifier';
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

      // Cache the canvas context and dimensions for performance
      this._canvasCache = {
        ctx: ctx,
        width: this._canvas.width,
        height: this._canvas.height,
        scaleX: this._canvas.width / this._canvas.getBoundingClientRect().width,
        scaleY: this._canvas.height / this._canvas.getBoundingClientRect().height,
        magW: parseInt(magOpt.width || '80'),
        magH: parseInt(magOpt.height || '80')
      };

      // Create crosshair element once (as child of magnifier)
      this._crosshair = document.createElement('div');
      this._crosshair.className = 'eyedropper-crosshair';
      this._crosshair.id = 'eyedropper-crosshair';
      Object.assign(this._crosshair.style, {
        position: 'absolute',
        pointerEvents: 'none',
        width: '6px',
        height: '6px',
        border: '1px solid #000',
        backgroundColor: 'transparent',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: '1',
        boxSizing: 'border-box'
      });
      this._magnifier.appendChild(this._crosshair);

  // Preview
      const prevOpt = this.options.preview || {};
      this._preview = document.createElement('div');
      this._preview.className = 'eyedropper-preview';
      this._preview.id = 'eyedropper-preview';
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
        display: 'none', // Initially hidden until hover
        alignItems: prevOpt.alignItems || 'center',
        gap: prevOpt.gap || '12px',
        zIndex: prevOpt.zIndex || 100001,
        pointerEvents: 'none',
        minWidth: prevOpt.minWidth || '80px',
        ...prevOpt.style,
      });

      // Create color preview elements
      this._previewColor = document.createElement('div');
      this._previewColor.className = 'eyedropper-preview-color';
      this._previewColor.id = 'eyedropper-preview-color';
      Object.assign(this._previewColor.style, {
        width: '20px',
        height: '20px',
        borderRadius: '3px',
        border: '1px solid #ccc',
        flexShrink: '0'
      });

      this._colorDisplay = document.createElement('span');
      this._colorDisplay.className = 'eyedropper-color-display';
      this._colorDisplay.id = 'eyedropper-color-display';
      this._colorDisplay.textContent = '#000000';

      this._preview.appendChild(this._previewColor);
      this._preview.appendChild(this._colorDisplay);
      this._container.appendChild(this._preview);

      // Initialize last pixel data for when mouse leaves
      this._lastPixel = null;

  // Events with throttled mouse move for better performance
  this._canvas.addEventListener('mousemove', this._onMouseMoveBound = this._throttledMouseMove.bind(this), { passive: true });
  this._canvas.addEventListener('mouseleave', this._onMouseLeaveBound = this._onMouseLeave.bind(this), { passive: true });
  this._canvas.addEventListener('mouseenter', this._onMouseEnterBound = this._onMouseEnter.bind(this), { passive: true });
  this._canvas.addEventListener('click', this._onClickBound = this._onClick.bind(this));
    }

    // Throttled mouse move for better performance
    _throttledMouseMove(e) {
      if (!this._mouseThrottle) {
        this._mouseThrottle = true;
        requestAnimationFrame(() => {
          this._onMouseMove(e);
          this._mouseThrottle = false;
        });
      }
    }

    _onMouseEnter(e) {
      // Hide cursor and show magnifier and preview on mouse enter
      this._canvas.style.cursor = 'none';
      this._magnifier.style.display = 'block';
      this._preview.style.display = 'flex';
    }

        _onMouseEnter(e) {
      // Hide cursor and show magnifier and preview on mouse enter
      this._canvas.style.cursor = 'none';
      this._magnifier.style.display = 'block';
      this._preview.style.display = 'flex';
    }

        _onMouseMove(e) {
      const rect = this._canvas.getBoundingClientRect();
      const x = Math.floor(e.clientX - rect.left);
      const y = Math.floor(e.clientY - rect.top);

      // Simple getImageData call - optimized by willReadFrequently context
      const imageData = this._canvasCache.ctx.getImageData(x, y, 1, 1);
      const [r, g, b] = imageData.data;

      // Update preview with current color
      const hexColor = this._rgbToHex(r, g, b);
      this._previewColor.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      this._colorDisplay.textContent = hexColor;

      // Update magnifier position and content
      this._updateMagnifier(x, y, e, [r, g, b], hexColor);
    }

    _updateMagnifier(x, y, e, rgb, hex) {
      // Update magnifier position
      this._magnifier.style.left = `${e.clientX - this._canvasCache.magW / 2}px`;
      this._magnifier.style.top = `${e.clientY - this._canvasCache.magH / 2}px`;
      
      // Draw magnifier content
      this._drawMagnifier(x, y);
      
      // Position preview below magnifier
      const previewRect = { w: this._preview.offsetWidth, h: this._preview.offsetHeight };
      const px = e.clientX - this._canvasCache.magW / 2;
      const py = e.clientY + this._canvasCache.magH / 2 + 8;
      this._preview.style.left = `${px + this._canvasCache.magW / 2 - previewRect.w / 2}px`;
      this._preview.style.top = `${py}px`;
      
      // Store last pixel data
      this._lastPixel = {
        x: x,
        y: y,
        clientX: e.clientX,
        clientY: e.clientY,
        hex: hex,
        rgb: rgb
      };
    }

    _onMouseLeave() {
      // Keep magnifier and preview visible showing last selected pixel
      if (this._lastPixel && this._canvasCache) {
        // Keep magnifier at last position using cached dimensions
        this._magnifier.style.left = `${this._lastPixel.clientX - this._canvasCache.magW / 2}px`;
        this._magnifier.style.top = `${this._lastPixel.clientY - this._canvasCache.magH / 2}px`;
        
        this._drawMagnifier(this._lastPixel.x, this._lastPixel.y);
        
        // Keep preview with last pixel data
        if (typeof this.options.renderPreview === 'function') {
          this._preview.innerHTML = this.options.renderPreview(this._lastPixel);
        } else {
          const colorBox = `<span style="display:inline-block;width:24px;height:24px;background:${this._lastPixel.hex};border:1px solid #ccc;"></span>`;
          const hexText = `<span style="font-weight:bold;">${this._lastPixel.hex}</span>`;
          this._preview.innerHTML = `${colorBox} ${hexText}`;
        }
        
        // Position preview below magnifier
        const previewRect = { w: this._preview.offsetWidth, h: this._preview.offsetHeight };
        const px = this._lastPixel.clientX - this._canvasCache.magW / 2;
        const py = this._lastPixel.clientY + this._canvasCache.magH / 2 + 8;
        this._preview.style.left = `${px + this._canvasCache.magW / 2 - previewRect.w / 2}px`;
        this._preview.style.top = `${py}px`;
      } else {
        // If no last pixel, hide elements and restore cursor
        this._canvas.style.cursor = 'default';
        this._magnifier.style.display = 'none';
        this._preview.style.display = 'none';
      }
    }

    _onClick(e) {
      // Use the pixel data we already have from the last mouse move
      if (this._lastPixel) {
        const { hex, rgb, x, y } = this._lastPixel;
        if (typeof this.options.onPick === 'function') {
          this.options.onPick({ hex, rgb, x, y, event: e });
        }
        this._resolve({ hex, rgb });
      } else {
        // Fallback: get pixel data if somehow we don't have it
        const position = this._currentPosition || (() => {
          const rect = this._canvas.getBoundingClientRect();
          return {
            x: Math.floor((e.clientX - rect.left) * (this._canvasCache?.scaleX || (this._canvas.width / rect.width))),
            y: Math.floor((e.clientY - rect.top) * (this._canvasCache?.scaleY || (this._canvas.height / rect.height))),
          };
        })();

        // Simple getImageData call - optimized by willReadFrequently context
        const imageData = this._canvasCache.ctx.getImageData(position.x, position.y, 1, 1);
        const [r, g, b] = imageData.data;
        const hex = this._rgbToHex(r, g, b);
        const rgb = [r, g, b];
        
        if (typeof this.options.onPick === 'function') {
          this.options.onPick({ hex, rgb, x: position.x, y: position.y, event: e });
        }
        this._resolve({ hex, rgb });
      }
      this._removeUI();
    }

    _drawMagnifier(x, y) {
      // Cache magnifier options on first use
      if (!this._magnifierCache) {
        this._magnifierCache = {
          size: (this.options.magnifier && this.options.magnifier.size) || 20,
          zoom: (this.options.magnifier && this.options.magnifier.zoom) || 4
        };
      }

      const { size, zoom } = this._magnifierCache;
      
      // Create or reuse magnifier canvas
      if (!this._magCanvas) {
        this._magCanvas = document.createElement('canvas');
        this._magCanvas.className = 'eyedropper-magnifier-canvas';
        this._magCanvas.id = 'eyedropper-magnifier-canvas';
        // Insert canvas before crosshair to maintain proper z-order
        this._magnifier.insertBefore(this._magCanvas, this._crosshair);
      }
      
      // Only resize if dimensions changed
      const newWidth = size * zoom;
      const newHeight = size * zoom;
      if (this._magCanvas.width !== newWidth || this._magCanvas.height !== newHeight) {
        this._magCanvas.width = newWidth;
        this._magCanvas.height = newHeight;
      }
      
      // Use cached context with willReadFrequently optimization
      if (!this._magCtx) {
        this._magCtx = this._magCanvas.getContext('2d', { willReadFrequently: true });
        this._magCtx.imageSmoothingEnabled = false;
      }
      
      this._magCtx.drawImage(
        this._canvas,
        x - size / 2, y - size / 2, size, size,
        0, 0, newWidth, newHeight
      );
    }

    _rgbToHex(r, g, b) {
      // Faster bitwise conversion without array creation
      return '#' + 
        ((1 << 24) + (r << 16) + (g << 8) + b)
          .toString(16)
          .slice(1);
    }

    _removeUI() {
      if (this._container && this._container.parentNode) {
        this._container.parentNode.removeChild(this._container);
      }
      if (this._canvas) {
        // Restore cursor
        this._canvas.style.cursor = 'default';
        this._canvas.removeEventListener('mousemove', this._onMouseMoveBound);
        this._canvas.removeEventListener('mouseleave', this._onMouseLeaveBound);
        this._canvas.removeEventListener('mouseenter', this._onMouseEnterBound);
        this._canvas.removeEventListener('click', this._onClickBound);
      }
      // Clear all cached references and data
      this._container = null;
      this._canvas = null;
      this._magnifier = null;
      this._crosshair = null;
      this._preview = null;
      this._lastPixel = null;
      this._currentPosition = null;
      this._canvasCache = null;
      this._magnifierCache = null;
      this._magCanvas = null;
      this._magCtx = null;
      this._mouseThrottle = false;
      this._imageDataCache = null;
    }

  /**
   * Automated method: pass only image URL, library handles canvas creation and setup
   * @param {string} imageUrl - URL of the image to load
   * @param {Object} [options] - Options to override constructor options
   * @param {Object} [canvasOptions] - Canvas configuration { width, height, position }
   * @returns {Promise<{hex: string, rgb: [number, number, number]}>}
   */
  openFromImageUrl(imageUrl, options = {}, canvasOptions = {}) {
    // Ensure running in browser (not SSR)
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('EyeDropper can only be used in the browser environment.');
    }

    return new Promise((resolve, reject) => {
      // Calculate position for loading and canvas
      const canvasTop = canvasOptions.position?.top || '50%';
      const canvasLeft = canvasOptions.position?.left || '50%';
      const canvasWidth = canvasOptions.width || 400; // Default fallback
      const canvasHeight = canvasOptions.height || 300; // Default fallback

      // Create loading overlay positioned where canvas will appear
      const loadingOverlay = this._createLoadingOverlay(canvasTop, canvasLeft, canvasWidth, canvasHeight);
      document.body.appendChild(loadingOverlay);

      // Create temporary image element
      const img = new Image();
      img.crossOrigin = 'anonymous'; // For CORS images
      
      img.onload = () => {
        try {
          // Remove loading overlay
          if (loadingOverlay.parentNode) {
            loadingOverlay.parentNode.removeChild(loadingOverlay);
          }

          // Create temporary canvas
          const canvas = document.createElement('canvas');
          canvas.className = 'eyedropper-main-canvas';
          canvas.id = 'eyedropper-main-canvas';
          const finalCanvasWidth = canvasOptions.width || img.naturalWidth;
          const finalCanvasHeight = canvasOptions.height || img.naturalHeight;
          
          canvas.width = finalCanvasWidth;
          canvas.height = finalCanvasHeight;
          canvas.style.position = 'fixed';
          canvas.style.top = canvasTop;
          canvas.style.left = canvasLeft;
          canvas.style.transform = 'translate(-50%, -50%)';
          canvas.style.zIndex = '99998';
          canvas.style.border = '2px solid #333';
          canvas.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
          canvas.style.background = '#fff';
          
          // Draw image to canvas
          EyeDropper.drawImageToCanvas(img, canvas, { cover: canvasOptions.cover });
          
          // Add canvas to body temporarily
          document.body.appendChild(canvas);
          
          // Open eyedropper on this canvas
          this.open(canvas, options).then((color) => {
            // Clean up: remove temporary canvas
            if (canvas.parentNode) {
              canvas.parentNode.removeChild(canvas);
            }
            resolve(color);
          }).catch(reject);
          
        } catch (error) {
          // Remove loading overlay on error
          if (loadingOverlay.parentNode) {
            loadingOverlay.parentNode.removeChild(loadingOverlay);
          }
          reject(error);
        }
      };
      
      img.onerror = () => {
        // Remove loading overlay on error
        if (loadingOverlay.parentNode) {
          loadingOverlay.parentNode.removeChild(loadingOverlay);
        }
        reject(new Error(`Failed to load image from URL: ${imageUrl}`));
      };
      
      img.src = imageUrl;
    });
  }

  /**
   * Creates a loading overlay with skeleton/spinner positioned where canvas will appear
   * @param {string} top - Top position (e.g., '50%')
   * @param {string} left - Left position (e.g., '50%')
   * @param {number} width - Expected canvas width
   * @param {number} height - Expected canvas height
   * @returns {HTMLElement} Loading overlay element
   */
  _createLoadingOverlay(top = '50%', left = '50%', width = 400, height = 300) {
    const overlay = document.createElement('div');
    overlay.className = 'eyedropper-loading-overlay';
    overlay.id = 'eyedropper-loading-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: top,
      left: left,
      transform: 'translate(-50%, -50%)',
      width: `${width}px`,
      height: `${height}px`,
      background: '#fff',
      border: '2px solid #333',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '99998',
      fontFamily: 'Arial, sans-serif'
    });

    const loadingContent = document.createElement('div');
    loadingContent.className = 'eyedropper-loading-content';
    loadingContent.id = 'eyedropper-loading-content';
    Object.assign(loadingContent.style, {
      textAlign: 'center'
    });

    // Skeleton loader animation (proportional to canvas size)
    const skeleton = document.createElement('div');
    skeleton.className = 'eyedropper-loading-skeleton';
    skeleton.id = 'eyedropper-loading-skeleton';
    const skeletonWidth = Math.min(width * 0.7, 200);
    const skeletonHeight = Math.min(height * 0.5, 120);
    
    Object.assign(skeleton.style, {
      width: `${skeletonWidth}px`,
      height: `${skeletonHeight}px`,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-loading 1.5s infinite',
      borderRadius: '8px',
      marginBottom: '16px',
      margin: '0 auto 16px auto'
    });

    const text = document.createElement('div');
    text.className = 'eyedropper-loading-text';
    text.id = 'eyedropper-loading-text';
    text.textContent = 'Loading image...';
    Object.assign(text.style, {
      color: '#666',
      fontSize: '14px',
      fontWeight: '500'
    });

    // Add CSS animation for skeleton
    if (!document.getElementById('skeleton-animation-style')) {
      const style = document.createElement('style');
      style.id = 'skeleton-animation-style';
      style.textContent = `
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `;
      document.head.appendChild(style);
    }

    loadingContent.appendChild(skeleton);
    loadingContent.appendChild(text);
    overlay.appendChild(loadingContent);

    return overlay;
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
