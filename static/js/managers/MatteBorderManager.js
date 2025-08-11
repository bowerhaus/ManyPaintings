/**
 * Matte Border Manager - Handles matte border visual effects and image area clipping
 * Extracted from main.js for better modularity
 */
export const MatteBorderManager = {
  borderElement: null,
  config: null,

  init() {
    this.borderElement = document.getElementById('matte-border');
    if (!this.borderElement) {
      console.warn('MatteBorderManager: Border element not found');
      return;
    }

    console.log('MatteBorderManager: Border element found:', this.borderElement);
    console.log('MatteBorderManager: Initial element styles:', {
      display: getComputedStyle(this.borderElement).display,
      visibility: getComputedStyle(this.borderElement).visibility,
      opacity: getComputedStyle(this.borderElement).opacity,
      border: getComputedStyle(this.borderElement).border
    });

    // Initialize border element with basic styles
    this.borderElement.style.display = 'block';
    this.borderElement.style.opacity = '1';
    this.borderElement.style.visibility = 'visible';

    console.log('MatteBorderManager: Forced border styles applied');

    // Set up mutation observer to track changes
    this.setupMutationObserver();

    // For now, always use default configuration to bypass API issues
    console.log('MatteBorderManager: Bypassing API, using default configuration');
    this.setDefaultConfiguration();

    // Also try to load from API for debugging
    this.loadConfiguration();
  },

  setupMutationObserver() {
    if (!this.borderElement) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          console.log('MatteBorderManager: Border element attribute changed:', mutation.attributeName);
          console.log('MatteBorderManager: Current computed styles:', {
            display: getComputedStyle(this.borderElement).display,
            visibility: getComputedStyle(this.borderElement).visibility,
            opacity: getComputedStyle(this.borderElement).opacity,
            borderWidth: getComputedStyle(this.borderElement).borderWidth
          });
        }
      });
    });

    observer.observe(this.borderElement, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  },

  async loadConfiguration() {
    try {
      const response = await fetch('/api/config');
      const configData = await response.json();

      console.log('MatteBorderManager: Full API response:', configData);
      console.log('MatteBorderManager: matte_border section:', configData.matte_border);

      this.config = configData.matte_border || {};

      // If config is empty, use default configuration
      if (Object.keys(this.config).length === 0) {
        console.warn('MatteBorderManager: No matte_border config found, using defaults');
        this.setDefaultConfiguration();
        return;
      }

      console.log('MatteBorderManager: Configuration loaded', this.config);

      // Delay application to ensure DOM is ready
      setTimeout(() => {
        this.applyConfiguration();
      }, 100);
    } catch (error) {
      console.error('MatteBorderManager: Failed to load configuration:', error);
      this.setDefaultConfiguration();
    }
  },

  setDefaultConfiguration() {
    console.log('MatteBorderManager: Using default configuration');
    this.config = {
      enabled: true,
      border_percent: 10,
      color: '#F8F8F8',
      style: 'thin',
      image_area: {
        aspect_ratio: '1:1'
      }
    };

    // Delay application to ensure DOM is ready
    setTimeout(() => {
      this.applyConfiguration();
    }, 100);
  },

  applyConfiguration() {
    if (!this.borderElement || !this.config) {
      console.warn('MatteBorderManager: Cannot apply configuration - missing element or config');
      return;
    }

    console.log('MatteBorderManager: Applying configuration:', this.config);

    if (!this.config.enabled) {
      this.borderElement.classList.add('disabled');
      console.log('MatteBorderManager: Border disabled');
      this.resetMatteCanvas();
      return;
    }

    this.borderElement.classList.remove('disabled');

    // Apply style class
    this.borderElement.className = `matte-border ${this.config.style || 'thin'}`;

    // Calculate and apply the matte canvas with proper aspect ratio
    const matteCanvas = this.calculateMatteCanvas();
    this.applyMatteCanvas(matteCanvas);
  },

  calculateMatteCanvas() {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get aspect ratio from config
    let aspect_ratio = '1:1'; // Default to square

    // Check for aspect ratio in client-side config first
    if (window.APP_CONFIG && window.APP_CONFIG.matte_border && window.APP_CONFIG.matte_border.image_area) {
      aspect_ratio = window.APP_CONFIG.matte_border.image_area.aspect_ratio;
    }
    // Fallback to server config if available
    else if (this.config && this.config.image_area && this.config.image_area.aspect_ratio) {
      aspect_ratio = this.config.image_area.aspect_ratio;
    }

    // Parse aspect ratio (e.g., "16:9", "4:3", "1:1")
    const [widthRatio, heightRatio] = aspect_ratio.split(':').map(n => parseFloat(n));
    if (!widthRatio || !heightRatio) {
      console.warn('MatteBorderManager: Invalid aspect ratio format:', aspect_ratio);
      return this.getFallbackCanvas();
    }

    const targetAspectRatio = widthRatio / heightRatio;
    const viewportAspectRatio = viewportWidth / viewportHeight;

    // Calculate maximum canvas size that fits in viewport while maintaining aspect ratio
    let canvasWidth, canvasHeight;

    if (viewportAspectRatio > targetAspectRatio) {
      // Viewport is wider than target - constrain by height
      canvasHeight = viewportHeight;
      canvasWidth = canvasHeight * targetAspectRatio;
    } else {
      // Viewport is taller than target - constrain by width
      canvasWidth = viewportWidth;
      canvasHeight = canvasWidth / targetAspectRatio;
    }

    // Get border percentage from config
    let border_percent = 10; // Default

    // Check client-side config first
    if (window.APP_CONFIG && window.APP_CONFIG.matte_border && window.APP_CONFIG.matte_border.border_percent) {
      border_percent = window.APP_CONFIG.matte_border.border_percent;
    }
    // Fallback to server config if available
    else if (this.config && this.config.border_percent) {
      border_percent = this.config.border_percent;
    }

    // Calculate border size as percentage of the smaller canvas dimension
    const smallerCanvasDimension = Math.min(canvasWidth, canvasHeight);
    const borderSize = Math.round((border_percent / 100) * smallerCanvasDimension);

    // Ensure minimum and maximum border sizes
    const finalBorderSize = Math.max(20, Math.min(200, borderSize));

    // Calculate canvas position (centered in viewport)
    const canvasLeft = (viewportWidth - canvasWidth) / 2;
    const canvasTop = (viewportHeight - canvasHeight) / 2;

    // Calculate image area (canvas minus borders)
    const image_areaWidth = canvasWidth - (finalBorderSize * 2);
    const image_areaHeight = canvasHeight - (finalBorderSize * 2);
    const image_areaLeft = canvasLeft + finalBorderSize;
    const image_areaTop = canvasTop + finalBorderSize;

    const result = {
      // Viewport info
      viewportWidth,
      viewportHeight,

      // Aspect ratio info
      aspect_ratio,
      targetAspectRatio,

      // Canvas dimensions and position
      canvasWidth,
      canvasHeight,
      canvasLeft,
      canvasTop,

      // Border info
      border_percent,
      borderSize: finalBorderSize,

      // Image area dimensions and position
      image_areaWidth,
      image_areaHeight,
      image_areaLeft,
      image_areaTop
    };

    console.log('MatteBorderManager: Calculated matte canvas:', result);
    return result;
  },

  getFallbackCanvas() {
    // Fallback for invalid configurations
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const borderSize = 50; // Fixed fallback border

    return {
      viewportWidth,
      viewportHeight,
      aspect_ratio: '1:1',
      targetAspectRatio: 1.0,
      canvasWidth: Math.min(viewportWidth, viewportHeight),
      canvasHeight: Math.min(viewportWidth, viewportHeight),
      canvasLeft: (viewportWidth - Math.min(viewportWidth, viewportHeight)) / 2,
      canvasTop: (viewportHeight - Math.min(viewportWidth, viewportHeight)) / 2,
      border_percent: 10,
      borderSize,
      image_areaWidth: Math.min(viewportWidth, viewportHeight) - (borderSize * 2),
      image_areaHeight: Math.min(viewportWidth, viewportHeight) - (borderSize * 2),
      image_areaLeft: (viewportWidth - Math.min(viewportWidth, viewportHeight)) / 2 + borderSize,
      image_areaTop: (viewportHeight - Math.min(viewportWidth, viewportHeight)) / 2 + borderSize
    };
  },

  applyMatteCanvas(canvas) {
    const borderColor = this.config.color || '#F8F8F8';

    // Position and size the matte border element to fill the entire viewport
    // The matte paper texture should cover everything except the image area
    this.borderElement.style.setProperty('position', 'absolute', 'important');
    this.borderElement.style.setProperty('left', '0px', 'important');
    this.borderElement.style.setProperty('top', '0px', 'important');
    this.borderElement.style.setProperty('width', '100vw', 'important');
    this.borderElement.style.setProperty('height', '100vh', 'important');
    this.borderElement.style.setProperty('box-sizing', 'border-box', 'important');

    // Set background to matte color with paper texture (from CSS)
    this.borderElement.style.setProperty('background-color', borderColor, 'important');

    // Remove any border since we're not using CSS border approach anymore
    this.borderElement.style.setProperty('border', 'none', 'important');

    // Create a transparent cutout for the image area using clip-path
    this.createImageAreaCutout(canvas);

    // Create 3D bevel frame around the image cutout
    this.create3DBevelFrame(canvas);

    // Create shadow overlay that casts shadows onto the image
    this.createShadowOverlay(canvas);

    // Position the image layers container within the image cutout area
    this.positionImageLayers(canvas);

    // Ensure visibility
    this.borderElement.style.opacity = '1';
    this.borderElement.style.visibility = 'visible';

    console.log(`MatteBorderManager: Applied ${this.config.style} matte overlay with image cutout: ${canvas.image_areaWidth}x${canvas.image_areaHeight}`);
  },

  createImageAreaCutout(canvas) {
    // Calculate the image area (center area without border)
    const imageLeft = canvas.canvasLeft + canvas.borderSize;
    const imageTop = canvas.canvasTop + canvas.borderSize;
    const imageWidth = canvas.canvasWidth - (canvas.borderSize * 2);
    const imageHeight = canvas.canvasHeight - (canvas.borderSize * 2);

    // Create a clip-path that cuts out the image area from the matte overlay
    // This creates a "window" in the matte where images can show through
    const clipPath = `polygon(
      0% 0%, 
      0% 100%, 
      ${imageLeft}px 100%, 
      ${imageLeft}px ${imageTop}px, 
      ${imageLeft + imageWidth}px ${imageTop}px, 
      ${imageLeft + imageWidth}px ${imageTop + imageHeight}px, 
      ${imageLeft}px ${imageTop + imageHeight}px, 
      ${imageLeft}px 100%, 
      100% 100%, 
      100% 0%
    )`;

    this.borderElement.style.setProperty('clip-path', clipPath, 'important');

    console.log('MatteBorderManager: Created image area cutout:', {
      imageLeft,
      imageTop,
      imageWidth,
      imageHeight,
      clipPath
    });
  },

  create3DBevelFrame(canvas) {
    // Create or get the 3D bevel frame element
    let bevelFrame = document.getElementById('bevel-frame');
    if (!bevelFrame) {
      bevelFrame = document.createElement('div');
      bevelFrame.id = 'bevel-frame';
      bevelFrame.style.position = 'absolute';
      bevelFrame.style.pointerEvents = 'none';
      bevelFrame.style.zIndex = '53'; // Above the matte border but below shadow
      this.borderElement.parentNode.appendChild(bevelFrame);
    }

    // Calculate the image area (where the bevel frame should go)
    const imageLeft = canvas.canvasLeft + canvas.borderSize;
    const imageTop = canvas.canvasTop + canvas.borderSize;
    const imageWidth = canvas.canvasWidth - (canvas.borderSize * 2);
    const imageHeight = canvas.canvasHeight - (canvas.borderSize * 2);

    // Position the bevel frame exactly at the image cutout area boundaries
    const bevelWidth = 12; // Width of the bevel effect
    bevelFrame.style.left = `${imageLeft - bevelWidth}px`;
    bevelFrame.style.top = `${imageTop - bevelWidth}px`;
    bevelFrame.style.width = `${imageWidth + (bevelWidth * 2)}px`;
    bevelFrame.style.height = `${imageHeight + (bevelWidth * 2)}px`;

    // Remove border entirely - we'll use box-shadow for the entire bevel effect
    bevelFrame.style.border = 'none';
    bevelFrame.style.background = 'transparent'; // Transparent so images show through
    bevelFrame.style.boxSizing = 'border-box';

    // Just create the frame border without any shadows - shadow overlay handles the shadows
    const style = this.config.style || 'thin';
    const borderColor = this.config.color || '#F8F8F8';
    
    if (style === 'thick') {
      // Thick: Large border only
      bevelFrame.style.boxShadow = `0 0 0 12px ${borderColor}`;
    } else if (style === 'medium') {
      // Medium: Medium border only
      bevelFrame.style.boxShadow = `0 0 0 8px ${borderColor}`;
    } else {
      // Thin: Small border only
      bevelFrame.style.boxShadow = `0 0 0 4px ${borderColor}`;
    }

    console.log(`MatteBorderManager: Created 3D bevel frame (${style} style) around image area:`, {
      left: imageLeft - bevelWidth,
      top: imageTop - bevelWidth,
      width: imageWidth + (bevelWidth * 2),
      height: imageHeight + (bevelWidth * 2),
      bevelWidth
    });
  },

  createShadowOverlay(canvas) {
    // Create or get the shadow overlay element
    let shadowOverlay = document.getElementById('shadow-overlay');
    if (!shadowOverlay) {
      shadowOverlay = document.createElement('div');
      shadowOverlay.id = 'shadow-overlay';
      shadowOverlay.style.position = 'fixed';
      shadowOverlay.style.pointerEvents = 'none';
      shadowOverlay.style.zIndex = '55'; // Above the matte border, bevel frame and images
      // Append to canvas-container to ensure proper stacking context
      const canvasContainer = document.getElementById('canvas-container');
      if (canvasContainer) {
        canvasContainer.appendChild(shadowOverlay);
      } else {
        this.borderElement.parentNode.appendChild(shadowOverlay);
      }
    }

    // Position exactly over the image area
    const imageLeft = canvas.canvasLeft + canvas.borderSize;
    const imageTop = canvas.canvasTop + canvas.borderSize;
    const imageWidth = canvas.canvasWidth - (canvas.borderSize * 2);
    const imageHeight = canvas.canvasHeight - (canvas.borderSize * 2);

    shadowOverlay.style.left = `${imageLeft}px`;
    shadowOverlay.style.top = `${imageTop}px`;
    shadowOverlay.style.width = `${imageWidth}px`;
    shadowOverlay.style.height = `${imageHeight}px`;
    shadowOverlay.style.background = 'transparent';

    // Apply shadows based on style - cast inward from all edges
    const style = this.config.style || 'thin';
    
    if (style === 'thick') {
      // Thick: Narrow edge shadows from frame border
      shadowOverlay.style.boxShadow = `
        inset 6px 0 8px -4px rgba(0, 0, 0, 0.3),
        inset -3px 0 5px -2px rgba(0, 0, 0, 0.15),
        inset 0 6px 8px -4px rgba(0, 0, 0, 0.3),
        inset 0 -3px 5px -2px rgba(0, 0, 0, 0.15)
      `;
    } else if (style === 'medium') {
      // Medium: Moderate edge shadows from frame border
      shadowOverlay.style.boxShadow = `
        inset 4px 0 6px -3px rgba(0, 0, 0, 0.25),
        inset -2px 0 4px -2px rgba(0, 0, 0, 0.12),
        inset 0 4px 6px -3px rgba(0, 0, 0, 0.25),
        inset 0 -2px 4px -2px rgba(0, 0, 0, 0.12)
      `;
    } else {
      // Thin: Subtle edge shadows from frame border
      shadowOverlay.style.boxShadow = `
        inset 3px 0 4px -2px rgba(0, 0, 0, 0.2),
        inset -2px 0 3px -1px rgba(0, 0, 0, 0.1),
        inset 0 3px 4px -2px rgba(0, 0, 0, 0.2),
        inset 0 -2px 3px -1px rgba(0, 0, 0, 0.1)
      `;
    }

    console.log(`MatteBorderManager: Created shadow overlay (${style} style) over image area`);
  },

  positionImageLayers(canvas) {
    const imageLayersContainer = document.getElementById('image-layers');
    if (!imageLayersContainer) {
      console.warn('MatteBorderManager: Image layers container not found');
      return;
    }

    // Virtual coordinate system: Keep container at full viewport size
    // Matte border effect is achieved through CSS clipping, not container resizing
    imageLayersContainer.style.position = 'fixed';
    imageLayersContainer.style.left = '0';
    imageLayersContainer.style.top = '0';
    imageLayersContainer.style.width = '100vw';
    imageLayersContainer.style.height = '100vh';
    imageLayersContainer.style.boxSizing = 'border-box';

    // Remove clipping to allow images to extend under the matte border
    // This allows matte border shadows to cast onto the images
    imageLayersContainer.style.clipPath = 'none';

    console.log('MatteBorderManager: Applied virtual coordinate system without clipping');
  },


  handleResize() {
    // Reapply virtual coordinate system on window resize
    if (this.config && this.config.enabled !== false) {
      this.applyConfiguration();
    } else {
      // Ensure virtual coordinate system is maintained even when matte border is disabled
      const imageLayersContainer = document.getElementById('image-layers');
      if (imageLayersContainer) {
        imageLayersContainer.style.position = 'fixed';
        imageLayersContainer.style.left = '0';
        imageLayersContainer.style.top = '0';
        imageLayersContainer.style.width = '100vw';
        imageLayersContainer.style.height = '100vh';
        imageLayersContainer.style.clipPath = 'none';
      }
    }
    
    // Update grid positioning if GridManager is available
    const GridManager = window.App?.GridManager;
    if (GridManager && GridManager.handleResize) {
      GridManager.handleResize();
    }
  },

  // Reset matte canvas (restore to full viewport)
  resetMatteCanvas() {
    const imageLayersContainer = document.getElementById('image-layers');
    if (imageLayersContainer) {
      // Virtual coordinate system: Always keep at full viewport
      imageLayersContainer.style.position = 'fixed';
      imageLayersContainer.style.left = '0';
      imageLayersContainer.style.top = '0';
      imageLayersContainer.style.width = '100vw';
      imageLayersContainer.style.height = '100vh';
      imageLayersContainer.style.clipPath = 'none'; // Images always extend to full area
    }

    // Reset matte border element
    if (this.borderElement) {
      this.borderElement.style.setProperty('position', 'absolute', 'important');
      this.borderElement.style.setProperty('left', '0px', 'important');
      this.borderElement.style.setProperty('top', '0px', 'important');
      this.borderElement.style.setProperty('width', '100%', 'important');
      this.borderElement.style.setProperty('height', '100%', 'important');
      this.borderElement.style.setProperty('border', 'none', 'important');
      this.borderElement.style.setProperty('clip-path', 'none', 'important');
      this.borderElement.style.setProperty('background-color', 'transparent', 'important');
    }

    // Remove the bevel frame element
    const bevelFrame = document.getElementById('bevel-frame');
    if (bevelFrame) {
      bevelFrame.remove();
    }

    // Remove the shadow overlay element
    const shadowOverlay = document.getElementById('shadow-overlay');
    if (shadowOverlay) {
      shadowOverlay.remove();
    }

    // Reset viewport background to original (black)
    this.resetViewportBackground();

    console.log('MatteBorderManager: Reset matte canvas to full viewport');
  },

  resetViewportBackground() {
    // Reset body and canvas container backgrounds, but respect user preferences
    const body = document.body;
    const canvasContainer = document.getElementById('canvas-container');
    
    // Get user's background preference from UI module
    const UI = window.App?.UI;
    const userWantsWhite = UI?.isWhiteBackground || false;
    
    console.log(`MatteBorderManager: Resetting background, user preference is ${userWantsWhite ? 'white' : 'black'}`);

    if (body) {
      // Apply user's preferred background instead of clearing it
      body.style.backgroundColor = userWantsWhite ? 'white' : 'black';
      if (userWantsWhite) {
        body.classList.add('white-background');
      } else {
        body.classList.remove('white-background');
      }
    }

    if (canvasContainer) {
      canvasContainer.style.backgroundColor = ''; // Remove inline style, let CSS take over
    }

    console.log('MatteBorderManager: Reset viewport background to user preference');
  },

  // Get the current effective image area (viewport or matte-clipped area)
  getImageArea() {
    if (!this.config || !this.config.enabled) {
      // No matte border - return full viewport
      return {
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        right: window.innerWidth,
        bottom: window.innerHeight
      };
    }

    // Matte border is active - calculate the image area
    const canvas = this.calculateMatteCanvas();
    const shadowInset = 4; // Match the shadow inset from createMatteClipPath
    
    return {
      left: canvas.canvasLeft + canvas.borderSize + shadowInset,
      top: canvas.canvasTop + canvas.borderSize + shadowInset,
      width: canvas.canvasWidth - (canvas.borderSize * 2) - (shadowInset * 2),
      height: canvas.canvasHeight - (canvas.borderSize * 2) - (shadowInset * 2),
      right: canvas.canvasLeft + canvas.canvasWidth - canvas.borderSize - shadowInset,
      bottom: canvas.canvasTop + canvas.canvasHeight - canvas.borderSize - shadowInset
    };
  }
};