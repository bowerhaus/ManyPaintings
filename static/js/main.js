/**
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
      if (this.loadedImages.size <= config.maxConcurrentImages) {
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
      const shuffled = allIds.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
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

    init() {
      this.layersContainer = document.getElementById('image-layers');
      this.frameRate = config.animationFPS || 30;
      this.frameInterval = 1000 / this.frameRate;

      if (!this.layersContainer) {
        throw new Error('Image layers container not found');
      }

      // Apply animation quality class to body
      document.body.className = `animation-quality-${config.animationQuality || 'high'}`;

      console.log(`AnimationEngine: Initialized with ${this.frameRate} FPS target`);
      console.log(`AnimationEngine: Max concurrent layers: ${config.maxConcurrentLayers || 5}`);
      console.log(`AnimationEngine: Animation quality: ${config.animationQuality || 'high'}`);
    },

    start() {
      if (!this.isPlaying) {
        this.isPlaying = true;
        this.animate();
      }
    },

    stop() {
      this.isPlaying = false;
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
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
      if (this.activeLayers.size >= (config.maxConcurrentLayers || 5)) {
        console.log(`AnimationEngine: Max concurrent layers (${config.maxConcurrentLayers || 5}) reached, skipping ${imageId}`);
        return null;
      }

      try {
        const img = await ImageManager.loadImage(imageId);

        // Generate deterministic timing and transformation parameters (affected by speed multiplier)
        const speedMultiplier = UI.speedMultiplier || 1.0;
        
        // Create seeded random generator for this specific image instance
        const animationSeed = options.seed ? `${imageId}-${options.seed}-animation` : imageId;
        const animationRandom = this.seededRandom(this.hashCode(animationSeed));
        
        const baseFadeInDuration = this.seededRandomBetween(animationRandom, config.fadeInMinSec || 2, config.fadeInMaxSec || 5) * 1000;
        const baseFadeOutDuration = this.seededRandomBetween(animationRandom, config.fadeOutMinSec || 3, config.fadeOutMaxSec || 6) * 1000;
        const baseHoldTime = this.seededRandomBetween(animationRandom, config.minHoldTimeSec || 4, config.maxHoldTimeSec || 12) * 1000;

        const fadeInDuration = baseFadeInDuration / speedMultiplier;
        const fadeOutDuration = baseFadeOutDuration / speedMultiplier;
        const holdTime = baseHoldTime / speedMultiplier;
        const minOpacity = config.minOpacity || 0.7;
        const maxOpacity = config.maxOpacity || 0.8;
        const opacity = Math.min(maxOpacity, animationRandom() * (maxOpacity - minOpacity) + minOpacity);

        console.log(`AnimationEngine: Speed ${speedMultiplier}x - fadeIn: ${fadeInDuration}ms, hold: ${holdTime}ms, fadeOut: ${fadeOutDuration}ms`);

        const transformations = this.generateTransformations(imageId, options.seed);
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

      const { layer } = layerInfo;
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

    generateTransformations(imageId, seed = null) {
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
        translateY: 0
      };

      if (config.rotationEnabled) {
        transformations.rotation = random() * (config.rotationMaxDegrees - config.rotationMinDegrees) + config.rotationMinDegrees;
      }

      if (config.scaleEnabled) {
        transformations.scale = random() * (config.scaleMaxFactor - config.scaleMinFactor) + config.scaleMinFactor;
      }

      if (config.translationEnabled) {
        // Translation as percentage of viewport
        transformations.translateX = (random() - 0.5) * 2 * config.translationXRange;
        transformations.translateY = (random() - 0.5) * 2 * config.translationYRange;
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

      const imgElement = img.cloneNode();
      imgElement.draggable = false;

      // Apply transformations in proper order: scale -> rotate -> translate
      if (transformations) {
        const transforms = [];

        // Scale first (around center)
        if (config.scaleEnabled && transformations.scale !== 1) {
          transforms.push(`scale(${transformations.scale})`);
        }

        // Rotate second (around center of scaled image)
        if (config.rotationEnabled && transformations.rotation) {
          transforms.push(`rotate(${transformations.rotation}deg)`);
        }

        // Translate last (move the final transformed image)
        if (config.translationEnabled && (transformations.translateX || transformations.translateY)) {
          transforms.push(`translate(${transformations.translateX}vw, ${transformations.translateY}vh)`);
        }

        if (transforms.length > 0) {
          imgElement.style.transform = transforms.join(' ');
          imgElement.style.transformOrigin = 'center center';
        }
      }

      layer.appendChild(imgElement);
      return layer;
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
        const upcomingImages = this.imageSequence.slice(0, config.preloadBufferSize || 5);
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

      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(seededRandom() * allImageIds.length);
        sequence.push(allImageIds[randomIndex]);
      }

      console.log(`PatternManager: Generated sequence with ${allImageIds.length} available images, first few IDs: ${allImageIds.slice(0, 5).join(', ')}`);

      return sequence;
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

    startPatternSequence() {
      this.stopPatternSequence();

      // Show first image immediately
      this.showNextImage();

      // Schedule next images based on configuration and speed multiplier
      const baseInterval = (config.layerSpawnIntervalSec || 4) * 1000;
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
      const upcomingCount = Math.min(config.preloadBufferSize || 5, this.imageSequence.length);
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

      // Initialize UI values from config
      this.maxLayers = config.maxConcurrentLayers || 4;
      console.log(`UI: Initialized with maxLayers: ${this.maxLayers}, config.maxConcurrentLayers: ${config.maxConcurrentLayers}`);

      // Load background preference from localStorage
      const savedBackground = localStorage.getItem('manypaintings-background');
      if (savedBackground === 'white') {
        this.isWhiteBackground = true;
        document.body.classList.add('white-background');
      }

      this.setupEventListeners();
      this.setupOnscreenControls();
      this.hideLoading();
    },

    setupEventListeners() {
      // Play/Pause button
      const playPauseBtn = document.getElementById('play-pause-btn');
      if (playPauseBtn) {
        playPauseBtn.addEventListener('click', this.togglePlayPause.bind(this));
      }

      // New pattern button
      const newPatternBtn = document.getElementById('new-pattern-btn');
      if (newPatternBtn) {
        newPatternBtn.addEventListener('click', this.generateNewPattern.bind(this));
      }

      // Background toggle button
      const backgroundToggleBtn = document.getElementById('background-toggle-btn');
      if (backgroundToggleBtn) {
        backgroundToggleBtn.addEventListener('click', this.toggleBackground.bind(this));
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
        this.controlsTriggerArea.addEventListener('mouseenter', this.showOnscreenControls.bind(this));
        this.controlsTriggerArea.addEventListener('mouseleave', this.scheduleHideControls.bind(this));
      }

    },

    setupOnscreenControls() {
      if (!this.onscreenControls || kioskMode) return;

      // Speed slider
      const speedSlider = document.getElementById('speed-slider');
      const speedValue = document.getElementById('speed-value');
      if (speedSlider && speedValue) {
        speedSlider.addEventListener('input', (e) => {
          this.speedMultiplier = parseFloat(e.target.value);
          speedValue.textContent = `${this.speedMultiplier.toFixed(1)}x`;
          console.log(`UI: Speed changed to ${this.speedMultiplier}x`);
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


      // Set initial values from config
      if (speedSlider) speedSlider.value = this.speedMultiplier;
      if (speedValue) speedValue.textContent = `${this.speedMultiplier.toFixed(1)}x`;
      if (layersSlider) layersSlider.value = this.maxLayers;
      if (layersValue) layersValue.textContent = this.maxLayers.toString();
    },


    showOnscreenControls() {
      if (!this.onscreenControls || kioskMode) return;

      this.onscreenControls.classList.add('visible');

      // Clear any existing timer
      if (this.mouseTimer) {
        clearTimeout(this.mouseTimer);
        this.mouseTimer = null;
      }
    },

    scheduleHideControls() {
      if (!this.onscreenControls || kioskMode) return;

      // Clear existing timer
      if (this.mouseTimer) {
        clearTimeout(this.mouseTimer);
      }

      // Hide after 3 seconds of no mouse movement
      this.mouseTimer = setTimeout(() => {
        this.onscreenControls.classList.remove('visible');
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
      config.maxConcurrentLayers = this.maxLayers;
      console.log(`UI: Config updated - maxConcurrentLayers: ${config.maxConcurrentLayers}`);

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
      }
    },

    togglePlayPause() {
      if (AnimationEngine.isPlaying) {
        AnimationEngine.stop();
        PatternManager.stopPatternSequence();
        this.updatePlayPauseButton('▶️');
      } else {
        AnimationEngine.start();
        PatternManager.startPatternSequence();
        this.updatePlayPauseButton('⏸️');
      }
    },

    updatePlayPauseButton(icon) {
      const btn = document.getElementById('play-pause-btn');
      if (btn) {
        btn.textContent = icon;
      }
    },

    toggleBackground() {
      this.isWhiteBackground = !this.isWhiteBackground;

      if (this.isWhiteBackground) {
        document.body.classList.add('white-background');
        localStorage.setItem('manypaintings-background', 'white');
      } else {
        document.body.classList.remove('white-background');
        localStorage.setItem('manypaintings-background', 'black');
      }

      console.log(`UI: Background switched to ${this.isWhiteBackground ? 'white' : 'black'}`);
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

        // Set configuration
        config = { ...window.APP_CONFIG, ...options };
        kioskMode = options.kioskMode || false;

        // Initialize modules in sequence
        UI.init();

        await ImageManager.init();
        AnimationEngine.init();
        await PatternManager.init();

        AnimationEngine.start();
        isInitialized = true;

        console.log('App initialization complete');
        console.log(`ImageManager loaded ${ImageManager.images.size} images`);

      } catch (error) {
        console.error('App initialization failed:', error);
        UI.showError('Application failed to start');
        throw error;
      }
    },

    // Public API
    ImageManager,
    AnimationEngine,
    PatternManager,
    UI
  };
})();