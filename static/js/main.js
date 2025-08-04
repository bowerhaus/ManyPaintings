2/**
 * Many Paintings - Generative Art Application
 * Main JavaScript application with modular architecture
 */

window.App = (function () {
  'use strict';

  // Application state
  let config = {};
  let isInitialized = false;
  let kioskMode = false;

  /**
   * Image Manager - Handles loading, caching, and memory management
   */
  const ImageManager = {
    images: new Map(),
    loadedImages: new Map(),
    loadQueue: [],
    preloadQueue: [],
    maxConcurrentLoads: 3,
    currentLoads: 0,

    async init() {
      try {
        const response = await fetch('/api/images');
        const data = await response.json();

        this.images.clear();
        data.images.forEach(img => {
          this.images.set(img.id, img);
        });

        console.log(`ImageManager: Loaded catalog with ${data.images.length} images`);
        return data.images;
      } catch (error) {
        console.error('ImageManager: Failed to load image catalog:', error);
        UI.showError('Failed to load image catalog');
        throw error;
      }
    },

    async loadImage(imageId) {
      if (this.loadedImages.has(imageId)) {
        return this.loadedImages.get(imageId);
      }

      const imageInfo = this.images.get(imageId);
      if (!imageInfo) {
        throw new Error(`Image not found: ${imageId}`);
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.loadedImages.set(imageId, img);
          console.log(`ImageManager: Loaded image ${imageInfo.filename}`);
          resolve(img);
        };
        img.onerror = () => {
          console.error(`ImageManager: Failed to load ${imageInfo.filename}`);
          reject(new Error(`Failed to load image: ${imageInfo.filename}`));
        };
        img.src = imageInfo.path;
      });
    },

    async preloadImages(imageIds, priority = false) {
      const queue = priority ? this.loadQueue : this.preloadQueue;

      imageIds.forEach(id => {
        if (!this.loadedImages.has(id) && !queue.includes(id)) {
          queue.push(id);
        }
      });

      this.processLoadQueue();
    },

    async processLoadQueue() {
      if (this.currentLoads >= this.maxConcurrentLoads || this.loadQueue.length === 0) {
        return;
      }

      this.currentLoads++;
      const imageId = this.loadQueue.shift();

      try {
        await this.loadImage(imageId);
      } catch (error) {
        console.warn(`Failed to preload image ${imageId}:`, error);
      } finally {
        this.currentLoads--;
        setTimeout(() => this.processLoadQueue(), 10);
      }
    },

    cleanupMemory() {
      if (this.loadedImages.size <= (config.application?.max_concurrent_images || 10)) {
        return;
      }

      // Simple cleanup - remove half of loaded images (LRU would be better)
      const toRemove = Math.floor(this.loadedImages.size / 2);
      const keys = Array.from(this.loadedImages.keys());

      for (let i = 0; i < toRemove; i++) {
        this.loadedImages.delete(keys[i]);
      }

      console.log(`ImageManager: Cleaned up ${toRemove} images from memory`);
    },

    getRandomImageIds(count) {
      const allIds = Array.from(this.images.keys());
      const shuffled = this.fisherYatesShuffle([...allIds]);
      return shuffled.slice(0, count);
    },

    fisherYatesShuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
  };

  /**
   * Animation Engine - Handles layer management and smooth transitions
   */
  const AnimationEngine = {
    layersContainer: null,
    activeLayers: new Map(),
    animationId: null,
    isPlaying: true,
    frameRate: 30,
    frameInterval: 1000 / 30,
    lastFrameTime: 0,
    transformationCache: new Map(),
    ruleOfThirdsIndex: 0, // Track current rule of thirds position
    debugBordersVisible: false, // Track debug border state for random mode

    init() {
      this.layersContainer = document.getElementById('image-layers');
      this.frameRate = config.application?.animation_fps || 30;
      this.frameInterval = 1000 / this.frameRate;

      if (!this.layersContainer) {
        throw new Error('Image layers container not found');
      }

      // Apply animation quality class to body
      document.body.className = `animation-quality-${config.animationQuality || 'high'}`;

      // Initialize virtual coordinate system: ensure container uses full viewport
      this.initializeVirtualCoordinateSystem();

      // Initialize debug boxes since grid is visible by default
      setTimeout(() => {
        const grid = document.getElementById('rule-of-thirds-grid');
        if (grid && grid.style.display !== 'none') {
          this.toggleImageBoxes(true);
        }
        // Initialize center dot visibility
        this.updateCenterDotVisibility();
      }, 100);

      console.log(`AnimationEngine: Initialized with ${this.frameRate} FPS target and virtual coordinate system`);
      console.log(`AnimationEngine: Max concurrent layers: ${config.layer_management?.max_concurrent_layers || 5}`);
      console.log(`AnimationEngine: Animation quality: ${config.animationQuality || 'high'}`);
    },

    initializeVirtualCoordinateSystem() {
      // Ensure image-layers container always uses full viewport dimensions
      // This prevents matte border system from affecting image coordinate space
      if (this.layersContainer) {
        this.layersContainer.style.position = 'fixed';
        this.layersContainer.style.left = '0';
        this.layersContainer.style.top = '0';
        this.layersContainer.style.width = '100vw';
        this.layersContainer.style.height = '100vh';
        this.layersContainer.style.zIndex = '10'; // Below controls but above background

        console.log('AnimationEngine: Virtual coordinate system initialized - container set to full viewport');
      }
    },

    toggleRuleOfThirdsGrid() {
      const grid = document.getElementById('rule-of-thirds-grid');
      if (grid) {
        const currentLayoutMode = window.APP_CONFIG && window.APP_CONFIG.transformations?.translation?.layout_mode;
        const isVisible = grid.style.display !== 'none';
        
        if (currentLayoutMode === 'random') {
          // In random mode, toggle only the image borders, not the grid lines
          this.toggleImageBoxes(!this.debugBordersVisible);
          this.debugBordersVisible = !this.debugBordersVisible;
          console.log('Random mode: Image borders', this.debugBordersVisible ? 'shown' : 'hidden');
          return;
        }
        
        // For structured modes, toggle the full grid
        grid.style.display = isVisible ? 'none' : 'block';
        this.toggleImageBoxes(!isVisible);
        this.updateCenterDotVisibility();

        console.log('Rule of thirds grid:', isVisible ? 'hidden' : 'visible');
      }
    },

    shouldShowDebugBorders() {
      const currentLayoutMode = window.APP_CONFIG && window.APP_CONFIG.transformations?.translation?.layout_mode;
      const grid = document.getElementById('rule-of-thirds-grid');
      
      if (currentLayoutMode === 'random') {
        // In random mode, use the separate debug borders state
        return this.debugBordersVisible;
      } else {
        // In structured modes, use grid visibility
        return grid && grid.style.display !== 'none';
      }
    },

    updateCenterDotVisibility() {
      const centerDot = document.getElementById('center-grid-dot');
      const grid = document.getElementById('rule-of-thirds-grid');
      
      if (centerDot && grid) {
        const currentLayoutMode = window.APP_CONFIG && window.APP_CONFIG.transformations?.translation?.layout_mode;
        const isGridVisible = grid.style.display !== 'none';
        const isUsingCenterMode = currentLayoutMode === 'rule_of_thirds_and_centre';
        const isRandomMode = currentLayoutMode === 'random';
        
        // In random mode, hide the grid lines but allow debug borders via G key
        if (isRandomMode) {
          grid.style.display = 'none';
          centerDot.style.display = 'none';
          // Don't automatically hide image borders - let user control with G key
          console.log('Grid lines hidden for random mode (G key toggles image borders only)');
          return;
        }
        
        // Show center dot only if grid is visible AND using center mode
        if (isGridVisible && isUsingCenterMode) {
          centerDot.style.display = 'block';
          console.log('Center grid dot shown for rule_of_thirds_and_centre mode');
        } else {
          centerDot.style.display = 'none';
        }
      }
    },

    toggleImageBoxes(showBoxes) {
      const layers = this.layersContainer.querySelectorAll('.image-layer');
      console.log(`Toggling debug boxes: ${showBoxes}, found ${layers.length} layers`);

      layers.forEach(layer => {
        const img = layer.querySelector('img');
        if (showBoxes) {
          console.log('Adding debug styles to existing layer:', layer.id);

          // Add border to image if it exists
          if (img) {
            img.style.border = '3px solid rgba(0, 255, 0, 0.9)';
            img.style.boxShadow = '0 0 0 1px rgba(0, 255, 0, 0.5)';
          }

        } else {
          console.log('Removing debug styles from layer:', layer.id);

          // Remove border from image
          if (img) {
            img.style.border = '';
            img.style.boxShadow = '';
          }

        }
      });
    },

    start() {
      if (!this.isPlaying) {
        this.isPlaying = true;

        // Resume all layer animations
        this.activeLayers.forEach((layerInfo, imageId) => {
          if (layerInfo.layer) {
            // Update start time to account for pause duration
            if (layerInfo.pausedAt) {
              const pauseDuration = Date.now() - layerInfo.pausedAt;
              layerInfo.startTime += pauseDuration;
              delete layerInfo.pausedAt;
            }

            // Only resume layers that were actually paused
            if (layerInfo.pausedOpacity !== undefined) {
              console.log(`AnimationEngine: Resuming layer ${imageId} from opacity ${layerInfo.pausedOpacity}`);

              // Resume based on paused phase
              if (layerInfo.pausedPhase === 'fade-in') {
                // Continue fade-in from current opacity to target opacity
                layerInfo.layer.style.transition = `opacity ${layerInfo.pausedTimeRemaining}ms ease-in-out`;
                layerInfo.layer.style.opacity = layerInfo.opacity;

                layerInfo.holdTimeout = setTimeout(() => {
                  layerInfo.phase = 'hold';
                  layerInfo.holdTimeout = setTimeout(() => {
                    if (layerInfo.phase === 'hold') {
                      this.startFadeOut(layerInfo);
                    }
                  }, layerInfo.holdTime);
                }, layerInfo.pausedTimeRemaining);

              } else if (layerInfo.pausedPhase === 'hold') {
                // Resume hold phase - just wait for remaining time
                layerInfo.holdTimeout = setTimeout(() => {
                  if (layerInfo.phase === 'hold') {
                    this.startFadeOut(layerInfo);
                  }
                }, layerInfo.pausedTimeRemaining);

              } else if (layerInfo.pausedPhase === 'fade-out') {
                // Resume fade-out
                layerInfo.layer.style.transition = `opacity ${layerInfo.fadeOutDuration}ms ease-in-out`;
                layerInfo.layer.style.opacity = '0';

                setTimeout(() => {
                  this.removeLayer(layerInfo);
                }, layerInfo.fadeOutDuration);
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
        if (layerInfo.layer) {
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

          if (layerInfo.phase === 'fade-in') {
            layerInfo.pausedTimeRemaining = Math.max(0, layerInfo.fadeInDuration - elapsed);
            layerInfo.pausedPhase = 'fade-in';
          } else if (layerInfo.phase === 'hold') {
            const holdElapsed = elapsed - layerInfo.fadeInDuration;
            layerInfo.pausedTimeRemaining = Math.max(0, layerInfo.holdTime - holdElapsed);
            layerInfo.pausedPhase = 'hold';
          } else if (layerInfo.phase === 'fade-out') {
            // If already fading out, just note it
            layerInfo.pausedPhase = 'fade-out';
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

      // Check if we've reached the concurrent layer limit
      if (this.activeLayers.size >= (config.layer_management?.max_concurrent_layers || 5)) {
        console.log(`AnimationEngine: Max concurrent layers (${config.layer_management?.max_concurrent_layers || 5}) reached, skipping ${imageId}`);
        return null;
      }

      try {
        const img = await ImageManager.loadImage(imageId);

        // Generate deterministic timing and transformation parameters (affected by speed multiplier)
        const speedMultiplier = UI.speedMultiplier || 1.0;

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

    hideImage(imageId) {
      const layerInfo = this.activeLayers.get(imageId);
      if (!layerInfo) return;

      const { layer, transformations } = layerInfo;
      layer.classList.add('fade-out');
      layer.classList.remove('active');


      // Remove from DOM after transition
      setTimeout(() => {
        if (layer.parentNode) {
          layer.parentNode.removeChild(layer);
        }
        this.activeLayers.delete(imageId);
      }, 2000); // Match CSS transition duration
    },

    generateTransformations(img, imageId, seed = null) {
      // Use imageId + seed for deterministic transformations
      const transformSeed = seed ? `${imageId}-${seed}` : imageId;

      if (config.preloadTransformCache && this.transformationCache.has(transformSeed)) {
        return this.transformationCache.get(transformSeed);
      }

      // Simple seeded random number generator
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

      if (config.transformations?.translation?.enabled) {
        if (config.transformations?.translation?.layout_mode === 'rule_of_thirds') {
          const intersectionPoints = [
            { x: 1 / 3, y: 1 / 3 },    // Top-left
            { x: 2 / 3, y: 1 / 3 },    // Top-right
            { x: 1 / 3, y: 2 / 3 },    // Bottom-left
            { x: 2 / 3, y: 2 / 3 },    // Bottom-right
          ];

          // Round-robin through the intersection points
          const point = intersectionPoints[this.ruleOfThirdsIndex];
          this.ruleOfThirdsIndex = (this.ruleOfThirdsIndex + 1) % intersectionPoints.length;

          // Apply deviation if configured
          let finalX = point.x;
          let finalY = point.y;
          
          if (config.transformations?.translation?.rule_of_thirds?.max_horizontal_deviation_percent && config.transformations?.translation?.rule_of_thirds?.max_vertical_deviation_percent) {
            const maxHorizontalDev = config.transformations.translation.rule_of_thirds.max_horizontal_deviation_percent / 100;
            const maxVerticalDev = config.transformations.translation.rule_of_thirds.max_vertical_deviation_percent / 100;
            
            const horizontalDeviation = (random() - 0.5) * 2 * maxHorizontalDev;
            const verticalDeviation = (random() - 0.5) * 2 * maxVerticalDev;
            
            finalX = Math.max(0.1, Math.min(0.9, point.x + horizontalDeviation));
            finalY = Math.max(0.1, Math.min(0.9, point.y + verticalDeviation));
          }

          // Convert rule of thirds point to viewport offset from center
          const viewportOffsetX = (finalX - 0.5) * 100;
          const viewportOffsetY = (finalY - 0.5) * 100;
          
          transformations.translateX = viewportOffsetX;
          transformations.translateY = viewportOffsetY;

          console.log(`Rule of thirds: Point ${(this.ruleOfThirdsIndex === 0 ? 4 : this.ruleOfThirdsIndex)} → translate(${viewportOffsetX.toFixed(1)}vw, ${viewportOffsetY.toFixed(1)}vh) [deviation: ${config.transformations?.translation?.rule_of_thirds?.max_horizontal_deviation_percent || 0}%, ${config.transformations?.translation?.rule_of_thirds?.max_vertical_deviation_percent || 0}%]`);

        } else if (config.transformations?.translation?.layout_mode === 'rule_of_thirds_and_centre') {
          const intersectionPoints = [
            { x: 1 / 3, y: 1 / 3 },    // Top-left
            { x: 2 / 3, y: 1 / 3 },    // Top-right
            { x: 1 / 3, y: 2 / 3 },    // Bottom-left
            { x: 2 / 3, y: 2 / 3 },    // Bottom-right
            { x: 0.5, y: 0.5 },        // Center
          ];

          // Round-robin through the intersection points including center
          const point = intersectionPoints[this.ruleOfThirdsIndex];
          this.ruleOfThirdsIndex = (this.ruleOfThirdsIndex + 1) % intersectionPoints.length;

          // Apply deviation if configured
          let finalX = point.x;
          let finalY = point.y;
          
          if (config.transformations?.translation?.rule_of_thirds_and_centre?.max_horizontal_deviation_percent && config.transformations?.translation?.rule_of_thirds_and_centre?.max_vertical_deviation_percent) {
            const maxHorizontalDev = config.transformations.translation.rule_of_thirds_and_centre.max_horizontal_deviation_percent / 100;
            const maxVerticalDev = config.transformations.translation.rule_of_thirds_and_centre.max_vertical_deviation_percent / 100;
            
            const horizontalDeviation = (random() - 0.5) * 2 * maxHorizontalDev;
            const verticalDeviation = (random() - 0.5) * 2 * maxVerticalDev;
            
            finalX = Math.max(0.1, Math.min(0.9, point.x + horizontalDeviation));
            finalY = Math.max(0.1, Math.min(0.9, point.y + verticalDeviation));
          }

          // Convert point to viewport offset from center
          const viewportOffsetX = (finalX - 0.5) * 100;
          const viewportOffsetY = (finalY - 0.5) * 100;
          
          
          transformations.translateX = viewportOffsetX;
          transformations.translateY = viewportOffsetY;

          console.log(`Rule of thirds + center: Point ${(this.ruleOfThirdsIndex === 0 ? 5 : this.ruleOfThirdsIndex)} → translate(${viewportOffsetX.toFixed(1)}vw, ${viewportOffsetY.toFixed(1)}vh) [deviation: ${config.transformations?.translation?.rule_of_thirds_and_centre?.max_horizontal_deviation_percent || 0}%, ${config.transformations?.translation?.rule_of_thirds_and_centre?.max_vertical_deviation_percent || 0}%]`);

        } else if (config.transformations?.translation?.layout_mode === 'random') {
          // Random positioning within actual matte border bounds
          const actualImageArea = this.getActualImageAreaBounds();
          
          // Convert image area bounds to viewport-relative offsets
          const centerOffsetX = ((actualImageArea.left + actualImageArea.width/2) / window.innerWidth - 0.5) * 100;
          const centerOffsetY = ((actualImageArea.top + actualImageArea.height/2) / window.innerHeight - 0.5) * 100;
          
          // Calculate random range within the actual image area
          const maxRangeX = (actualImageArea.width / window.innerWidth) * 100;
          const maxRangeY = (actualImageArea.height / window.innerHeight) * 100;
          
          transformations.translateX = (random() - 0.5) * maxRangeX + centerOffsetX;
          transformations.translateY = (random() - 0.5) * maxRangeY + centerOffsetY;
          transformations.useViewportUnits = true;
          
          console.log(`Random positioning (actual bounds): translate(${transformations.translateX.toFixed(1)}vw, ${transformations.translateY.toFixed(1)}vh) - area: ${actualImageArea.width}x${actualImageArea.height}`);
        } else {
          // Default/fallback to random positioning
          transformations.translateX = (random() - 0.5) * 100; // -50% to +50%
          transformations.translateY = (random() - 0.5) * 100; // -50% to +50%
        }
      }

      if (config.color_remapping?.enabled && random() < config.color_remapping?.probability) {
        transformations.hueShift = random() * (config.color_remapping.hue_shift_range.max_degrees - config.color_remapping.hue_shift_range.min_degrees) + config.color_remapping.hue_shift_range.min_degrees;
      }

      // Apply minimum visibility constraint for random mode
      if (config.transformations?.translation?.layout_mode === 'random' && config.transformations?.translation?.minimum_visible_percent) {
        this.enforceMinimumVisibilityRandom(transformations, img.naturalWidth, img.naturalHeight);
      }

      if (config.preloadTransformCache) {
        this.transformationCache.set(transformSeed, transformations);
      }

      return transformations;
    },

    hashCode(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
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

    randomBetween(min, max) {
      return Math.random() * (max - min) + min;
    },

    seededRandomBetween(seededRandom, min, max) {
      return seededRandom() * (max - min) + min;
    },

    createLayer(imageId, img, transformations) {
      const layer = document.createElement('div');
      layer.className = 'image-layer';
      layer.id = `layer-${imageId}-${Date.now()}`;

      // Add debug box if grid is visible
      const grid = document.getElementById('rule-of-thirds-grid');
      if (grid && grid.style.display !== 'none') {
        console.log('Adding debug-mode to layer:', layer.id);
        layer.classList.add('debug-mode');

        // Add border to layer container to show its boundaries
        layer.style.border = '2px dashed rgba(255, 165, 0, 0.8)'; // Orange dashed border for layer
        layer.style.boxShadow = '0 0 0 1px rgba(255, 165, 0, 0.3)';

      }

      const imgElement = img.cloneNode();
      imgElement.draggable = false;

      // Add debug border if debug mode is active
      const shouldShowDebugBorder = this.shouldShowDebugBorders();
      if (shouldShowDebugBorder) {
        // Add border directly to image
        imgElement.style.border = '3px solid rgba(0, 255, 0, 0.9)';
        imgElement.style.boxShadow = '0 0 0 1px rgba(0, 255, 0, 0.5)';

        console.log('Added debug border to layer:', layer.id);

        // Debug: Log the actual computed position after transforms are applied
        setTimeout(() => {
          const rect = imgElement.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const viewportCenterX = centerX / window.innerWidth * 100;
          const viewportCenterY = centerY / window.innerHeight * 100;
          console.log(`Image ${uniqueClass} actual center: (${viewportCenterX.toFixed(1)}%, ${viewportCenterY.toFixed(1)}%)`);
        }, 100);
      }

      layer.appendChild(imgElement);

      // Get the image area dimensions (either from matte border or full viewport)
      const image_area = this.getImageAreaDimensions();

      // Apply best-fit scaling to the image area first (if enabled)
      if (config.transformations?.best_fit_scaling?.enabled) {
        this.applyBestFitScaling(imgElement, img, image_area);
      } else {
        // If best fit scaling is disabled, use original image dimensions
        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;

        imgElement.style.width = `${originalWidth}px`;
        imgElement.style.height = `${originalHeight}px`;
        imgElement.style.position = 'absolute';
        imgElement.style.left = '50%';
        imgElement.style.top = '50%';
        imgElement.style.transform = `translate(-50%, -50%)`;
        imgElement.style.transformOrigin = 'center center';
        console.log(`AnimationEngine: Best fit scaling disabled, using original image dimensions: ${originalWidth}x${originalHeight}px`);
      }

      // Apply transformations in proper order
      if (transformations) {
        const transforms = [];

        // Apply translation based on layout mode
        if (config.transformations?.translation?.enabled && (transformations.translateX || transformations.translateY)) {
          if (config.transformations?.translation?.layout_mode === 'rule_of_thirds' || config.transformations?.translation?.layout_mode === 'rule_of_thirds_and_centre' || transformations.useViewportUnits) {
            // Use viewport units for structured positioning and random mode
            transforms.push(`translate(${transformations.translateX}vw, ${transformations.translateY}vh)`);
          } else {
            // Use standard percentage translate for fallback positioning
            transforms.push(`translate(${transformations.translateX}%, ${transformations.translateY}%)`);
          }
        }

        // Scale (around center of image)
        if (config.transformations?.scale?.enabled && transformations.scale !== 1) {
          transforms.push(`scale(${transformations.scale})`);
        }

        // Rotate (around center of scaled image)
        if (config.transformations?.rotation?.enabled && transformations.rotation) {
          transforms.push(`rotate(${transformations.rotation}deg)`);
        }

        if (transforms.length > 0) {
          const existingTransform = imgElement.style.transform || '';
          const newTransform = existingTransform + ' ' + transforms.join(' ');
          imgElement.style.transform = newTransform;
          imgElement.style.transformOrigin = 'center center';
          console.log(`Applied transforms: ${newTransform}`);
        }

        // Apply hue shift filter if enabled
        if (config.color_remapping?.enabled && transformations.hueShift !== 0) {
          imgElement.style.filter = `hue-rotate(${transformations.hueShift}deg)`;
        }
      }

      layer.appendChild(imgElement);
      return layer;
    },

    getImageAreaDimensions() {
      // Virtual coordinate system: Always return full viewport dimensions
      // This ensures images use consistent coordinate space regardless of matte border settings
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    },

    getActualImageAreaBounds() {
      // Get the actual usable image area, accounting for matte border
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Check if matte border is enabled and get configuration
      let border_percent = 0;
      let image_areaAspectRatio = null;
      
      // Try to get border configuration from APP_CONFIG
      if (window.APP_CONFIG && window.APP_CONFIG.matte_border) {
        if (window.APP_CONFIG.matte_border.enabled) {
          border_percent = window.APP_CONFIG.matte_border.border_percent || 10;
          image_areaAspectRatio = window.APP_CONFIG.matte_border.image_area?.aspect_ratio;
        }
      }
      
      // If no matte border, use full viewport
      if (border_percent === 0) {
        return {
          left: 0,
          top: 0,
          width: viewportWidth,
          height: viewportHeight
        };
      }
      
      // Calculate the actual image area (similar to MatteBorderManager logic)
      let canvasWidth = viewportWidth;
      let canvasHeight = viewportHeight;
      
      // Apply aspect ratio constraints if specified
      if (image_areaAspectRatio && image_areaAspectRatio !== 'auto') {
        const [widthRatio, heightRatio] = image_areaAspectRatio.split(':').map(Number);
        const targetAspectRatio = widthRatio / heightRatio;
        const currentAspectRatio = canvasWidth / canvasHeight;
        
        if (currentAspectRatio > targetAspectRatio) {
          canvasWidth = canvasHeight * targetAspectRatio;
        } else {
          canvasHeight = canvasWidth / targetAspectRatio;
        }
      }
      
      // Calculate border size
      const smallerCanvasDimension = Math.min(canvasWidth, canvasHeight);
      const borderSize = (border_percent / 100) * smallerCanvasDimension;
      
      // Calculate final image area
      const imageWidth = canvasWidth - (borderSize * 2);
      const imageHeight = canvasHeight - (borderSize * 2);
      
      // Center the image area in viewport
      const imageLeft = (viewportWidth - imageWidth) / 2;
      const imageTop = (viewportHeight - imageHeight) / 2;
      
      console.log(`Calculated image area: ${imageWidth}x${imageHeight} at (${imageLeft}, ${imageTop}) with ${border_percent}% border`);
      
      return {
        left: imageLeft,
        top: imageTop,
        width: imageWidth,
        height: imageHeight
      };
    },

    enforceMinimumVisibilityRandom(transformations, imageWidth, imageHeight) {
      const minVisiblePercent = config.transformations?.translation?.minimum_visible_percent || 60;
      const actualImageArea = this.getActualImageAreaBounds();
      
      console.log(`Enforcing minimum visibility: ${minVisiblePercent}% for ${imageWidth}x${imageHeight} image`);
      
      // Calculate effective image bounds after scale and rotation
      const scale = transformations.scale || 1;
      const rotation = transformations.rotation || 0;
      const effectiveWidth = imageWidth * scale;
      const effectiveHeight = imageHeight * scale;
      
      // Account for rotation expanding bounding box
      const rotationRadians = rotation * Math.PI / 180;
      const boundingWidth = Math.abs(effectiveWidth * Math.cos(rotationRadians)) + 
                           Math.abs(effectiveHeight * Math.sin(rotationRadians));
      const boundingHeight = Math.abs(effectiveWidth * Math.sin(rotationRadians)) + 
                            Math.abs(effectiveHeight * Math.cos(rotationRadians));
      
      console.log(`Effective bounds: ${effectiveWidth}x${effectiveHeight} → rotated bounds: ${boundingWidth.toFixed(1)}x${boundingHeight.toFixed(1)}`);
      
      // Calculate how much of the image needs to stay within the image area
      const requiredVisibleWidth = boundingWidth * (minVisiblePercent / 100);
      const requiredVisibleHeight = boundingHeight * (minVisiblePercent / 100);
      
      // Calculate maximum allowed translation from center to keep required percentage visible
      // The image center can move at most this far while keeping minVisiblePercent within bounds
      const maxTranslateX = Math.max(0, (actualImageArea.width - requiredVisibleWidth) / 2);
      const maxTranslateY = Math.max(0, (actualImageArea.height - requiredVisibleHeight) / 2);
      
      // Convert to viewport units for comparison
      const maxTranslateXVw = (maxTranslateX / window.innerWidth) * 100;
      const maxTranslateYVh = (maxTranslateY / window.innerHeight) * 100;
      
      // Clamp the existing translation values
      const originalTranslateX = transformations.translateX || 0;
      const originalTranslateY = transformations.translateY || 0;
      
      transformations.translateX = Math.max(-maxTranslateXVw, Math.min(maxTranslateXVw, originalTranslateX));
      transformations.translateY = Math.max(-maxTranslateYVh, Math.min(maxTranslateYVh, originalTranslateY));
      
      console.log(`Translation constrained: (${originalTranslateX.toFixed(1)}vw, ${originalTranslateY.toFixed(1)}vh) → (${transformations.translateX.toFixed(1)}vw, ${transformations.translateY.toFixed(1)}vh)`);
      console.log(`Max allowed: ±${maxTranslateXVw.toFixed(1)}vw, ±${maxTranslateYVh.toFixed(1)}vh`);
    },

    applyBestFitScaling(imgElement, originalImg, image_area) {
      // Get original image dimensions
      const originalWidth = originalImg.naturalWidth || originalImg.width;
      const originalHeight = originalImg.naturalHeight || originalImg.height;

      if (!originalWidth || !originalHeight) {
        console.warn('AnimationEngine: Unable to get image dimensions for best-fit scaling');
        return;
      }

      // Calculate scale factors for both dimensions
      const scaleX = image_area.width / originalWidth;
      const scaleY = image_area.height / originalHeight;

      // Use the smaller scale factor to ensure image fits entirely within the area (best-fit)
      const bestFitScale = Math.min(scaleX, scaleY);

      // Calculate final dimensions
      const finalWidth = originalWidth * bestFitScale;
      const finalHeight = originalHeight * bestFitScale;

      // Apply the best-fit scaling
      imgElement.style.width = `${finalWidth}px`;
      imgElement.style.height = `${finalHeight}px`;

      // Center the image within the image area
      imgElement.style.position = 'absolute';
      imgElement.style.left = '50%';
      imgElement.style.top = '50%';
      imgElement.style.transform = `translate(-50%, -50%)`;
      imgElement.style.transformOrigin = 'center center';

      console.log(`AnimationEngine: Applied best-fit scaling - original: ${originalWidth}x${originalHeight}, area: ${image_area.width}x${image_area.height}, scale: ${bestFitScale.toFixed(3)}, final: ${finalWidth.toFixed(0)}x${finalHeight.toFixed(0)}`);
    },

    updateExistingLayerSpeeds(newSpeedMultiplier) {
      console.log(`AnimationEngine: Updating ${this.activeLayers.size} existing layers to ${newSpeedMultiplier}x speed`);

      this.activeLayers.forEach((layerInfo, imageId) => {
        if (layerInfo.phase === 'fade-in' || layerInfo.phase === 'hold') {
          // Recalculate remaining times with new speed
          const elapsed = Date.now() - layerInfo.startTime;

          if (layerInfo.phase === 'fade-in') {
            // Still fading in - adjust the transition duration
            const originalFadeInDuration = layerInfo.fadeInDuration * (layerInfo.originalSpeed || 1.0);
            const newFadeInDuration = originalFadeInDuration / newSpeedMultiplier;
            const remainingFadeTime = Math.max(100, newFadeInDuration - elapsed);

            layerInfo.layer.style.transition = `opacity ${remainingFadeTime}ms ease-in-out`;
            console.log(`AnimationEngine: Updated layer ${imageId} fade-in duration to ${remainingFadeTime}ms`);
          } else if (layerInfo.phase === 'hold') {
            // In hold phase - adjust remaining hold time and fade out
            const originalHoldTime = layerInfo.holdTime * (layerInfo.originalSpeed || 1.0);
            const newHoldTime = originalHoldTime / newSpeedMultiplier;
            const holdElapsed = elapsed - (layerInfo.fadeInDuration * (layerInfo.originalSpeed || 1.0) / newSpeedMultiplier);
            const remainingHoldTime = Math.max(100, newHoldTime - holdElapsed);

            // Clear existing timeout and set new one
            if (layerInfo.holdTimeout) {
              clearTimeout(layerInfo.holdTimeout);
            }

            layerInfo.holdTimeout = setTimeout(() => {
              if (layerInfo.phase === 'hold') {
                this.startFadeOut(layerInfo);
              }
            }, remainingHoldTime);

            console.log(`AnimationEngine: Updated layer ${imageId} remaining hold time to ${remainingHoldTime}ms`);
          }

          // Store original speed for future calculations
          layerInfo.originalSpeed = layerInfo.originalSpeed || 1.0;
        }
      });
    },

    clearAllLayers() {
      this.activeLayers.forEach((layerInfo, imageId) => {
        this.hideImage(imageId);
      });
    },

    clearAllLayersImmediate() {
      // Immediate clearing for favorites loading - no fade transitions
      this.activeLayers.forEach((layerInfo, imageId) => {
        const { layer } = layerInfo;

        // Clear any timeouts
        if (layerInfo.holdTimeout) {
          clearTimeout(layerInfo.holdTimeout);
        }
        if (layerInfo.fadeOutTimeout) {
          clearTimeout(layerInfo.fadeOutTimeout);
        }

        // Remove from DOM immediately
        if (layer.parentNode) {
          layer.parentNode.removeChild(layer);
        }
      });

      // Clear the active layers map
      this.activeLayers.clear();
    },

    async showImageFromFavorite(imageId, options = {}) {
      // Special method for restoring images from favorites with exact state
      try {
        const img = await ImageManager.loadImage(imageId);
        const favoriteData = options.favoriteData;

        if (!favoriteData) {
          throw new Error('No favorite data provided');
        }

        // Use saved transformations directly instead of generating new ones
        const transformations = favoriteData.transformations;
        const layer = this.createLayer(imageId, img, transformations);

        this.layersContainer.appendChild(layer);

        // Create layer info with saved opacity and staggered timing for restored favorites
        const speedMultiplier = UI.speedMultiplier || 1.0;
        const layerIndex = options.layerIndex || 0;
        const totalLayers = options.totalLayers || 1;

        // Use config values for hold and fade times
        // Hold time: random between min and max, then divide by 2
        const configHoldMin = config.animation_timing?.min_hold_time_sec || 4;
        const configHoldMax = config.animation_timing?.max_hold_time_sec || 12;
        const randomHoldTime = this.seededRandomBetween(() => Math.random(), configHoldMin, configHoldMax);
        const baseHoldTime = (randomHoldTime / 2) * 1000;

        // Fade-out time: random between fade-out min and max (no division)
        const configFadeMin = config.animation_timing?.fade_out_min_sec || 3;
        const configFadeMax = config.animation_timing?.fade_out_max_sec || 6;
        const baseFadeOutDuration = this.seededRandomBetween(() => Math.random(), configFadeMin, configFadeMax) * 1000;

        const fadeOutDuration = baseFadeOutDuration / speedMultiplier;
        const holdTime = baseHoldTime / speedMultiplier;

        console.log(`AnimationEngine: Favorite restore layer ${layerIndex}/${totalLayers} with speed ${speedMultiplier}x - hold: ${holdTime}ms, fadeOut: ${fadeOutDuration}ms (config-based timing)`);

        const layerInfo = {
          layer,
          startTime: Date.now(),
          fadeInDuration: 200, // Very quick fade in for restored layers
          fadeOutDuration,
          holdTime,
          opacity: favoriteData.opacity,
          transformations,
          phase: 'hold', // Start directly in hold phase
          originalSpeed: speedMultiplier,
          holdTimeout: null
        };

        this.activeLayers.set(imageId, layerInfo);


        // Start with opacity 0 and fade in to the saved opacity quickly
        layer.style.opacity = '0';
        layer.style.transition = 'opacity 200ms ease-in-out';

        // Force reflow and then animate to saved opacity
        layer.offsetHeight;

        requestAnimationFrame(() => {
          const opacityToSet = favoriteData.opacity.toString();
          layer.style.opacity = opacityToSet;

          console.log(`AnimationEngine: Setting layer ${imageId} opacity to ${opacityToSet}, element opacity after setting:`, layer.style.opacity);

          // After transition completes, remove transition to prevent interference
          setTimeout(() => {
            layer.style.transition = 'none';
            layer.style.opacity = opacityToSet; // Ensure it stays at the right value
            console.log(`AnimationEngine: Removed transition from layer ${imageId}, final opacity:`, layer.style.opacity);
          }, 600); // Slightly after the 500ms transition

          // Schedule the hold phase to end and start fade out
          layerInfo.holdTimeout = setTimeout(() => {
            if (layerInfo.phase === 'hold') {
              this.startFadeOut(layerInfo);
            }
          }, holdTime);
        });

        console.log(`AnimationEngine: Restored favorite layer ${imageId} with target opacity ${favoriteData.opacity}, will hold for ${holdTime}ms then fade out`);
        return layer;

      } catch (error) {
        console.error(`AnimationEngine: Failed to show image from favorite ${imageId}:`, error);
        throw error;
      }
    }
  };

  /**
   * Pattern Manager - Handles sequence generation and state
   */
  const PatternManager = {
    currentPattern: null,
    currentSeed: null,
    patternInterval: null,
    imageSequence: [],
    sequenceIndex: 0,
    initialPatternCode: null,

    async init() {
      // Fetch initial pattern code from config
      await this.loadInitialPatternCode();
      await this.generateNewPattern(this.initialPatternCode);
      this.startPatternSequence();
    },

    async loadInitialPatternCode() {
      try {
        const response = await fetch('/api/config', {
          cache: 'no-cache', // Prevent browser caching
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const configData = await response.json();
        this.initialPatternCode = configData.initial_pattern_code;

        console.log(`PatternManager: Config loaded - initial_pattern_code: ${this.initialPatternCode}`);

        if (this.initialPatternCode) {
          console.log(`PatternManager: Using initial pattern code: ${this.initialPatternCode}`);
        } else {
          console.log('PatternManager: No initial pattern code configured, will generate random seed');
        }
      } catch (error) {
        console.error('PatternManager: Failed to load initial pattern code:', error);
        this.initialPatternCode = null;
      }
    },

    async generateNewPattern(seed = null) {
      try {
        console.log(`PatternManager: generateNewPattern called with seed: ${seed}`);

        if (!seed) {
          seed = this.generateSeed();
          console.log(`PatternManager: No seed provided, generated random seed: ${seed}`);
        } else {
          console.log(`PatternManager: Using provided seed: ${seed}`);
        }

        // Generate deterministic sequence based on seed
        this.currentSeed = seed;
        this.imageSequence = this.generateDeterministicSequence(seed, 100); // Longer sequence
        this.sequenceIndex = 0;

        console.log(`PatternManager: Generated pattern with seed ${seed}`);
        console.log(`PatternManager: Sequence length: ${this.imageSequence.length}`);
        console.log(`PatternManager: First 10 images in sequence:`, this.imageSequence.slice(0, 10));

        this.updatePatternDisplay();

        // Preload upcoming images
        const upcomingImages = this.imageSequence.slice(0, config.application?.preload_buffer_size || 5);
        await ImageManager.preloadImages(upcomingImages, true);

      } catch (error) {
        console.error('PatternManager: Failed to generate pattern:', error);
        throw error;
      }
    },

    generateDeterministicSequence(seed, length) {
      // Create a seeded random number generator
      const seededRandom = this.createSeededRandom(seed);

      // Get image IDs in a deterministic order (sorted by ID for consistency)
      const allImageIds = Array.from(ImageManager.images.keys()).sort();

      if (allImageIds.length === 0) {
        console.error('PatternManager: No images available for sequence generation');
        return [];
      }

      const sequence = [];

      // Track usage count for each image to create gentle bias toward less-used images
      const usageCounts = {};
      allImageIds.forEach(id => usageCounts[id] = 0);

      for (let i = 0; i < length; i++) {
        // Select image using weighted random selection
        const selectedImage = this.selectWeightedRandom(allImageIds, usageCounts, seededRandom);
        sequence.push(selectedImage);
        usageCounts[selectedImage]++;
      }

      // Log distribution info for debugging
      const counts = Object.values(usageCounts);
      const minCount = Math.min(...counts);
      const maxCount = Math.max(...counts);
      console.log(`PatternManager: Generated weighted sequence - min appearances: ${minCount}, max appearances: ${maxCount}, range: ${maxCount - minCount}`);
      console.log(`PatternManager: First 10 images in sequence: ${sequence.slice(0, 10).join(', ')}`);

      // Test deterministic behavior - log a checksum of the first 20 items for reproducibility testing
      const checksumData = sequence.slice(0, Math.min(20, sequence.length)).join('|');
      const checksum = this.simpleChecksum(checksumData);
      console.log(`PatternManager: Sequence checksum (first 20): ${checksum} - should be identical for same seed`);

      return sequence;
    },

    selectWeightedRandom(imageIds, usageCounts, seededRandom) {
      // Calculate weights for each image - less used images get higher weight
      const totalUsage = Object.values(usageCounts).reduce((sum, count) => sum + count, 0);
      const avgUsage = totalUsage / imageIds.length;

      // Calculate weights: images with below-average usage get bonus weight
      const weights = imageIds.map(id => {
        const usage = usageCounts[id];
        // Base weight of 1.0, with bonus for less-used images
        // This creates gentle bias without eliminating randomness
        const usageDiff = Math.max(0, avgUsage - usage);
        return 1.0 + (usageDiff * 0.5); // 0.5 is the bias strength
      });

      // Select based on weighted probability
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      let random = seededRandom() * totalWeight;

      for (let i = 0; i < imageIds.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          return imageIds[i];
        }
      }

      // Fallback (shouldn't happen)
      return imageIds[imageIds.length - 1];
    },

    seededShuffle(array, seededRandom) {
      // Fisher-Yates shuffle using seeded random
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },

    createSeededRandom(seed) {
      // Use the same hash function as AnimationEngine for consistency
      const hashCode = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
      };

      // Use the same seeded random implementation as AnimationEngine
      let state = hashCode(seed);
      return function () {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
      };
    },

    generateSeed() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    simpleChecksum(str) {
      // Simple checksum for testing deterministic behavior
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    },

    startPatternSequence() {
      this.stopPatternSequence();

      // Show first image immediately
      this.showNextImage();

      // Schedule next images based on configuration and speed multiplier
      const baseInterval = (config.animation_timing?.layer_spawn_interval_sec || 4) * 1000;
      const speedMultiplier = UI.speedMultiplier || 1.0;
      const adjustedInterval = baseInterval / speedMultiplier;

      console.log(`PatternManager: Starting sequence - base: ${baseInterval}ms, speed: ${speedMultiplier}x, interval: ${adjustedInterval}ms`);

      this.patternInterval = setInterval(() => {
        this.showNextImage();
      }, adjustedInterval);
    },

    stopPatternSequence() {
      if (this.patternInterval) {
        clearInterval(this.patternInterval);
        this.patternInterval = null;
      }
    },

    async showNextImage() {
      if (this.imageSequence.length === 0) {
        await this.generateNewPattern();
        return;
      }

      let attempts = 0;
      const maxAttempts = Math.min(10, this.imageSequence.length); // Avoid infinite loops

      while (attempts < maxAttempts) {
        const imageId = this.imageSequence[this.sequenceIndex];

        try {
          // Pass the current seed for deterministic transformations
          const options = {
            seed: this.currentSeed + '-' + this.sequenceIndex
          };

          const layer = await AnimationEngine.showImage(imageId, options);

          // If showImage returns null (duplicate/max layers), try next image
          if (layer === null) {
            console.log(`PatternManager: Image ${imageId} skipped, trying next in sequence`);
            this.sequenceIndex = (this.sequenceIndex + 1) % this.imageSequence.length;
            attempts++;
            continue;
          }

          // Successfully showed image, increment sequence index
          this.sequenceIndex = (this.sequenceIndex + 1) % this.imageSequence.length;
          break;

        } catch (error) {
          console.error(`PatternManager: Failed to show image ${imageId}:`, error);
          this.sequenceIndex = (this.sequenceIndex + 1) % this.imageSequence.length;
          attempts++;
        }
      }

      // Preload upcoming images (regardless of success/failure)
      const upcomingCount = Math.min(config.application?.preload_buffer_size || 5, this.imageSequence.length);
      const upcomingImages = [];

      for (let i = 0; i < upcomingCount; i++) {
        const nextIndex = (this.sequenceIndex + i) % this.imageSequence.length;
        upcomingImages.push(this.imageSequence[nextIndex]);
      }

      ImageManager.preloadImages(upcomingImages);

      // Cleanup memory if needed
      ImageManager.cleanupMemory();
    },

    updatePatternDisplay() {
      const codeElement = document.getElementById('current-pattern');
      if (codeElement) {
        codeElement.textContent = this.currentSeed || 'Loading...';
      }
    }

  };

  /**
   * Audio Manager - Handles background audio playback
   */
  const AudioManager = {
    audioElement: null,
    isEnabled: false,
    volume: 0.5,
    filePath: null,

    init() {
      console.log('AudioManager: Initializing with config:', config);
      console.log('AudioManager: Audio config section:', config.audio);

      if (!config.audio || !config.audio.enabled) {
        console.log('AudioManager: Audio disabled in config');
        return;
      }

      this.isEnabled = config.audio.enabled;
      this.volume = config.audio.volume || 0.5;
      this.filePath = config.audio.file_path || 'static/audio/ambient.mp3';

      console.log(`AudioManager: Initialized with file: ${this.filePath}, volume: ${this.volume}`);

      // Test if the audio file URL is accessible
      fetch(this.filePath, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            console.log('AudioManager: Audio file is accessible via HTTP');
          } else {
            console.error('AudioManager: Audio file not accessible:', response.status, response.statusText);
          }
        })
        .catch(error => {
          console.error('AudioManager: Failed to test audio file accessibility:', error);
        });

      this.createAudioElement();
    },

    createAudioElement() {
      this.audioElement = document.createElement('audio');
      this.audioElement.src = this.filePath;
      this.audioElement.loop = config.audio.loop !== false;
      this.audioElement.volume = this.volume;
      this.audioElement.preload = 'auto';

      // Handle audio loading and errors
      this.audioElement.addEventListener('loadstart', () => {
        console.log('AudioManager: Started loading audio file');
      });

      this.audioElement.addEventListener('loadedmetadata', () => {
        console.log('AudioManager: Audio metadata loaded');
      });

      this.audioElement.addEventListener('canplaythrough', () => {
        console.log('AudioManager: Audio loaded and ready to play');
        console.log('AudioManager: Autoplay setting:', config.audio.autoplay);
        if (config.audio.autoplay === true) {
          this.tryAutoplay();
        } else {
          console.log('AudioManager: Autoplay disabled, audio will remain paused');
          // Update UI to show correct initial state
          if (window.App && window.App.UI) {
            window.App.UI.updateAudioButton();
          }
        }
      });

      this.audioElement.addEventListener('error', (e) => {
        console.error('AudioManager: Audio error:', e);
        console.error('AudioManager: Failed to load audio file:', this.filePath);
        console.error('AudioManager: Error details:', e.target.error);
      });

      this.audioElement.addEventListener('ended', () => {
        if (config.audio.loop !== false) {
          this.play();
        }
      });

      // Add to DOM (hidden)
      this.audioElement.style.display = 'none';
      document.body.appendChild(this.audioElement);
    },

    async tryAutoplay() {
      if (!this.audioElement) return;

      try {
        await this.audioElement.play();
        console.log('AudioManager: Autoplay started successfully');
      } catch (error) {
        console.log('AudioManager: Autoplay blocked by browser, waiting for user interaction');
        // Autoplay was blocked, will need user interaction
        this.setupUserInteractionHandler();
      }
    },

    setupUserInteractionHandler() {
      console.log('AudioManager: Setting up user interaction handler for autoplay');

      const handleUserInteraction = async (event) => {
        console.log('AudioManager: User interaction detected, attempting to start audio');
        try {
          await this.audioElement.play();
          console.log('AudioManager: Audio started successfully after user interaction');
          // Update UI button state
          if (window.App && window.App.UI) {
            window.App.UI.updateAudioButton();
          }
        } catch (error) {
          console.error('AudioManager: Failed to start audio after user interaction:', error);
        }
      };

      // Listen for any user interaction
      document.addEventListener('click', handleUserInteraction, { once: true });
      document.addEventListener('keydown', handleUserInteraction, { once: true });
      document.addEventListener('touchstart', handleUserInteraction, { once: true });

      console.log('AudioManager: User interaction listeners added');
    },

    async play() {
      if (!this.audioElement || !this.isEnabled) {
        console.log('AudioManager: Play called but audio element not ready or disabled');
        return;
      }

      try {
        console.log('AudioManager: Attempting to play audio...');
        await this.audioElement.play();
        console.log('AudioManager: Audio playing successfully');
        // Update UI button state
        if (window.App && window.App.UI) {
          window.App.UI.updateAudioButton();
        }
      } catch (error) {
        console.error('AudioManager: Failed to play audio:', error);
        console.error('AudioManager: Error name:', error.name);
        console.error('AudioManager: Error message:', error.message);
      }
    },

    pause() {
      if (!this.audioElement) return;

      this.audioElement.pause();
      console.log('AudioManager: Audio paused');
      // Update UI button state
      if (window.App && window.App.UI) {
        window.App.UI.updateAudioButton();
      }
    },

    stop() {
      if (!this.audioElement) return;

      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      console.log('AudioManager: Audio stopped');
    },

    setVolume(volume) {
      if (!this.audioElement) return;

      this.volume = Math.max(0, Math.min(1, volume));
      this.audioElement.volume = this.volume;
      console.log(`AudioManager: Volume set to ${this.volume}`);
    },

    toggle() {
      if (!this.audioElement) return;

      if (this.audioElement.paused) {
        this.play();
      } else {
        this.pause();
      }
    },

    isPlaying() {
      return this.audioElement && !this.audioElement.paused;
    }
  };

  /**
   * Favorites Manager - Handles saving and loading painting states
   */
  const FavoritesManager = {
    async captureCurrentState() {
      // Capture only visible layers from AnimationEngine
      const layers = [];

      AnimationEngine.activeLayers.forEach((layerInfo, imageId) => {
        // Get the actual current opacity from the DOM element
        // Always use getComputedStyle to get the current animated opacity value
        const computedOpacity = getComputedStyle(layerInfo.layer).opacity;
        const actualOpacity = computedOpacity;

        const layerData = {
          imageId: imageId,
          opacity: parseFloat(actualOpacity), // Use actual displayed opacity
          transformations: {
            rotation: layerInfo.transformations.rotation,
            scale: layerInfo.transformations.scale,
            translateX: layerInfo.transformations.translateX,
            translateY: layerInfo.transformations.translateY,
            hueShift: layerInfo.transformations.hueShift
          },
          animationPhase: layerInfo.phase
        };

        console.log(`FavoritesManager: Capturing layer ${imageId} - stored opacity: ${layerInfo.opacity}, computed opacity: ${computedOpacity}, using: ${layerData.opacity}`);
        layers.push(layerData);
      });

      if (layers.length === 0) {
        throw new Error('No active layers to save');
      }

      const state = {
        timestamp: new Date().toISOString(),
        layers: layers,
        backgroundColor: UI.isWhiteBackground ? 'white' : 'black'
      };

      console.log('FavoritesManager: Captured state:', state);
      return state;
    },

    async saveFavorite() {
      try {
        const state = await this.captureCurrentState();

        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(state)
        });

        if (!response.ok) {
          throw new Error(`Failed to save favorite: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('FavoritesManager: Favorite saved with ID:', result.id);

        // Show success feedback
        UI.showSuccess('Favorite saved!');

        return result.id;
      } catch (error) {
        console.error('FavoritesManager: Failed to save favorite:', error);
        UI.showError('Failed to save favorite: ' + error.message);
        throw error;
      }
    },

    async loadFavorite(favoriteId) {
      try {
        const response = await fetch(`/api/favorites/${favoriteId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Favorite not found');
          }
          throw new Error(`Failed to load favorite: ${response.statusText}`);
        }

        const state = await response.json();
        console.log('FavoritesManager: Loading favorite state:', state);

        await this.restoreState(state);
        console.log('FavoritesManager: Favorite restored successfully');

      } catch (error) {
        console.error('FavoritesManager: Failed to load favorite:', error);
        UI.showError('Failed to load favorite: ' + error.message);
        throw error;
      }
    },

    async restoreState(state) {
      // Stop any ongoing pattern sequence first
      PatternManager.stopPatternSequence();

      // Clear all current layers immediately (no fade transitions)
      AnimationEngine.clearAllLayersImmediate();

      // Restore background color if saved
      if (state.backgroundColor) {
        const shouldBeWhite = state.backgroundColor === 'white';
        if (UI.isWhiteBackground !== shouldBeWhite) {
          UI.toggleBackground();
        }
      }

      // Wait a moment for DOM cleanup and background change to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Restore each layer from the saved state with staggered timing
      for (let i = 0; i < state.layers.length; i++) {
        const layerData = state.layers[i];
        try {
          // Create layer with saved transformations and staggered timing
          const options = {
            seed: `favorite-${Date.now()}-${layerData.imageId}`,
            favoriteData: layerData,
            layerIndex: i, // Pass the index for staggered timing
            totalLayers: state.layers.length
          };

          await AnimationEngine.showImageFromFavorite(layerData.imageId, options);

        } catch (error) {
          console.warn(`FavoritesManager: Failed to restore layer ${layerData.imageId}:`, error);
          // Continue with other layers even if one fails
        }
      }

      // Start new pattern sequence much sooner so new layers appear while favorites are still fading
      // The first favorite layer will start fading at 3s, so start new patterns after 1.5s
      const speedMultiplier = UI.speedMultiplier || 1.0;
      const restartDelay = Math.max(200, 1500 / speedMultiplier); // 1.5s at normal speed, minimum 200ms

      setTimeout(() => {
        console.log('FavoritesManager: Restarting pattern sequence (early start while favorites fade)');
        PatternManager.startPatternSequence();
      }, restartDelay);
    },

    async listFavorites() {
      try {
        const response = await fetch('/api/favorites');

        if (!response.ok) {
          throw new Error(`Failed to load favorites: ${response.statusText}`);
        }

        const favorites = await response.json();
        console.log('FavoritesManager: Loaded favorites list:', favorites);
        return favorites;

      } catch (error) {
        console.error('FavoritesManager: Failed to list favorites:', error);
        throw error;
      }
    },

    async deleteFavorite(favoriteId) {
      try {
        const response = await fetch(`/api/favorites/${favoriteId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error(`Failed to delete favorite: ${response.statusText}`);
        }

        console.log(`FavoritesManager: Deleted favorite ${favoriteId}`);
        return true;

      } catch (error) {
        console.error('FavoritesManager: Failed to delete favorite:', error);
        throw error;
      }
    }
  };

  /**
   * Favorites Gallery Manager - Handles the favorites gallery modal UI
   */
  const FavoritesGallery = {
    modal: null,
    grid: null,
    loading: null,
    empty: null,

    init() {
      this.modal = document.getElementById('favorites-modal');
      this.grid = document.getElementById('favorites-grid');
      this.loading = document.getElementById('favorites-loading');
      this.empty = document.getElementById('favorites-empty');

      const closeBtn = document.getElementById('favorites-modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hide());
      }

      // Close modal when clicking outside content
      if (this.modal) {
        this.modal.addEventListener('click', (e) => {
          if (e.target === this.modal) {
            this.hide();
          }
        });
      }

      // Close modal with ESC key
      this.escKeyHandler = (e) => {
        if (e.key === 'Escape' && this.modal && this.modal.style.display !== 'none') {
          this.hide();
        }
      };
      document.addEventListener('keydown', this.escKeyHandler);

      console.log('FavoritesGallery: Initialized', {
        modal: !!this.modal,
        grid: !!this.grid,
        loading: !!this.loading,
        empty: !!this.empty
      });
    },

    async show() {
      if (!this.modal) return;

      this.modal.classList.remove('hidden');
      this.showLoading();

      try {
        const favorites = await FavoritesManager.listFavorites();
        this.renderFavorites(favorites);
      } catch (error) {
        console.error('FavoritesGallery: Failed to load favorites:', error);
        this.showEmpty();
      }
    },

    hide() {
      if (this.modal) {
        this.modal.classList.add('hidden');
      }
    },

    showLoading() {
      if (this.loading) this.loading.classList.remove('hidden');
      if (this.empty) this.empty.classList.add('hidden');
      if (this.grid) this.grid.classList.add('hidden');
    },

    showEmpty() {
      if (this.loading) this.loading.classList.add('hidden');
      if (this.empty) this.empty.classList.remove('hidden');
      if (this.grid) this.grid.classList.add('hidden');
    },

    showGrid() {
      if (this.loading) this.loading.classList.add('hidden');
      if (this.empty) this.empty.classList.add('hidden');
      if (this.grid) this.grid.classList.remove('hidden');
    },

    renderFavorites(favorites) {
      if (!this.grid) return;

      if (favorites.length === 0) {
        this.showEmpty();
        return;
      }

      this.showGrid();
      this.grid.innerHTML = '';

      favorites.forEach(favorite => {
        const card = this.createFavoriteCard(favorite);
        this.grid.appendChild(card);
      });
    },

    createFavoriteCard(favorite) {
      const cardContainer = document.createElement('div');
      cardContainer.className = 'relative';

      const card = document.createElement('div');
      card.className = 'bg-white rounded-lg border border-black/10 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group';

      const preview = this.createPreview(favorite.preview.layers);
      const date = new Date(favorite.created_at).toLocaleDateString();
      const time = new Date(favorite.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      card.innerHTML = `
        <div class="relative aspect-square bg-black/5 overflow-hidden">
          ${preview}
          <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        <div class="p-3">
          <div class="flex items-center justify-between">
            <div class="text-sm text-black/70">
              <div>${date}</div>
              <div class="text-xs text-black/50">${time}</div>
            </div>
            <div class="text-xs text-black/50">
              ${favorite.layer_count} layer${favorite.layer_count !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      `;

      // Create delete button as separate element
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg z-20';
      deleteBtn.title = 'Delete';
      deleteBtn.innerHTML = `
        <svg class="w-3 h-3 opacity-70 hover:opacity-100 transition-opacity duration-200" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      `;

      // Add both elements to container
      cardContainer.appendChild(card);
      cardContainer.appendChild(deleteBtn);

      // Add event handlers with debugging
      deleteBtn.addEventListener('click', (e) => {
        console.log('Delete button clicked!', e);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        console.log('Deleting favorite:', favorite.id);
        this.deleteFavorite(favorite.id, cardContainer);
      });

      card.addEventListener('click', (e) => {
        console.log('Card clicked!', e);
        console.log('Loading favorite:', favorite.id);
        this.loadFavorite(favorite.id);
      });

      return cardContainer;
    },

    createPreview(layers) {
      if (!layers || layers.length === 0) {
        return '<div class="absolute inset-0 bg-black/10 flex items-center justify-center text-black/30">No Preview</div>';
      }

      let html = '';
      layers.slice(0, 4).forEach((layer, index) => {
        const zIndex = 10 + index;
        const opacity = Math.max(0.1, Math.min(1.0, layer.opacity || 0.8));
        const rotation = (layer.transformations?.rotation || 0) * 0.5; // Scale down rotation for preview
        const scale = Math.max(0.5, Math.min(1.2, layer.transformations?.scale || 1));
        const translateX = (layer.transformations?.translateX || 0) * 0.2; // Scale down for preview
        const translateY = (layer.transformations?.translateY || 0) * 0.2;
        const hueShift = layer.transformations?.hueShift || 0;

        const transform = `rotate(${rotation}deg) scale(${scale}) translate(${translateX}px, ${translateY}px)`;
        const filter = hueShift ? `hue-rotate(${hueShift}deg)` : '';

        // Get the actual image path from ImageManager
        let imageUrl = null;
        if (window.App && window.App.ImageManager && window.App.ImageManager.images) {
          const imageInfo = window.App.ImageManager.images.get(layer.imageId);
          if (imageInfo) {
            imageUrl = imageInfo.path;
          }
        }

        if (!imageUrl) {
          // Fallback to colored div if no image found
          const colors = ['bg-blue-300', 'bg-purple-300', 'bg-pink-300', 'bg-green-300', 'bg-yellow-300'];
          const colorClass = colors[index % colors.length];
          html += `
            <div class="absolute inset-0 ${colorClass}" 
                 style="z-index: ${zIndex}; transform: ${transform}; filter: ${filter}; transform-origin: center; opacity: ${opacity};">
            </div>
          `;
        } else {
          html += `
            <div class="absolute inset-0" 
                 style="z-index: ${zIndex}; transform: ${transform}; filter: ${filter}; transform-origin: center; opacity: ${opacity};">
              <img src="${imageUrl}" 
                   class="w-full h-full object-contain" 
                   style="mix-blend-mode: multiply;"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
              <div class="w-full h-full bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200" 
                   style="display: none;"></div>
            </div>
          `;
        }
      });

      return html;
    },

    async loadFavorite(favoriteId) {
      try {
        this.hide();
        await FavoritesManager.loadFavorite(favoriteId);
        UI.showSuccess('Favorite loaded');
      } catch (error) {
        console.error('FavoritesGallery: Failed to load favorite:', error);
        UI.showError('Failed to load favorite: ' + error.message);
      }
    },

    async deleteFavorite(favoriteId, cardElement) {
      try {
        await FavoritesManager.deleteFavorite(favoriteId);
        cardElement.remove();

        // Check if grid is now empty
        if (this.grid && this.grid.children.length === 0) {
          this.showEmpty();
        }

        UI.showSuccess('Favorite deleted');
      } catch (error) {
        console.error('FavoritesGallery: Failed to delete favorite:', error);
        UI.showError('Failed to delete favorite: ' + error.message);
      }
    }
  };


  /**
   * UI Manager - Handles user interface and interactions
   */
  const UI = {
    errorElement: null,
    loadingElement: null,
    isWhiteBackground: false,
    onscreenControls: null,
    mouseTimer: null,
    speedMultiplier: 1.0,
    maxLayers: 4,

    init() {
      this.errorElement = document.getElementById('error-message');
      this.loadingElement = document.getElementById('loading-indicator');
      this.onscreenControls = document.getElementById('onscreen-controls');
      this.controlsTriggerArea = document.getElementById('controls-trigger-area');

      console.log('UI: Elements found:', {
        onscreenControls: !!this.onscreenControls,
        controlsTriggerArea: !!this.controlsTriggerArea
      });

      // Initialize UI values from config
      this.maxLayers = config.layer_management?.max_concurrent_layers || 4;
      console.log(`UI: Initialized with maxLayers: ${this.maxLayers}, config.layer_management.max_concurrent_layers: ${config.layer_management?.max_concurrent_layers}`);

      // Background preference will default to black (no persistence)
      this.isWhiteBackground = false;
      // Always update the background toggle button state
      this.updateBackgroundToggle();

      this.setupEventListeners();
      this.setupOnscreenControls();

      // Ensure onscreen controls start hidden
      if (this.onscreenControls && !kioskMode) {
        this.onscreenControls.classList.remove('visible');
        console.log('UI: Onscreen controls initialized as hidden');
      }

      this.showMainControls();
      this.hideLoading();
    },

    setupEventListeners() {
      // Play/Pause button (in onscreen controls)
      const playPauseBtn = document.getElementById('play-pause-btn');
      if (playPauseBtn) {
        playPauseBtn.addEventListener('click', this.togglePlayPause.bind(this));
      }

      // New pattern button (in onscreen controls)
      const newPatternBtn = document.getElementById('new-pattern-btn');
      if (newPatternBtn) {
        newPatternBtn.addEventListener('click', this.generateNewPattern.bind(this));
      }

      // Background toggle button (in onscreen controls)
      const backgroundToggleBtn = document.getElementById('background-toggle-btn');
      if (backgroundToggleBtn) {
        backgroundToggleBtn.addEventListener('click', this.toggleBackground.bind(this));
      }

      // Audio toggle button (in onscreen controls)
      const audioToggleBtn = document.getElementById('audio-toggle-btn');
      if (audioToggleBtn) {
        audioToggleBtn.addEventListener('click', this.toggleAudio.bind(this));
      }


      // Retry button
      const retryBtn = document.getElementById('retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', this.retry.bind(this));
      }

      // Keyboard shortcuts (non-kiosk mode)
      if (!kioskMode) {
        document.addEventListener('keydown', this.handleKeydown.bind(this));
      }

      // Mouse movement detection for onscreen controls (non-kiosk mode)
      if (!kioskMode && this.controlsTriggerArea) {
        console.log('UI: Setting up mouse events for control trigger area');
        this.controlsTriggerArea.addEventListener('mouseenter', this.showOnscreenControls.bind(this));
        this.controlsTriggerArea.addEventListener('mouseleave', this.scheduleHideControls.bind(this));

        // Also add pointer events to ensure trigger works
        this.controlsTriggerArea.style.pointerEvents = 'auto';

        // Add debugging
        this.controlsTriggerArea.addEventListener('mouseenter', () => {
          console.log('UI: Mouse entered trigger area');
        });
        this.controlsTriggerArea.addEventListener('mouseleave', () => {
          console.log('UI: Mouse left trigger area');
        });
      } else {
        console.log('UI: Not setting up mouse events. kioskMode:', kioskMode, 'controlsTriggerArea:', !!this.controlsTriggerArea);
      }

      // Window resize listener for matte border
      window.addEventListener('resize', () => {
        if (window.App && window.App.MatteBorderManager) {
          window.App.MatteBorderManager.handleResize();
        }
      });

      // Click outside to close onscreen controls (non-kiosk mode)
      if (!kioskMode) {
        document.addEventListener('click', this.handleClickOutside.bind(this));
      }

    },

    setupOnscreenControls() {
      if (!this.onscreenControls || kioskMode) return;

      // Speed slider (1-10 maps to speed multipliers)
      const speedSlider = document.getElementById('speed-slider');
      const speedValue = document.getElementById('speed-value');
      if (speedSlider && speedValue) {
        speedSlider.addEventListener('input', (e) => {
          const sliderValue = parseInt(e.target.value);
          // Map 1-10 to speed multipliers: 1=0.1x, 2=0.2x, 3=0.5x, 4=0.8x, 5=1.0x, 6=1.5x, 7=2.0x, 8=3.0x, 9=5.0x, 10=10.0x
          const speedMap = [0, 0.1, 0.2, 0.5, 0.8, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0];
          this.speedMultiplier = speedMap[sliderValue];
          speedValue.textContent = `${sliderValue}`;
          console.log(`UI: Speed changed to level ${sliderValue} (${this.speedMultiplier}x)`);
          this.updateAnimationSpeed();
        });
      }

      // Layers slider
      const layersSlider = document.getElementById('layers-slider');
      const layersValue = document.getElementById('layers-value');
      if (layersSlider && layersValue) {
        layersSlider.addEventListener('input', (e) => {
          this.maxLayers = parseInt(e.target.value);
          layersValue.textContent = this.maxLayers.toString();
          console.log(`UI: Max layers changed to ${this.maxLayers}`);
          this.updateMaxLayers();
        });
      }

      // Audio volume slider (0-100 in steps of 10)
      const audioVolumeSlider = document.getElementById('audio-volume-slider');
      const audioVolumeValue = document.getElementById('audio-volume-value');
      if (audioVolumeSlider && audioVolumeValue) {
        audioVolumeSlider.addEventListener('input', (e) => {
          const volumePercent = parseInt(e.target.value);
          const volume = volumePercent / 100; // Convert to 0-1 range for audio API
          audioVolumeValue.textContent = `${volumePercent}%`;
          console.log(`UI: Audio volume changed to ${volumePercent}% (${volume})`);
          AudioManager.setVolume(volume);
        });
      }


      // Set initial values from config
      if (speedSlider) {
        // Convert current speedMultiplier back to 1-10 slider value
        const speedMap = [0, 0.1, 0.2, 0.5, 0.8, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0];
        let sliderValue = 5; // Default to middle (1.0x speed)
        for (let i = 1; i < speedMap.length; i++) {
          if (Math.abs(this.speedMultiplier - speedMap[i]) < 0.05) {
            sliderValue = i;
            break;
          }
        }
        speedSlider.value = sliderValue;
      }
      if (speedValue) {
        // Display the slider value (1-10) instead of speed multiplier
        const currentSliderValue = speedSlider ? speedSlider.value : 5;
        speedValue.textContent = `${currentSliderValue}`;
      }
      if (layersSlider) layersSlider.value = this.maxLayers;
      if (layersValue) layersValue.textContent = this.maxLayers.toString();
      if (audioVolumeSlider) {
        const volumePercent = Math.round(((config.audio && config.audio.volume) || 0.5) * 100);
        audioVolumeSlider.value = Math.round(volumePercent / 10) * 10; // Round to nearest 10
      }
      if (audioVolumeValue) {
        const volumePercent = Math.round(((config.audio && config.audio.volume) || 0.5) * 100);
        audioVolumeValue.textContent = `${Math.round(volumePercent / 10) * 10}%`;
      }

      // Initialize play/pause button
      this.updatePlayPauseButton();
    },


    showOnscreenControls() {
      if (!this.onscreenControls || kioskMode) return;

      console.log('UI: Showing onscreen controls');
      this.onscreenControls.classList.add('visible');

      // Clear any existing timer
      if (this.mouseTimer) {
        clearTimeout(this.mouseTimer);
        this.mouseTimer = null;
      }
    },

    scheduleHideControls() {
      if (!this.onscreenControls || kioskMode) return;

      console.log('UI: Scheduling hide controls');

      // Clear existing timer
      if (this.mouseTimer) {
        clearTimeout(this.mouseTimer);
      }

      // Hide after 3 seconds of no mouse movement
      this.mouseTimer = setTimeout(() => {
        this.hideOnscreenControls();
      }, 3000);
    },

    updateAnimationSpeed() {
      // Update the pattern sequence interval based on speed multiplier
      console.log(`UI: Updating animation speed to ${this.speedMultiplier}x`);

      // Update existing layers' animation speeds
      AnimationEngine.updateExistingLayerSpeeds(this.speedMultiplier);

      if (PatternManager.patternInterval) {
        console.log('UI: Restarting pattern sequence with new speed');
        PatternManager.stopPatternSequence();
        PatternManager.startPatternSequence();
      } else {
        console.log('UI: No active pattern interval to update');
      }
    },

    updateMaxLayers() {
      // Update the maximum concurrent layers configuration
      console.log(`UI: Updating max concurrent layers to ${this.maxLayers}`);
      if (!config.layer_management) config.layer_management = {};
      config.layer_management.max_concurrent_layers = this.maxLayers;
      console.log(`UI: Config updated - max_concurrent_layers: ${config.layer_management.max_concurrent_layers}`);

      // If we've reduced the layer limit, remove excess layers immediately
      const currentLayerCount = AnimationEngine.activeLayers.size;
      if (currentLayerCount > this.maxLayers) {
        const excessLayers = currentLayerCount - this.maxLayers;
        console.log(`UI: Removing ${excessLayers} excess layers (${currentLayerCount} -> ${this.maxLayers})`);
        this.removeExcessLayers(excessLayers);
      }
    },

    removeExcessLayers(count) {
      // Remove the oldest layers first (FIFO)
      const layerEntries = Array.from(AnimationEngine.activeLayers.entries());
      const layersToRemove = layerEntries.slice(0, count);

      layersToRemove.forEach(([imageId, layerInfo]) => {
        console.log(`UI: Force removing layer ${imageId}`);
        // Start immediate fade out
        layerInfo.phase = 'fade-out';
        layerInfo.layer.style.transition = 'opacity 500ms ease-out';
        layerInfo.layer.style.opacity = '0';

        // Remove after short fade
        setTimeout(() => {
          AnimationEngine.removeLayer(layerInfo);
        }, 500);
      });
    },


    handleKeydown(event) {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          this.togglePlayPause();
          break;
        case 'KeyN':
          event.preventDefault();
          this.generateNewPattern();
          break;
        case 'KeyB':
          event.preventDefault();
          this.toggleBackground();
          break;
        case 'KeyA':
          event.preventDefault();
          this.toggleAudio();
          break;
        case 'KeyF':
          event.preventDefault();
          this.saveFavorite();
          break;
        case 'KeyG':
          event.preventDefault();
          if (AnimationEngine.toggleRuleOfThirdsGrid) {
            AnimationEngine.toggleRuleOfThirdsGrid();
          }
          break;
        case 'KeyV':
          event.preventDefault();
          this.showFavoritesGallery();
          break;
      }
    },

    handleClickOutside(event) {
      if (!this.onscreenControls || kioskMode) return;

      // Check if the panel is currently visible
      if (!this.onscreenControls.classList.contains('visible')) return;

      // Check if the click was inside the control panel
      const clickedInsidePanel = this.onscreenControls.contains(event.target);

      // Debug logging
      console.log('UI: Click detected at:', event.clientX, event.clientY);
      console.log('UI: Clicked inside panel:', clickedInsidePanel);
      console.log('UI: Target element:', event.target);

      // If clicked outside the panel, hide the controls
      // Note: clicks in trigger area should hide controls when they're visible
      if (!clickedInsidePanel) {
        console.log('UI: Click outside panel detected, hiding onscreen controls');
        this.hideOnscreenControls();
      } else {
        console.log('UI: Click inside panel, keeping controls visible');
      }
    },

    hideOnscreenControls() {
      if (!this.onscreenControls || kioskMode) return;

      console.log('UI: Hiding onscreen controls');
      this.onscreenControls.classList.remove('visible');

      // Clear any existing timer
      if (this.mouseTimer) {
        clearTimeout(this.mouseTimer);
        this.mouseTimer = null;
      }
    },

    showOnscreenControls() {
      if (!this.onscreenControls || kioskMode) {
        console.log('UI: Cannot show onscreen controls - missing element or kiosk mode', {
          onscreenControls: !!this.onscreenControls,
          kioskMode: kioskMode
        });
        return;
      }

      console.log('UI: Showing onscreen controls');
      this.onscreenControls.classList.add('visible');

      // Clear any existing timer
      if (this.mouseTimer) {
        clearTimeout(this.mouseTimer);
        this.mouseTimer = null;
      }
    },

    scheduleHideControls() {
      if (!this.onscreenControls || kioskMode) {
        console.log('UI: Cannot schedule hide controls - missing element or kiosk mode');
        return;
      }

      console.log('UI: Scheduling hide controls in 3 seconds');

      // Clear any existing timer
      if (this.mouseTimer) {
        clearTimeout(this.mouseTimer);
      }

      // Set a timer to hide controls after 3 seconds
      this.mouseTimer = setTimeout(() => {
        console.log('UI: Auto-hiding onscreen controls after timeout');
        this.hideOnscreenControls();
      }, 3000);
    },

    togglePlayPause() {
      if (AnimationEngine.isPlaying) {
        console.log('UI: Pausing animations and pattern sequence');
        AnimationEngine.stop();
        PatternManager.stopPatternSequence();
        this.updatePlayPauseButton(false);
      } else {
        console.log('UI: Resuming animations and pattern sequence');
        AnimationEngine.start();
        PatternManager.startPatternSequence();
        this.updatePlayPauseButton(true);
      }
    },

    updatePlayPauseButton(isPlaying = null) {
      const btn = document.getElementById('play-pause-btn');
      if (btn) {
        const playing = isPlaying !== null ? isPlaying : AnimationEngine.isPlaying;
        const icon = btn.querySelector('svg path');

        if (playing) {
          // Pause icon
          if (icon) icon.setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
          btn.title = 'Pause (Spacebar)';
        } else {
          // Play icon  
          if (icon) icon.setAttribute('d', 'M8 5v14l11-7z');
          btn.title = 'Play (Spacebar)';
        }
      }
    },

    toggleBackground() {
      console.log('UI: toggleBackground called, current state:', this.isWhiteBackground);
      this.isWhiteBackground = !this.isWhiteBackground;

      if (this.isWhiteBackground) {
        document.body.classList.add('white-background');
        console.log('UI: Added white-background class to body');
      } else {
        document.body.classList.remove('white-background');
        console.log('UI: Removed white-background class from body');
      }

      this.updateBackgroundToggle();
      console.log(`UI: Background switched to ${this.isWhiteBackground ? 'white' : 'black'}`);
      console.log('UI: Body classes:', document.body.className);
    },

    updateBackgroundToggle() {
      // Background toggle is now just a simple button, no need for complex updates
      const toggleBtn = document.getElementById('background-toggle-btn');
      if (toggleBtn) {
        toggleBtn.title = `Switch to ${this.isWhiteBackground ? 'Dark' : 'Light'} Background (B)`;
      }
    },

    toggleAudio() {
      AudioManager.toggle();
      this.updateAudioButton();
    },


    updateVolumeDisplay(volume) {
      const volumeValue = document.getElementById('audio-volume-value');
      if (volumeValue) {
        volumeValue.textContent = `${Math.round(volume * 100)}%`;
      }
    },

    updateAudioButton() {
      const isPlaying = AudioManager.isPlaying();

      const btn = document.getElementById('audio-toggle-btn');
      if (btn) {
        const icon = btn.querySelector('svg path');
        if (icon) {
          if (isPlaying) {
            // Speaker on icon
            icon.setAttribute('d', 'M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16.03C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z');
            btn.title = 'Pause Audio';
          } else {
            // Muted speaker icon
            icon.setAttribute('d', 'M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.52C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z');
            btn.title = 'Play Audio';
          }
        }
      }

      console.log(`UI: Audio button updated - ${isPlaying ? 'playing' : 'stopped'}`);
    },

    async generateNewPattern() {
      try {
        AnimationEngine.clearAllLayers();
        // For manual new pattern generation, don't use initial code - generate random
        await PatternManager.generateNewPattern();
      } catch (error) {
        this.showError('Failed to generate new pattern');
      }
    },

    showLoading() {
      if (this.loadingElement) {
        this.loadingElement.classList.remove('hidden');
      }
    },

    hideLoading() {
      if (this.loadingElement) {
        this.loadingElement.classList.add('hidden');
      }
    },

    showMainControls() {
      const controls = document.getElementById('controls');
      if (controls) {
        controls.classList.remove('hidden');
      }
    },

    showError(message) {
      if (this.errorElement) {
        const errorText = document.getElementById('error-text');
        if (errorText) {
          errorText.textContent = message;
        }
        this.errorElement.classList.remove('hidden');
      }
      console.error('UI Error:', message);
    },

    showSuccess(message) {
      // Create a temporary success toast
      const toast = document.createElement('div');
      toast.className = 'fixed top-8 left-1/2 transform -translate-x-1/2 bg-green-600/90 text-white px-6 py-3 rounded-lg backdrop-blur-lg z-[400] transition-all duration-300';
      toast.textContent = message;

      document.body.appendChild(toast);

      // Animate in
      setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
      }, 10);

      // Remove after 3 seconds
      setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(-100px)';
        toast.style.opacity = '0';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }, 3000);

      console.log('UI Success:', message);
    },

    hideError() {
      if (this.errorElement) {
        this.errorElement.classList.add('hidden');
      }
    },

    async retry() {
      this.hideError();
      try {
        await App.init();
      } catch (error) {
        this.showError('Retry failed');
      }
    },

    showFavoriteSuccess(favoriteId) {
      // Generate shareable URL
      const currentUrl = new URL(window.location);
      currentUrl.searchParams.set('favorite', favoriteId);
      const shareUrl = currentUrl.toString();

      // Create a temporary toast notification
      const toast = document.createElement('div');
      toast.className = 'favorite-toast';
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        backdrop-filter: blur(10px);
        font-family: monospace;
        font-size: 14px;
        z-index: 1000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 400px;
        word-break: break-all;
        cursor: pointer;
      `;

      toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #ff6b6b;">♥</span>
          <div>
            <div style="font-weight: bold;">Favorite Saved!</div>
            <div style="font-size: 12px; opacity: 0.8; margin: 4px 0;">ID: ${favoriteId}</div>
            <div style="font-size: 11px; opacity: 0.6; color: #4CAF50;">Click to copy URL</div>
          </div>
        </div>
      `;

      // Add click handler to copy URL to clipboard
      toast.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #4CAF50;">✓</span>
              <div>
                <div style="font-weight: bold;">URL Copied!</div>
                <div style="font-size: 12px; opacity: 0.8;">Share this URL to load the favorite</div>
              </div>
            </div>
          `;
        } catch (error) {
          console.warn('Failed to copy to clipboard:', error);
        }
      });

      document.body.appendChild(toast);

      // Animate in
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
      });

      // Auto-remove after 4 seconds
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }, 4000);

      console.log(`UI: Showed favorite success toast for ${favoriteId}`);
    },

    async saveFavorite() {
      try {
        const favoriteId = await FavoritesManager.saveFavorite();
        console.log(`UI: Favorite saved with ID: ${favoriteId}`);
      } catch (error) {
        console.error('UI: Failed to save favorite:', error);
      }
    },

    showFavoritesGallery() {
      if (window.App && window.App.FavoritesGallery) {
        window.App.FavoritesGallery.show();
      }
    }
  };

  /**
   * Matte Border Manager - Handles configurable frame border styling
   */
  const MatteBorderManager = {
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
        style: 'classic',
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
      this.borderElement.className = `matte-border ${this.config.style || 'classic'}`;

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
        bevelFrame.style.zIndex = '51'; // Above the matte border
        this.borderElement.parentNode.appendChild(bevelFrame);
      }

      // Calculate the image area (where the bevel frame should go)
      const imageLeft = canvas.canvasLeft + canvas.borderSize;
      const imageTop = canvas.canvasTop + canvas.borderSize;
      const imageWidth = canvas.canvasWidth - (canvas.borderSize * 2);
      const imageHeight = canvas.canvasHeight - (canvas.borderSize * 2);

      // Position the bevel frame around the image cutout area (slightly larger)
      const bevelWidth = 16; // 16px for the bevel effect area
      bevelFrame.style.left = `${imageLeft - bevelWidth}px`;
      bevelFrame.style.top = `${imageTop - bevelWidth}px`;
      bevelFrame.style.width = `${imageWidth + (bevelWidth * 2)}px`;
      bevelFrame.style.height = `${imageHeight + (bevelWidth * 2)}px`;

      // Create transparent frame with border that matches matte color
      bevelFrame.style.border = `${bevelWidth}px solid #F8F8F8`;
      bevelFrame.style.background = 'transparent'; // Transparent so images show through
      bevelFrame.style.boxSizing = 'border-box';

      // Apply 3D bevel effect based on style
      const style = this.config.style || 'classic';
      if (style === 'thick') {
        // Thick: Scale up shadow sizes by 2x
        bevelFrame.style.boxShadow = `
          inset 4px 4px 10px rgba(0, 0, 0, 0.15),
          inset -6px -6px 16px rgba(255, 255, 255, 0.35),
          inset 2px 2px 4px rgba(0, 0, 0, 0.2),
          inset -3px -3px 8px rgba(255, 255, 255, 0.4)
        `;
      } else if (style === 'medium') {
        // Medium: Scale up shadow sizes by 1.5x
        bevelFrame.style.boxShadow = `
          inset 3px 3px 7.5px rgba(0, 0, 0, 0.15),
          inset -4.5px -4.5px 12px rgba(255, 255, 255, 0.35),
          inset 1.5px 1.5px 3px rgba(0, 0, 0, 0.2),
          inset -2.25px -2.25px 6px rgba(255, 255, 255, 0.4)
        `;
      } else {
        // Thin (classic): Keep original sizes
        bevelFrame.style.boxShadow = `
          inset 2px 2px 5px rgba(0, 0, 0, 0.15),
          inset -3px -3px 8px rgba(255, 255, 255, 0.35),
          inset 1px 1px 2px rgba(0, 0, 0, 0.2),
          inset -1.5px -1.5px 4px rgba(255, 255, 255, 0.4)
        `;
      }

      console.log(`MatteBorderManager: Created 3D bevel frame (${style} style) around image area:`, {
        left: imageLeft - bevelWidth,
        top: imageTop - bevelWidth,
        width: imageWidth + (bevelWidth * 2),
        height: imageHeight + (bevelWidth * 2),
        bevelWidth
      });
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

      // Apply CSS clip-path to create matte border effect
      if (canvas && this.config && this.config.enabled !== false) {
        const clipPath = this.createMatteClipPath(canvas);
        imageLayersContainer.style.clipPath = clipPath;
      } else {
        // Remove clipping when matte border is disabled
        imageLayersContainer.style.clipPath = 'none';
      }

      console.log('MatteBorderManager: Applied virtual coordinate system with CSS clipping');
    },

    handleResize() {
      // Reapply virtual coordinate system and clipping on window resize
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
    },

    createMatteClipPath(canvas) {
      // Calculate the inner area (image area) in viewport coordinates
      const shadowInset = 4; // Maximum shadow depth
      const innerLeft = canvas.canvasLeft + canvas.borderSize + shadowInset;
      const innerTop = canvas.canvasTop + canvas.borderSize + shadowInset;
      const innerRight = innerLeft + (canvas.canvasWidth - (canvas.borderSize * 2) - (shadowInset * 2));
      const innerBottom = innerTop + (canvas.canvasHeight - (canvas.borderSize * 2) - (shadowInset * 2));

      // Convert to percentages for CSS clip-path
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const leftPercent = (innerLeft / viewportWidth) * 100;
      const topPercent = (innerTop / viewportHeight) * 100;
      const rightPercent = (innerRight / viewportWidth) * 100;
      const bottomPercent = (innerBottom / viewportHeight) * 100;

      // Create rectangular clip path for the image area
      const clipPath = `polygon(${leftPercent}% ${topPercent}%, ${rightPercent}% ${topPercent}%, ${rightPercent}% ${bottomPercent}%, ${leftPercent}% ${bottomPercent}%)`;

      console.log('MatteBorderManager: Created clip path:', clipPath);
      return clipPath;
    },

    setViewportBackground(color) {
      // No longer needed since matte overlay covers entire viewport
      // Keeping method for backward compatibility but making it a no-op
      console.log('MatteBorderManager: Viewport background handled by matte overlay');
    },

    // Handle window resize to recalculate border width
    handleResize() {
      if (this.config && this.config.enabled) {
        this.applyConfiguration();
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
        imageLayersContainer.style.clipPath = 'none'; // Remove any clipping
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

      // Remove the inner bevel frame element
      const bevelFrame = document.getElementById('inner-bevel-frame');
      if (bevelFrame) {
        bevelFrame.remove();
      }

      // Reset viewport background to original (black)
      this.resetViewportBackground();

      console.log('MatteBorderManager: Reset matte canvas to full viewport');
    },

    resetViewportBackground() {
      // Reset body and canvas container backgrounds to original colors
      const body = document.body;
      const canvasContainer = document.getElementById('canvas-container');

      if (body) {
        body.style.backgroundColor = ''; // Remove inline style, let CSS take over
      }

      if (canvasContainer) {
        canvasContainer.style.backgroundColor = ''; // Remove inline style, let CSS take over
      }

      console.log('MatteBorderManager: Reset viewport background to original');
    }
  };

  /**
   * Main Application Interface
   */
  return {
    async init(options = {}) {
      if (isInitialized) {
        console.warn('App already initialized');
        return;
      }

      try {
        console.log('Initializing Many Paintings App...');

        // Load configuration from API
        console.log('Loading configuration from /api/config...');
        const configResponse = await fetch('/api/config');
        if (!configResponse.ok) {
          throw new Error(`Failed to load config: ${configResponse.status}`);
        }
        const apiConfig = await configResponse.json();
        
        // Merge with any options passed in
        config = { ...apiConfig, ...options };
        window.APP_CONFIG = config; // Keep for backward compatibility
        kioskMode = options.kioskMode || false;
        
        console.log('Configuration loaded:', config);

        // Initialize modules in sequence
        UI.init();
        FavoritesGallery.init();

        await ImageManager.init();
        AnimationEngine.init();
        AudioManager.init();

        // Initialize matte border after other modules are ready
        MatteBorderManager.init();

        await PatternManager.init();

        AnimationEngine.start();
        isInitialized = true;

        console.log('App initialization complete');
        console.log(`ImageManager loaded ${ImageManager.images.size} images`);

        // Check for favorite parameter in URL
        this.checkForFavoriteParameter();

      } catch (error) {
        console.error('App initialization failed:', error);
        UI.showError('Application failed to start');
        throw error;
      }
    },

    checkForFavoriteParameter() {
      // Check URL parameters for favorite ID
      const urlParams = new URLSearchParams(window.location.search);
      const favoriteId = urlParams.get('favorite');

      if (favoriteId) {
        console.log(`App: Found favorite parameter in URL: ${favoriteId}`);

        // Wait a shorter time for initialization, then load favorite
        setTimeout(async () => {
          try {
            await FavoritesManager.loadFavorite(favoriteId);
            console.log(`App: Successfully loaded favorite from URL: ${favoriteId}`);

            // Optionally clean the URL (remove the parameter)
            const newUrl = new URL(window.location);
            newUrl.searchParams.delete('favorite');
            window.history.replaceState({}, document.title, newUrl);

          } catch (error) {
            console.error(`App: Failed to load favorite from URL: ${favoriteId}`, error);
            UI.showError(`Failed to load favorite: ${error.message}`);
          }
        }, 500); // Reduced from 2000ms to 500ms
      }
    },

    // Public API
    ImageManager,
    AnimationEngine,
    PatternManager,
    AudioManager,
    MatteBorderManager,
    FavoritesManager,
    FavoritesGallery,
    UI
  };
})();