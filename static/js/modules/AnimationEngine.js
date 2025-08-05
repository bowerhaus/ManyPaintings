/**
 * Animation Engine - Complete version with all essential methods
 * Extracted and adapted from main.js for better modularity
 */
export const AnimationEngine = {
  layersContainer: null,
  activeLayers: new Map(),
  animationId: null,
  isPlaying: true,
  frameRate: 30,
  frameInterval: 1000 / 30,
  lastFrameTime: 0,
  transformationCache: new Map(),
  ruleOfThirdsIndex: 0,
  debugBordersVisible: false,

  init() {
    this.layersContainer = document.getElementById('image-layers');
    const config = window.APP_CONFIG || {};
    this.frameRate = config.application?.animation_fps || 30;
    this.frameInterval = 1000 / this.frameRate;

    if (!this.layersContainer) {
      throw new Error('Image layers container not found');
    }

    // Apply animation quality class to body
    document.body.className = `animation-quality-${config.animationQuality || 'high'}`;

    // Initialize virtual coordinate system
    this.initializeVirtualCoordinateSystem();

    // Initialize debug boxes since grid is visible by default
    setTimeout(() => {
      const grid = document.getElementById('rule-of-thirds-grid');
      if (grid && grid.style.display !== 'none') {
        this.toggleImageBoxes(true);
      }
      this.updateCenterDotVisibility();
    }, 100);

    console.log(`AnimationEngine: Initialized with ${this.frameRate} FPS target and virtual coordinate system`);
    console.log(`AnimationEngine: Max concurrent layers: ${config.layer_management?.max_concurrent_layers || 5}`);
    console.log(`AnimationEngine: Animation quality: ${config.animationQuality || 'high'}`);
  },

  initializeVirtualCoordinateSystem() {
    if (this.layersContainer) {
      this.layersContainer.style.position = 'fixed';
      this.layersContainer.style.left = '0';
      this.layersContainer.style.top = '0';
      this.layersContainer.style.width = '100vw';
      this.layersContainer.style.height = '100vh';
      this.layersContainer.style.zIndex = '10';
      console.log('AnimationEngine: Virtual coordinate system initialized - container set to full viewport');
    }
  },

  start() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      
      // Resume all paused layer animations
      this.activeLayers.forEach((layerInfo, imageId) => {
        if (layerInfo.layer && layerInfo.layer.parentNode) {
          // Update start time to account for pause duration
          if (layerInfo.pausedAt) {
            const pauseDuration = Date.now() - layerInfo.pausedAt;
            layerInfo.startTime += pauseDuration;
            delete layerInfo.pausedAt;
          }
          
          // Only resume layers that were actually paused
          if (layerInfo.pausedOpacity !== undefined) {
            console.log(`AnimationEngine: Resuming layer ${imageId} from opacity ${layerInfo.pausedOpacity}, phase: ${layerInfo.pausedPhase}, remaining: ${layerInfo.pausedTimeRemaining}ms`);
            
            // Resume based on paused phase
            if (layerInfo.pausedPhase === 'fade-in') {
              // Continue fade-in from current opacity to target opacity
              console.log(`Resuming fade-in with ${layerInfo.pausedTimeRemaining}ms remaining, target opacity: ${layerInfo.opacity}`);
              layerInfo.layer.style.transition = `opacity ${layerInfo.pausedTimeRemaining}ms ease-in-out`;
              layerInfo.layer.style.opacity = layerInfo.opacity;
              
              layerInfo.holdTimeout = setTimeout(() => {
                console.log(`Layer ${imageId} fade-in complete, starting hold phase for ${layerInfo.holdTime}ms`);
                layerInfo.phase = 'hold';
                layerInfo.holdTimeout = setTimeout(() => {
                  if (layerInfo.phase === 'hold') {
                    console.log(`Layer ${imageId} hold complete, starting fade-out`);
                    this.startFadeOut(layerInfo);
                  }
                }, layerInfo.holdTime);
              }, layerInfo.pausedTimeRemaining);
              
            } else if (layerInfo.pausedPhase === 'hold') {
              // Resume hold phase - just wait for remaining time
              console.log(`Resuming hold phase with ${layerInfo.pausedTimeRemaining}ms remaining`);
              layerInfo.holdTimeout = setTimeout(() => {
                if (layerInfo.phase === 'hold') {
                  console.log(`Layer ${imageId} hold complete, starting fade-out`);
                  this.startFadeOut(layerInfo);
                }
              }, layerInfo.pausedTimeRemaining);
              
            } else if (layerInfo.pausedPhase === 'fade-out') {
              // Resume fade-out with remaining time
              console.log(`Resuming fade-out with remaining time ${layerInfo.pausedTimeRemaining}ms`);
              layerInfo.layer.style.transition = `opacity ${layerInfo.pausedTimeRemaining}ms ease-in-out`;
              layerInfo.layer.style.opacity = '0';
              
              setTimeout(() => {
                this.removeLayer(layerInfo);
              }, layerInfo.pausedTimeRemaining);
            }
            
            // Clean up pause data
            delete layerInfo.pausedOpacity;
            delete layerInfo.pausedTimeRemaining;
            delete layerInfo.pausedPhase;
          }
        }
      });
      
      console.log(`AnimationEngine: Started and resumed ${this.activeLayers.size} layer animations`);
      this.animate();
    }
  },

  stop() {
    this.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Pause all layer animations by freezing their current state
    this.activeLayers.forEach((layerInfo, imageId) => {
      if (layerInfo.layer && layerInfo.layer.parentNode) {
        // Store current computed opacity BEFORE removing transitions
        const currentOpacity = getComputedStyle(layerInfo.layer).opacity;
        layerInfo.pausedOpacity = parseFloat(currentOpacity);
        
        // Remove transitions and immediately set to current computed opacity
        layerInfo.layer.style.transition = 'none';
        layerInfo.layer.style.opacity = currentOpacity;
        
        console.log(`AnimationEngine: Paused layer ${imageId} at opacity ${layerInfo.pausedOpacity}`);
      }
      
      // Clear any pending timeouts and calculate remaining time
      if (layerInfo.holdTimeout) {
        clearTimeout(layerInfo.holdTimeout);
        layerInfo.holdTimeout = null;
        
        const elapsed = Date.now() - layerInfo.startTime;
        
        console.log(`Layer ${imageId} pause timing - elapsed: ${elapsed}ms, stored phase: ${layerInfo.phase}, fadeIn: ${layerInfo.fadeInDuration}ms, hold: ${layerInfo.holdTime}ms`);
        
        // Calculate actual phase based on elapsed time, not stored phase
        if (elapsed < layerInfo.fadeInDuration) {
          // Still in fade-in phase
          layerInfo.pausedTimeRemaining = Math.max(0, layerInfo.fadeInDuration - elapsed);
          layerInfo.pausedPhase = 'fade-in';
          console.log(`Actually in fade-in phase - remaining: ${layerInfo.pausedTimeRemaining}ms`);
        } else if (elapsed < layerInfo.fadeInDuration + layerInfo.holdTime) {
          // In hold phase
          const holdElapsed = elapsed - layerInfo.fadeInDuration;
          layerInfo.pausedTimeRemaining = Math.max(0, layerInfo.holdTime - holdElapsed);
          layerInfo.pausedPhase = 'hold';
          console.log(`Actually in hold phase - holdElapsed: ${holdElapsed}ms, remaining: ${layerInfo.pausedTimeRemaining}ms`);
        } else {
          // In fade-out phase
          layerInfo.pausedPhase = 'fade-out';
          const fadeOutElapsed = elapsed - layerInfo.fadeInDuration - layerInfo.holdTime;
          layerInfo.pausedTimeRemaining = Math.max(0, layerInfo.fadeOutDuration - fadeOutElapsed);
          console.log(`Actually in fade-out phase - fadeOutElapsed: ${fadeOutElapsed}ms, remaining: ${layerInfo.pausedTimeRemaining}ms`);
        }
        
        // Store when we paused for accurate resume timing
        layerInfo.pausedAt = Date.now();
      }
    });
    
    console.log(`AnimationEngine: Stopped and paused ${this.activeLayers.size} layer animations`);
  },

  animate(currentTime = 0) {
    if (!this.isPlaying) return;

    if (currentTime - this.lastFrameTime >= this.frameInterval) {
      this.updateLayers();
      this.lastFrameTime = currentTime;
    }

    this.animationId = requestAnimationFrame(this.animate.bind(this));
  },

  updateLayers() {
    // Animation logic will be implemented by PatternManager
  },

  async showImage(imageId, options = {}) {
    // Check if this image is already being displayed on a layer
    if (this.activeLayers.has(imageId)) {
      console.log(`AnimationEngine: Image ${imageId} already active on a layer, skipping duplicate`);
      return null;
    }

    const config = window.APP_CONFIG || {};
    // Check if we've reached the concurrent layer limit
    if (this.activeLayers.size >= (config.layer_management?.max_concurrent_layers || 5)) {
      console.log(`AnimationEngine: Max concurrent layers (${config.layer_management?.max_concurrent_layers || 5}) reached, skipping ${imageId}`);
      return null;
    }

    try {
      // Access ImageManager and UI through global App object
      const ImageManager = window.App?.ImageManager;
      const UI = window.App?.UI;
      
      if (!ImageManager) {
        throw new Error('ImageManager not available');
      }

      const img = await ImageManager.loadImage(imageId);

      // Generate deterministic timing and transformation parameters
      const speedMultiplier = UI?.speedMultiplier || 1.0;

      // Create seeded random generator for this specific image instance
      const animationSeed = options.seed ? `${imageId}-${options.seed}-animation` : imageId;
      const animationRandom = this.seededRandom(this.hashCode(animationSeed));

      const baseFadeInDuration = this.seededRandomBetween(animationRandom, config.animation_timing?.fade_in_min_sec || 2, config.animation_timing?.fade_in_max_sec || 5) * 1000;
      const baseFadeOutDuration = this.seededRandomBetween(animationRandom, config.animation_timing?.fade_out_min_sec || 3, config.animation_timing?.fade_out_max_sec || 6) * 1000;
      const baseHoldTime = this.seededRandomBetween(animationRandom, config.animation_timing?.min_hold_time_sec || 4, config.animation_timing?.max_hold_time_sec || 12) * 1000;

      const fadeInDuration = baseFadeInDuration / speedMultiplier;
      const fadeOutDuration = baseFadeOutDuration / speedMultiplier;
      const holdTime = baseHoldTime / speedMultiplier;
      const minOpacity = config.layer_management?.min_opacity || 0.7;
      const maxOpacity = config.layer_management?.max_opacity || 0.8;
      const opacity = Math.min(maxOpacity, animationRandom() * (maxOpacity - minOpacity) + minOpacity);

      console.log(`AnimationEngine: Speed ${speedMultiplier}x - fadeIn: ${fadeInDuration}ms, hold: ${holdTime}ms, fadeOut: ${fadeOutDuration}ms`);

      const transformations = this.generateTransformations(img, imageId, options.seed);
      const layer = this.createLayer(imageId, img, transformations);

      this.layersContainer.appendChild(layer);

      const layerInfo = {
        layer,
        startTime: Date.now(),
        fadeInDuration,
        fadeOutDuration,
        holdTime,
        opacity,
        transformations,
        phase: 'fade-in',
        originalSpeed: speedMultiplier,
        holdTimeout: null
      };

      this.activeLayers.set(imageId, layerInfo);

      // Start fade in animation
      this.startFadeIn(layerInfo);

      return layer;

    } catch (error) {
      console.error(`AnimationEngine: Failed to show image ${imageId}:`, error);
      throw error;
    }
  },

  startFadeIn(layerInfo) {
    const { layer, fadeInDuration, opacity } = layerInfo;

    // First set opacity to 0 without transition
    layer.style.opacity = '0';

    // Force a reflow to ensure the opacity change is applied
    layer.offsetHeight;

    // Then set the transition and target opacity
    requestAnimationFrame(() => {
      layer.style.transition = `opacity ${fadeInDuration}ms ease-in-out`;
      layer.style.opacity = opacity;
      layerInfo.phase = 'hold';

      // Schedule hold phase end
      layerInfo.holdTimeout = setTimeout(() => {
        if (layerInfo.phase === 'hold') {
          this.startFadeOut(layerInfo);
        }
      }, layerInfo.holdTime);
    });
  },

  startFadeOut(layerInfo) {
    const { layer, fadeOutDuration } = layerInfo;

    layerInfo.phase = 'fade-out';
    layer.style.transition = `opacity ${fadeOutDuration}ms ease-in-out`;
    layer.style.opacity = '0';

    // Remove layer after fade out completes
    setTimeout(() => {
      this.removeLayer(layerInfo);
    }, fadeOutDuration);
  },

  removeLayer(layerInfo) {
    const { layer, holdTimeout } = layerInfo;

    // Clear any pending timeouts
    if (holdTimeout) {
      clearTimeout(holdTimeout);
      layerInfo.holdTimeout = null;
    }

    if (layer.parentNode) {
      layer.parentNode.removeChild(layer);
    }

    // Find and remove from activeLayers
    for (const [imageId, info] of this.activeLayers.entries()) {
      if (info === layerInfo) {
        this.activeLayers.delete(imageId);
        break;
      }
    }
  },

  clearAllLayers() {
    console.log('AnimationEngine: Clearing all layers with fade-out');
    
    this.activeLayers.forEach((layerInfo, imageId) => {
      // Clear any pending timeouts first
      if (layerInfo.holdTimeout) {
        clearTimeout(layerInfo.holdTimeout);
        layerInfo.holdTimeout = null;
      }
      
      // If layer is paused, clear pause state and enable transitions
      if (layerInfo.pausedOpacity !== undefined) {
        delete layerInfo.pausedOpacity;
        delete layerInfo.pausedTimeRemaining;
        delete layerInfo.pausedPhase;
        delete layerInfo.pausedAt;
      }
      
      if (layerInfo.phase !== 'fade-out') {
        // Start fade-out immediately for layers not already fading out
        this.startFadeOut(layerInfo);
      }
    });
  },

  clearAllLayersImmediate() {
    console.log('AnimationEngine: Clearing all layers immediately');
    
    this.activeLayers.forEach((layerInfo) => {
      if (layerInfo.holdTimeout) {
        clearTimeout(layerInfo.holdTimeout);
      }
      if (layerInfo.layer && layerInfo.layer.parentNode) {
        layerInfo.layer.parentNode.removeChild(layerInfo.layer);
      }
    });
    
    this.activeLayers.clear();
    
    if (this.layersContainer) {
      this.layersContainer.innerHTML = '';
    }
  },

  generateTransformations(img, imageId, seed = null) {
    const config = window.APP_CONFIG || {};
    const transformSeed = seed ? `${imageId}-${seed}` : imageId;

    if (config.preloadTransformCache && this.transformationCache.has(transformSeed)) {
      return this.transformationCache.get(transformSeed);
    }

    const random = this.seededRandom(this.hashCode(transformSeed));

    const transformations = {
      rotation: 0,
      scale: 1,
      translateX: 0,
      translateY: 0,
      hueShift: 0
    };

    if (config.transformations?.rotation?.enabled) {
      transformations.rotation = random() * (config.transformations.rotation.max_degrees - config.transformations.rotation.min_degrees) + config.transformations.rotation.min_degrees;
    }

    if (config.transformations?.scale?.enabled) {
      transformations.scale = random() * (config.transformations.scale.max_factor - config.transformations.scale.min_factor) + config.transformations.scale.min_factor;
    }

    // Translation logic based on layout mode
    if (config.transformations?.translation?.enabled) {
      const layoutMode = config.transformations?.translation?.layout_mode;
      
      if (layoutMode === 'rule_of_thirds') {
        // Get rule of thirds points from GridManager (accounts for matte border)
        const GridManager = window.App?.GridManager;
        const ruleOfThirdsPoints = GridManager ? GridManager.getRuleOfThirdsPoints() : null;
        
        if (ruleOfThirdsPoints && ruleOfThirdsPoints.length >= 4) {
          // Use the first 4 points (excluding center)
          const point = ruleOfThirdsPoints[this.ruleOfThirdsIndex % 4];
          this.ruleOfThirdsIndex = (this.ruleOfThirdsIndex + 1) % 4;

          // Apply deviation if configured
          let finalX = point.x;
          let finalY = point.y;
          
          const maxHorizontalDev = (config.transformations?.translation?.rule_of_thirds?.max_horizontal_deviation_percent || 0) / 100;
          const maxVerticalDev = (config.transformations?.translation?.rule_of_thirds?.max_vertical_deviation_percent || 0) / 100;
          
          if (maxHorizontalDev > 0 || maxVerticalDev > 0) {
            // Get the effective image area for deviation calculation
            const MatteBorderManager = window.App?.MatteBorderManager;
            const imageArea = MatteBorderManager ? MatteBorderManager.getImageArea() : { width: window.innerWidth, height: window.innerHeight };
            
            const horizontalDeviation = (random() - 0.5) * 2 * maxHorizontalDev * imageArea.width;
            const verticalDeviation = (random() - 0.5) * 2 * maxVerticalDev * imageArea.height;
            
            finalX = Math.max(imageArea.left, Math.min(imageArea.left + imageArea.width, point.x + horizontalDeviation));
            finalY = Math.max(imageArea.top, Math.min(imageArea.top + imageArea.height, point.y + verticalDeviation));
          }

          // Convert absolute position to offset from viewport center
          const viewportCenterX = window.innerWidth / 2;
          const viewportCenterY = window.innerHeight / 2;
          
          transformations.translateX = finalX - viewportCenterX;
          transformations.translateY = finalY - viewportCenterY;
          transformations.useViewportUnits = false; // Use pixels since we have absolute coordinates

          console.log(`Rule of thirds: Point ${this.ruleOfThirdsIndex === 0 ? 4 : this.ruleOfThirdsIndex} → translate(${transformations.translateX.toFixed(1)}px, ${transformations.translateY.toFixed(1)}px)`);
        } else {
          // Fallback to old viewport-based calculation
          const intersectionPoints = [
            { x: 1 / 3, y: 1 / 3 },    // Top-left
            { x: 2 / 3, y: 1 / 3 },    // Top-right
            { x: 1 / 3, y: 2 / 3 },    // Bottom-left
            { x: 2 / 3, y: 2 / 3 },    // Bottom-right
          ];

          const point = intersectionPoints[this.ruleOfThirdsIndex];
          this.ruleOfThirdsIndex = (this.ruleOfThirdsIndex + 1) % intersectionPoints.length;

          const viewportOffsetX = (point.x - 0.5) * 100;
          const viewportOffsetY = (point.y - 0.5) * 100;
          
          transformations.translateX = viewportOffsetX;
          transformations.translateY = viewportOffsetY;
          transformations.useViewportUnits = true;
        }

      } else if (layoutMode === 'rule_of_thirds_and_centre') {
        // Get rule of thirds points from GridManager (accounts for matte border)
        const GridManager = window.App?.GridManager;
        const ruleOfThirdsPoints = GridManager ? GridManager.getRuleOfThirdsPoints() : null;
        
        if (ruleOfThirdsPoints && ruleOfThirdsPoints.length >= 5) {
          // Use all 5 points (including center)
          const point = ruleOfThirdsPoints[this.ruleOfThirdsIndex];
          this.ruleOfThirdsIndex = (this.ruleOfThirdsIndex + 1) % 5;

          // Apply deviation if configured
          let finalX = point.x;
          let finalY = point.y;
          
          const maxHorizontalDev = (config.transformations?.translation?.rule_of_thirds_and_centre?.max_horizontal_deviation_percent || 0) / 100;
          const maxVerticalDev = (config.transformations?.translation?.rule_of_thirds_and_centre?.max_vertical_deviation_percent || 0) / 100;
          
          if (maxHorizontalDev > 0 || maxVerticalDev > 0) {
            // Get the effective image area for deviation calculation
            const MatteBorderManager = window.App?.MatteBorderManager;
            const imageArea = MatteBorderManager ? MatteBorderManager.getImageArea() : { width: window.innerWidth, height: window.innerHeight };
            
            const horizontalDeviation = (random() - 0.5) * 2 * maxHorizontalDev * imageArea.width;
            const verticalDeviation = (random() - 0.5) * 2 * maxVerticalDev * imageArea.height;
            
            finalX = Math.max(imageArea.left, Math.min(imageArea.left + imageArea.width, point.x + horizontalDeviation));
            finalY = Math.max(imageArea.top, Math.min(imageArea.top + imageArea.height, point.y + verticalDeviation));
          }

          // Convert absolute position to offset from viewport center
          const viewportCenterX = window.innerWidth / 2;
          const viewportCenterY = window.innerHeight / 2;
          
          transformations.translateX = finalX - viewportCenterX;
          transformations.translateY = finalY - viewportCenterY;
          transformations.useViewportUnits = false; // Use pixels since we have absolute coordinates

          console.log(`Rule of thirds + center: Point ${this.ruleOfThirdsIndex === 0 ? 5 : this.ruleOfThirdsIndex} → translate(${transformations.translateX.toFixed(1)}px, ${transformations.translateY.toFixed(1)}px)`);
        } else {
          // Fallback to old viewport-based calculation
          const intersectionPoints = [
            { x: 1 / 3, y: 1 / 3 },    // Top-left
            { x: 2 / 3, y: 1 / 3 },    // Top-right
            { x: 1 / 3, y: 2 / 3 },    // Bottom-left
            { x: 2 / 3, y: 2 / 3 },    // Bottom-right
            { x: 0.5, y: 0.5 },        // Center
          ];

          const point = intersectionPoints[this.ruleOfThirdsIndex];
          this.ruleOfThirdsIndex = (this.ruleOfThirdsIndex + 1) % intersectionPoints.length;

          const viewportOffsetX = (point.x - 0.5) * 100;
          const viewportOffsetY = (point.y - 0.5) * 100;
          
          transformations.translateX = viewportOffsetX;
          transformations.translateY = viewportOffsetY;
          transformations.useViewportUnits = true;
        }
        
      } else {
        // Random mode or fallback
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        transformations.translateX = (random() - 0.5) * viewportWidth * 0.3;
        transformations.translateY = (random() - 0.5) * viewportHeight * 0.3;
      }
    }

    if (config.transformations?.color_remapping?.enabled) {
      transformations.hueShift = random() * 360;
    }

    if (config.preloadTransformCache) {
      this.transformationCache.set(transformSeed, transformations);
    }

    return transformations;
  },

  createLayer(imageId, img, transformations) {
    const config = window.APP_CONFIG || {};
    const layer = document.createElement('div');
    layer.className = 'image-layer';
    layer.id = `layer-${imageId}`;

    const imageElement = document.createElement('img');
    imageElement.src = img.src;
    imageElement.alt = 'Generated art layer';

    // Apply transformations
    const { rotation, scale, translateX, translateY, hueShift } = transformations;
    
    // Start with centering transform
    let transform = 'translate(-50%, -50%) ';
    
    // Add user transformations
    if (translateX !== 0 || translateY !== 0) {
      if (transformations.useViewportUnits) {
        transform += `translate(${translateX}vw, ${translateY}vh) `;
      } else {
        transform += `translate(${translateX}px, ${translateY}px) `;
      }
    }
    if (rotation !== 0) {
      transform += `rotate(${rotation}deg) `;
    }
    if (scale !== 1) {
      transform += `scale(${scale}) `;
    }

    imageElement.style.transform = transform;

    if (hueShift !== 0) {
      imageElement.style.filter = `hue-rotate(${hueShift}deg)`;
    }

    // Apply best fit scaling if enabled
    if (config.transformations?.best_fit_scaling?.enabled === true) {
      imageElement.style.maxWidth = '100vw';
      imageElement.style.maxHeight = '100vh';
      imageElement.style.objectFit = 'contain';
    } else {
      // When best fit scaling is disabled, set explicit dimensions
      const originalWidth = img.naturalWidth || img.width;
      const originalHeight = img.naturalHeight || img.height;
      imageElement.style.width = `${originalWidth}px`;
      imageElement.style.height = `${originalHeight}px`;
    }

    // Add debug border if grid is visible
    const grid = document.getElementById('rule-of-thirds-grid');
    if (grid && grid.style.display !== 'none' && grid.style.display !== '') {
      imageElement.style.border = '3px solid rgba(0, 255, 0, 0.9)';
      imageElement.style.boxShadow = '0 0 0 1px rgba(0, 255, 0, 0.5)';
      console.log('Applied debug borders to new image layer');
    }

    layer.appendChild(imageElement);
    return layer;
  },

  async showImageFromFavorite(imageId, options = {}) {
    try {
      const ImageManager = window.App?.ImageManager;
      if (!ImageManager) {
        throw new Error('ImageManager not available');
      }

      const img = await ImageManager.loadImage(imageId);
      const favoriteData = options.favoriteData;
      
      if (!favoriteData) {
        throw new Error('No favorite data provided');
      }

      const layer = this.createLayer(imageId, img, favoriteData.transformations);
      
      // Set initial opacity to saved opacity
      layer.style.opacity = favoriteData.opacity;
      
      this.layersContainer.appendChild(layer);

      // Create layer info for fade-out timing
      const config = window.APP_CONFIG || {};
      const layerIndex = options.layerIndex || 0;
      const holdTime = Math.random() * 3000 + 2000; // 2-5 seconds
      const fadeOutDuration = Math.random() * 45000 + 15000; // 15-60 seconds

      const layerInfo = {
        layer,
        startTime: Date.now(),
        fadeInDuration: 0,
        fadeOutDuration,
        holdTime,
        opacity: favoriteData.opacity,
        transformations: favoriteData.transformations,
        phase: 'hold',
        holdTimeout: null
      };

      this.activeLayers.set(imageId, layerInfo);

      // Schedule fade out
      layerInfo.holdTimeout = setTimeout(() => {
        this.startFadeOut(layerInfo);
      }, holdTime);

      return layer;

    } catch (error) {
      console.error(`AnimationEngine: Failed to show image from favorite ${imageId}:`, error);
      throw error;
    }
  },

  toggleImageBoxes(showBoxes) {
    const layers = this.layersContainer.querySelectorAll('.image-layer');
    console.log(`Toggling debug boxes: ${showBoxes}, found ${layers.length} layers`);

    layers.forEach(layer => {
      const img = layer.querySelector('img');
      if (showBoxes) {
        if (img) {
          img.style.border = '3px solid rgba(0, 255, 0, 0.9)';
          img.style.boxShadow = '0 0 0 1px rgba(0, 255, 0, 0.5)';
        }
      } else {
        if (img) {
          img.style.border = '';
          img.style.boxShadow = '';
        }
      }
    });
  },

  updateCenterDotVisibility() {
    // Delegate to GridManager if available
    const GridManager = window.App?.GridManager;
    if (GridManager && GridManager.updateCenterDotVisibility) {
      GridManager.updateCenterDotVisibility();
      return;
    }

    // Fallback to legacy implementation
    const centerDot = document.getElementById('center-grid-dot');
    const grid = document.getElementById('rule-of-thirds-grid');
    
    if (centerDot && grid) {
      const currentLayoutMode = window.APP_CONFIG && window.APP_CONFIG.transformations?.translation?.layout_mode;
      const isGridVisible = grid.style.display !== 'none';
      const isUsingCenterMode = currentLayoutMode === 'rule_of_thirds_and_centre';
      const isRandomMode = currentLayoutMode === 'random';
      
      if (isRandomMode) {
        grid.style.display = 'none';
        centerDot.style.display = 'none';
        return;
      }
      
      if (isGridVisible && isUsingCenterMode) {
        centerDot.style.display = 'block';
      } else {
        centerDot.style.display = 'none';
      }
    }
  },

  // Utility functions
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  },

  seededRandom(seed) {
    let state = seed;
    return function () {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  },

  seededRandomBetween(randomFunc, min, max) {
    return randomFunc() * (max - min) + min;
  }
};