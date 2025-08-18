/**
 * Matte Border Manager - Handles matte border visual effects and image area clipping
 * Extracted from main.js for better modularity
 */
export const MatteBorderManager = {
  borderElement: null,
  config: null,
  configPollingInterval: null,
  lastConfigHash: null,

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

    // Load configuration from API
    console.log('MatteBorderManager: Loading configuration from API');
    this.loadConfiguration();
    
    // Start config polling for hot reload
    this.startConfigPolling();
    
    // Cleanup polling on page unload
    window.addEventListener('beforeunload', () => {
      this.stopConfigPolling();
    });
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

  startConfigPolling() {
    // Clear any existing polling interval
    if (this.configPollingInterval) {
      clearInterval(this.configPollingInterval);
    }
    
    // Poll config API every 10 seconds for hot reload
    this.configPollingInterval = setInterval(() => {
      this.checkForConfigChanges();
    }, 10000);
    
    console.log('MatteBorderManager: Started config polling (10s interval) for hot reload');
  },
  
  stopConfigPolling() {
    if (this.configPollingInterval) {
      clearInterval(this.configPollingInterval);
      this.configPollingInterval = null;
      console.log('MatteBorderManager: Stopped config polling');
    }
  },
  
  async checkForConfigChanges() {
    try {
      const response = await fetch('/api/config', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        console.warn('MatteBorderManager: Config polling failed:', response.status);
        return;
      }
      
      const configData = await response.json();
      const configHash = this.generateConfigHash(configData.matte_border);
      
      // Check if matte border config has changed
      if (this.lastConfigHash && this.lastConfigHash !== configHash) {
        console.log('MatteBorderManager: Config change detected, reloading matte border');
        console.log('MatteBorderManager: Previous config:', this.config);
        console.log('MatteBorderManager: New config:', configData.matte_border);
        
        this.config = configData.matte_border || {};
        this.applyConfiguration();
        
        // Also update global config for other components
        if (window.APP_CONFIG) {
          window.APP_CONFIG.matte_border = configData.matte_border;
        }
        
        console.log('MatteBorderManager: Configuration successfully updated');
      }
      
      this.lastConfigHash = configHash;
      
    } catch (error) {
      console.warn('MatteBorderManager: Config polling error:', error);
    }
  },
  
  generateConfigHash(matteBorderConfig) {
    // Generate a simple hash of the matte border config for change detection
    if (!matteBorderConfig) return 'null';
    
    const configString = JSON.stringify({
      enabled: matteBorderConfig.enabled,
      border_percent: matteBorderConfig.border_percent,
      color: matteBorderConfig.color,
      depth: matteBorderConfig.depth,
      style: matteBorderConfig.style
    });
    
    // Simple string hash function
    let hash = 0;
    for (let i = 0; i < configString.length; i++) {
      const char = configString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
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
        this.config = this.getDefaultConfig();
      }

      console.log('MatteBorderManager: Configuration loaded', this.config);

      // Set initial config hash for change detection
      this.lastConfigHash = this.generateConfigHash(this.config);

      // Delay application to ensure DOM is ready
      setTimeout(() => {
        this.applyConfiguration();
      }, 100);
    } catch (error) {
      console.error('MatteBorderManager: Failed to load configuration:', error);
      this.config = this.getDefaultConfig();
      this.lastConfigHash = this.generateConfigHash(this.config);
      setTimeout(() => {
        this.applyConfiguration();
      }, 100);
    }
  },

  getDefaultConfig() {
    console.log('MatteBorderManager: Using default configuration');
    return {
      enabled: true,
      border_percent: 10,
      color: '#F8F8F8',
      depth: 12, // Default bevel depth in pixels
      style: 'medium', // Default style
      styles: {
        thin: {
          depth: 6,
          top_edge_offset: -25,
          left_edge_offset: -10,
          right_edge_offset: -3,
          bottom_edge_offset: 15,
          shadow_width_multiplier: 6,
          shadow_opacity: 0.03
        },
        medium: {
          depth: 10,
          top_edge_offset: -35,
          left_edge_offset: -15,
          right_edge_offset: -5,
          bottom_edge_offset: 25,
          shadow_width_multiplier: 9,
          shadow_opacity: 0.05
        },
        thick: {
          depth: 16,
          top_edge_offset: -45,
          left_edge_offset: -20,
          right_edge_offset: -8,
          bottom_edge_offset: 35,
          shadow_width_multiplier: 12,
          shadow_opacity: 0.07
        }
      },
      image_area: {
        aspect_ratio: '1:1'
      }
    };
  },

  cleanupExistingElements() {
    // Remove existing 3D bevel frame
    const bevelFrame = document.getElementById('bevel-frame');
    if (bevelFrame) {
      bevelFrame.remove();
    }
    
    // Remove existing canvas-based bevel elements
    this.removeBeveledFrameElements();
    
    // Reset border element styles to clean state
    if (this.borderElement) {
      this.borderElement.style.removeProperty('clip-path');
      this.borderElement.style.removeProperty('background-color');
    }
    
    console.log('MatteBorderManager: Cleaned up existing elements');
  },

  applyConfiguration() {
    if (!this.borderElement || !this.config) {
      console.warn('MatteBorderManager: Cannot apply configuration - missing element or config');
      return;
    }

    console.log('MatteBorderManager: Applying configuration:', this.config);

    // Clean up existing matte border elements before applying new configuration
    this.cleanupExistingElements();

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

    // Use MatteBorderManager's config first (most current from hot reload)
    if (this.config && this.config.image_area && this.config.image_area.aspect_ratio) {
      aspect_ratio = this.config.image_area.aspect_ratio;
    }
    // Fallback to global client-side config if available
    else if (window.APP_CONFIG && window.APP_CONFIG.matte_border && window.APP_CONFIG.matte_border.image_area) {
      aspect_ratio = window.APP_CONFIG.matte_border.image_area.aspect_ratio;
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

    // Use MatteBorderManager's config first (most current from hot reload)
    if (this.config && this.config.border_percent !== undefined) {
      border_percent = this.config.border_percent;
    }
    // Fallback to global client-side config if available
    else if (window.APP_CONFIG && window.APP_CONFIG.matte_border && window.APP_CONFIG.matte_border.border_percent !== undefined) {
      border_percent = window.APP_CONFIG.matte_border.border_percent;
    }
    
    console.log(`MatteBorderManager: Using border_percent: ${border_percent}% from ${this.config && this.config.border_percent !== undefined ? 'MatteBorderManager config' : 'fallback config'}`);

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

    // Create Frame TV style beveled frame
    this.createBeveledFrame(canvas);

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
    let bevelWidth;
    
    if (typeof this.config.depth === 'number') {
      bevelWidth = Math.max(1, Math.min(10, Math.floor(this.config.depth / 4))); // Quarter of main bevel depth, clamped
    } else {
      // Fallback to old style system for backward compatibility
      const style = this.config.style || 'thin';
      if (style === 'thick') {
        bevelWidth = 6;
      } else if (style === 'medium') {
        bevelWidth = 4;
      } else {
        bevelWidth = 2;
      }
    }
    
    bevelFrame.style.left = `${imageLeft - bevelWidth}px`;
    bevelFrame.style.top = `${imageTop - bevelWidth}px`;
    bevelFrame.style.width = `${imageWidth + (bevelWidth * 2)}px`;
    bevelFrame.style.height = `${imageHeight + (bevelWidth * 2)}px`;

    // Remove border entirely - we'll use box-shadow for the entire bevel effect
    bevelFrame.style.border = 'none';
    bevelFrame.style.background = 'transparent'; // Transparent so images show through
    bevelFrame.style.boxSizing = 'border-box';

    // Create a subtle raised edge effect
    const borderColor = this.config.color || '#F8F8F8';
    
    // Create a subtle raised frame edge with multiple shadows
    bevelFrame.style.boxShadow = `
      0 0 0 ${bevelWidth}px ${borderColor},
      inset 1px 1px 2px rgba(255, 255, 255, 0.3),
      inset -1px -1px 2px rgba(0, 0, 0, 0.15)
    `;

    const depthSource = typeof this.config.depth === 'number' ? `${this.config.depth}px depth` : `${this.config.style || 'thin'} style`;
    console.log(`MatteBorderManager: Created 3D bevel frame with ${depthSource} around image area:`, {
      left: imageLeft - bevelWidth,
      top: imageTop - bevelWidth,
      width: imageWidth + (bevelWidth * 2),
      height: imageHeight + (bevelWidth * 2),
      bevelWidth
    });
  },

  createBeveledFrame(canvas) {
    // Clean up any existing beveled frame elements
    this.removeBeveledFrameElements();

    // Calculate frame dimensions
    const imageLeft = canvas.canvasLeft + canvas.borderSize;
    const imageTop = canvas.canvasTop + canvas.borderSize;
    const imageWidth = canvas.canvasWidth - (canvas.borderSize * 2);
    const imageHeight = canvas.canvasHeight - (canvas.borderSize * 2);
    
    // Get bevel depth and style configuration
    let bevelDepth;
    let styleConfig = null;
    
    // First check if we have style configurations
    if (this.config.styles && this.config.style && this.config.styles[this.config.style]) {
      styleConfig = this.config.styles[this.config.style];
      bevelDepth = styleConfig.depth;
    } else if (typeof this.config.depth === 'number') {
      // Direct depth value
      bevelDepth = Math.max(1, Math.min(50, this.config.depth)); // Clamp between 1-50px
    } else {
      // Fallback to old style system for backward compatibility
      const style = this.config.style || 'thin';
      if (style === 'thick') {
        bevelDepth = 20;
      } else if (style === 'medium') {
        bevelDepth = 15;
      } else {
        bevelDepth = 10;
      }
    }

    // Create canvas element for drawing proper bevels
    const bevelCanvas = document.createElement('canvas');
    bevelCanvas.id = 'bevel-canvas';
    bevelCanvas.style.position = 'fixed';
    bevelCanvas.style.left = '0';
    bevelCanvas.style.top = '0';
    bevelCanvas.style.width = '100%';
    bevelCanvas.style.height = '100%';
    bevelCanvas.style.pointerEvents = 'none';
    bevelCanvas.style.zIndex = '55';
    bevelCanvas.width = window.innerWidth * window.devicePixelRatio;
    bevelCanvas.height = window.innerHeight * window.devicePixelRatio;
    
    const ctx = bevelCanvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Draw the beveled frame using canvas
    this.drawBeveledFrame(ctx, imageLeft, imageTop, imageWidth, imageHeight, bevelDepth, styleConfig);
    
    // Append to canvas-container
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
      canvasContainer.appendChild(bevelCanvas);
    } else {
      this.borderElement.parentNode.appendChild(bevelCanvas);
    }

    const depthSource = typeof this.config.depth === 'number' ? `${this.config.depth}px depth` : `${this.config.style || 'thin'} style (${bevelDepth}px)`;
    console.log(`MatteBorderManager: Created canvas-based beveled frame with ${depthSource}`);
  },
  
  drawBeveledFrame(ctx, x, y, width, height, depth, styleConfig = null) {
    // Save the current state
    ctx.save();
    
    // Define the matte color
    const matteColor = this.config.color || '#F8F8F8';
    
    // Function to convert hex to RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 248, g: 248, b: 248 };
    };
    
    const baseColor = hexToRgb(matteColor);
    
    // Use configurable edge offsets or fall back to defaults
    let topOffset, leftOffset, rightOffset, bottomOffset;
    
    if (styleConfig) {
      topOffset = styleConfig.top_edge_offset;
      leftOffset = styleConfig.left_edge_offset;
      rightOffset = styleConfig.right_edge_offset;
      bottomOffset = styleConfig.bottom_edge_offset;
    } else {
      // Default values (matching current medium style)
      topOffset = -35;
      leftOffset = -15;
      rightOffset = -5;
      bottomOffset = 25;
    }
    
    // Create flat colors for each edge based on configurable lighting
    const topColor = `rgb(${Math.max(0, baseColor.r + topOffset)}, ${Math.max(0, baseColor.g + topOffset)}, ${Math.max(0, baseColor.b + topOffset)})`;
    const leftColor = `rgb(${Math.max(0, baseColor.r + leftOffset)}, ${Math.max(0, baseColor.g + leftOffset)}, ${Math.max(0, baseColor.b + leftOffset)})`;
    const rightColor = `rgb(${Math.max(0, baseColor.r + rightOffset)}, ${Math.max(0, baseColor.g + rightOffset)}, ${Math.max(0, baseColor.b + rightOffset)})`;
    const bottomColor = `rgb(${Math.min(255, baseColor.r + bottomOffset)}, ${Math.min(255, baseColor.g + bottomOffset)}, ${Math.min(255, baseColor.b + bottomOffset)})`;
    
    
    // Draw top bevel trapezoid (darkest - in shadow from top-left light)
    ctx.beginPath();
    ctx.moveTo(x - depth, y - depth);
    ctx.lineTo(x + width + depth, y - depth);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fillStyle = topColor;
    ctx.fill();
    
    // Draw right bevel trapezoid (light - catching light)
    ctx.beginPath();
    ctx.moveTo(x + width, y);
    ctx.lineTo(x + width + depth, y - depth);
    ctx.lineTo(x + width + depth, y + height + depth);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fillStyle = rightColor;
    ctx.fill();
    
    // Draw bottom bevel trapezoid (lightest - most lit)
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width + depth, y + height + depth);
    ctx.lineTo(x - depth, y + height + depth);
    ctx.closePath();
    ctx.fillStyle = bottomColor;
    ctx.fill();
    
    // Draw left bevel trapezoid (dark - in shadow)
    ctx.beginPath();
    ctx.moveTo(x - depth, y - depth);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x - depth, y + height + depth);
    ctx.closePath();
    ctx.fillStyle = leftColor;
    ctx.fill();
    
    // Add subtle inner shadow over the painting area
    this.drawInnerShadow(ctx, x, y, width, height, depth, styleConfig);
    
    // Restore the context
    ctx.restore();
  },
  
  drawInnerShadow(ctx, x, y, width, height, depth, styleConfig = null) {
    // Save context for shadow drawing
    ctx.save();
    
    // Calculate shadow parameters from config or use defaults
    let shadowSize, shadowOpacity;
    
    if (styleConfig && styleConfig.shadow_width_multiplier && styleConfig.shadow_opacity) {
      shadowSize = Math.min(depth * styleConfig.shadow_width_multiplier, 150);
      shadowOpacity = styleConfig.shadow_opacity;
    } else {
      // Fallback defaults
      shadowSize = Math.min(depth * 9, 120);
      shadowOpacity = 0.05;
    }
    
    // Create exponential gradient for top shadow (strongest - light comes from top-left)
    const topShadow = ctx.createLinearGradient(0, y, 0, y + shadowSize);
    topShadow.addColorStop(0, `rgba(0, 0, 0, ${shadowOpacity})`);
    topShadow.addColorStop(0.2, `rgba(0, 0, 0, ${shadowOpacity * 0.6})`);
    topShadow.addColorStop(0.4, `rgba(0, 0, 0, ${shadowOpacity * 0.3})`);
    topShadow.addColorStop(0.6, `rgba(0, 0, 0, ${shadowOpacity * 0.1})`);
    topShadow.addColorStop(0.8, `rgba(0, 0, 0, ${shadowOpacity * 0.03})`);
    topShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = topShadow;
    ctx.fillRect(x, y, width, shadowSize);
    
    // Create exponential gradient for left shadow (strong - light comes from top-left)
    const leftShadow = ctx.createLinearGradient(x, 0, x + shadowSize, 0);
    const leftOpacity = shadowOpacity * 0.8;
    leftShadow.addColorStop(0, `rgba(0, 0, 0, ${leftOpacity})`);
    leftShadow.addColorStop(0.2, `rgba(0, 0, 0, ${leftOpacity * 0.6})`);
    leftShadow.addColorStop(0.4, `rgba(0, 0, 0, ${leftOpacity * 0.3})`);
    leftShadow.addColorStop(0.6, `rgba(0, 0, 0, ${leftOpacity * 0.1})`);
    leftShadow.addColorStop(0.8, `rgba(0, 0, 0, ${leftOpacity * 0.03})`);
    leftShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = leftShadow;
    ctx.fillRect(x, y, shadowSize, height);
    
    // Create exponential gradient for right shadow (very subtle - this edge catches light)
    const rightShadow = ctx.createLinearGradient(x + width, 0, x + width - shadowSize * 0.5, 0);
    const rightOpacity = shadowOpacity * 0.3;
    rightShadow.addColorStop(0, `rgba(0, 0, 0, ${rightOpacity})`);
    rightShadow.addColorStop(0.3, `rgba(0, 0, 0, ${rightOpacity * 0.5})`);
    rightShadow.addColorStop(0.6, `rgba(0, 0, 0, ${rightOpacity * 0.2})`);
    rightShadow.addColorStop(0.8, `rgba(0, 0, 0, ${rightOpacity * 0.05})`);
    rightShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = rightShadow;
    ctx.fillRect(x + width - shadowSize * 0.5, y, shadowSize * 0.5, height);
    
    // Create exponential gradient for bottom shadow (weakest - this edge is most lit)
    const bottomShadow = ctx.createLinearGradient(0, y + height, 0, y + height - shadowSize * 0.3);
    const bottomOpacity = shadowOpacity * 0.2;
    bottomShadow.addColorStop(0, `rgba(0, 0, 0, ${bottomOpacity})`);
    bottomShadow.addColorStop(0.3, `rgba(0, 0, 0, ${bottomOpacity * 0.5})`);
    bottomShadow.addColorStop(0.6, `rgba(0, 0, 0, ${bottomOpacity * 0.2})`);
    bottomShadow.addColorStop(0.8, `rgba(0, 0, 0, ${bottomOpacity * 0.05})`);
    bottomShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = bottomShadow;
    ctx.fillRect(x, y + height - shadowSize * 0.3, width, shadowSize * 0.3);
    
    // Create subtle corner shadows for realism
    this.drawCornerShadows(ctx, x, y, width, height, shadowSize, shadowOpacity);
    
    ctx.restore();
  },
  
  drawCornerShadows(ctx, x, y, width, height, shadowSize, shadowOpacity) {
    // Top-left corner (strongest shadow) - exponential falloff
    const topLeftGradient = ctx.createRadialGradient(
      x, y, 0, 
      x, y, shadowSize
    );
    const tlOpacity = shadowOpacity * 0.4;
    topLeftGradient.addColorStop(0, `rgba(0, 0, 0, ${tlOpacity})`);
    topLeftGradient.addColorStop(0.2, `rgba(0, 0, 0, ${tlOpacity * 0.5})`);
    topLeftGradient.addColorStop(0.4, `rgba(0, 0, 0, ${tlOpacity * 0.2})`);
    topLeftGradient.addColorStop(0.6, `rgba(0, 0, 0, ${tlOpacity * 0.05})`);
    topLeftGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = topLeftGradient;
    ctx.fillRect(x, y, shadowSize, shadowSize);
    
    // Top-right corner (medium shadow) - exponential falloff
    const topRightGradient = ctx.createRadialGradient(
      x + width, y, 0,
      x + width, y, shadowSize * 0.7
    );
    const trOpacity = shadowOpacity * 0.2;
    topRightGradient.addColorStop(0, `rgba(0, 0, 0, ${trOpacity})`);
    topRightGradient.addColorStop(0.3, `rgba(0, 0, 0, ${trOpacity * 0.4})`);
    topRightGradient.addColorStop(0.6, `rgba(0, 0, 0, ${trOpacity * 0.1})`);
    topRightGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = topRightGradient;
    ctx.fillRect(x + width - shadowSize * 0.7, y, shadowSize * 0.7, shadowSize * 0.7);
    
    // Bottom-left corner (light shadow) - exponential falloff
    const bottomLeftGradient = ctx.createRadialGradient(
      x, y + height, 0,
      x, y + height, shadowSize * 0.5
    );
    const blOpacity = shadowOpacity * 0.15;
    bottomLeftGradient.addColorStop(0, `rgba(0, 0, 0, ${blOpacity})`);
    bottomLeftGradient.addColorStop(0.3, `rgba(0, 0, 0, ${blOpacity * 0.3})`);
    bottomLeftGradient.addColorStop(0.6, `rgba(0, 0, 0, ${blOpacity * 0.08})`);
    bottomLeftGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = bottomLeftGradient;
    ctx.fillRect(x, y + height - shadowSize * 0.5, shadowSize * 0.5, shadowSize * 0.5);
  },
  


  removeBeveledFrameElements() {
    // Remove existing beveled frame container and all its children
    const existingContainer = document.getElementById('beveled-frame-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Remove canvas-based bevel if it exists
    const bevelCanvas = document.getElementById('bevel-canvas');
    if (bevelCanvas) {
      bevelCanvas.remove();
    }
    
    // Also remove old shadow overlay if it exists
    const shadowOverlay = document.getElementById('shadow-overlay');
    if (shadowOverlay) {
      shadowOverlay.remove();
    }
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
    // Clear any existing resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    // Debounce resize to avoid excessive redraws
    this.resizeTimeout = setTimeout(() => {
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
    }, 100);
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

    // Remove the beveled frame elements
    this.removeBeveledFrameElements();

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