/**
 * Drop Shadow Manager - Handles configurable exponential decay drop shadow around canvas
 * Appears over the matte border if present
 */
export const DropShadowManager = {
  shadowElement: null,
  config: null,

  init(config) {
    console.log('DropShadowManager: Starting initialization...');
    this.config = config;
    
    console.log('DropShadowManager: Config received:', !!config);
    console.log('DropShadowManager: Shadow config:', config?.canvas_drop_shadow);
    
    // Try the dedicated shadow element first, then fall back to canvas container
    this.shadowElement = document.getElementById('canvas-drop-shadow') || document.getElementById('canvas-container');
    
    if (!this.shadowElement) {
      console.error('DropShadowManager: Canvas container element not found');
      return;
    }

    console.log('DropShadowManager: Shadow element found:', this.shadowElement.id, this.shadowElement);
    console.log('DropShadowManager: Initialized with config:', this.config?.canvas_drop_shadow);
    
    // Apply initial shadow settings from config
    this.updateShadow();
  },

  /**
   * Update the drop shadow based on current config settings
   */
  updateShadow() {
    console.log('DropShadowManager: updateShadow() called');
    console.log('DropShadowManager: shadowElement exists:', !!this.shadowElement);
    console.log('DropShadowManager: config exists:', !!this.config);
    console.log('DropShadowManager: canvas_drop_shadow config exists:', !!this.config?.canvas_drop_shadow);
    
    if (!this.shadowElement || !this.config?.canvas_drop_shadow) {
      console.warn('DropShadowManager: updateShadow aborted - missing element or config');
      console.warn('DropShadowManager: shadowElement:', !!this.shadowElement);
      console.warn('DropShadowManager: config:', !!this.config);
      console.warn('DropShadowManager: canvas_drop_shadow:', !!this.config?.canvas_drop_shadow);
      if (this.config) {
        console.warn('DropShadowManager: Full config keys:', Object.keys(this.config));
      }
      return;
    }

    const shadowConfig = this.config.canvas_drop_shadow;
    const enabled = shadowConfig.enabled || false;
    const opacity = shadowConfig.opacity || 0;
    
    // Calculate width as percentage of viewport size (use smaller dimension)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const baseSize = Math.min(viewportWidth, viewportHeight);
    const width = Math.round((baseSize * (shadowConfig.width_percent || 0)) / 100);

    console.log('DropShadowManager: Updating shadow - enabled:', enabled, 'opacity:', opacity, 'width:', width + 'px', '(' + (shadowConfig.width_percent || 0) + '% of', baseSize + 'px)');

    if (!enabled || opacity === 0 || width === 0) {
      // No shadow
      console.log('DropShadowManager: Setting shadow to none');
      this.shadowElement.style.boxShadow = 'none';
    } else {
      // Create exponential decay shadow with multiple layers
      console.log('DropShadowManager: Generating shadow with width:', width, 'opacity:', opacity);
      const shadows = this.generateExponentialShadow(width, opacity);
      this.shadowElement.style.boxShadow = shadows;
      
      // Add inset shadow for interior glow effect
      if (this.shadowElement.id === 'canvas-drop-shadow') {
        this.shadowElement.style.backgroundColor = 'transparent';
        this.shadowElement.style.border = '1px solid rgba(255,255,255,0.01)'; // Almost invisible border for shadow anchor
      }
      
      console.log('DropShadowManager: Applied shadow to element:', this.shadowElement.tagName, 'id:', this.shadowElement.id);
      console.log('DropShadowManager: Element computed style - display:', getComputedStyle(this.shadowElement).display, 'position:', getComputedStyle(this.shadowElement).position, 'zIndex:', getComputedStyle(this.shadowElement).zIndex);
    }
  },

  /**
   * Generate exponential decay shadow with multiple layers for smooth falloff
   * @param {number} maxWidth - Maximum shadow width in pixels
   * @param {number} maxOpacity - Maximum opacity (0-1)
   * @returns {string} CSS box-shadow value
   */
  generateExponentialShadow(maxWidth, maxOpacity) {
    const layers = [];
    const numLayers = 6; // Number of shadow layers for smooth gradient
    
    // Create shadow layers from innermost (smallest, strongest) to outermost (largest, faintest)
    for (let i = 1; i <= numLayers; i++) {
      // Progressive width increase for each layer
      const layerWidth = Math.round((maxWidth * i) / numLayers);
      
      // Exponential opacity decay - starts high, falls off quickly
      const decayFactor = Math.exp(-(i - 1) * 0.8); // Start at full opacity for first layer
      const layerOpacity = (maxOpacity * decayFactor).toFixed(3);
      
      // Create outset shadow layer
      layers.push(`0 0 ${layerWidth}px rgba(0, 0, 0, ${layerOpacity})`);
      
      // Add inset shadow for interior glow effect
      if (i <= 2) {
        layers.push(`inset 0 0 ${layerWidth}px rgba(0, 0, 0, ${(layerOpacity * 0.3).toFixed(3)})`);
      }
    }
    
    const result = layers.join(', ');
    console.log('DropShadowManager: Generated shadow CSS:', result);
    return result;
  },

  /**
   * Get current shadow configuration
   * @returns {Object} Shadow configuration object
   */
  getConfig() {
    return this.config?.canvas_drop_shadow || { enabled: false, opacity: 0, width_px: 0 };
  }
};