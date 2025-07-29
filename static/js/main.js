/**
 * Many Paintings - Generative Art Application
 * Main JavaScript application with modular architecture
 */

window.App = (function() {
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
            // Check if we've reached the concurrent layer limit
            if (this.activeLayers.size >= (config.maxConcurrentLayers || 5)) {
                console.log(`AnimationEngine: Max concurrent layers (${config.maxConcurrentLayers || 5}) reached, skipping ${imageId}`);
                return null;
            }

            try {
                const img = await ImageManager.loadImage(imageId);
                
                // Generate random timing and transformation parameters
                const fadeInDuration = this.randomBetween(config.fadeInMinSec || 2, config.fadeInMaxSec || 5) * 1000;
                const fadeOutDuration = this.randomBetween(config.fadeOutMinSec || 3, config.fadeOutMaxSec || 6) * 1000;
                const holdTime = this.randomBetween(config.minHoldTimeSec || 4, config.maxHoldTimeSec || 12) * 1000;
                const opacity = Math.min(config.maxOpacity || 0.8, Math.random() * 0.3 + 0.4);
                
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
                    phase: 'fade-in'
                };
                
                this.activeLayers.set(imageId, layerInfo);

                // Start fade in animation
                this.startFadeIn(layerInfo);

                console.log(`AnimationEngine: Started layer ${imageId} - fadeIn: ${fadeInDuration}ms, hold: ${holdTime}ms, fadeOut: ${fadeOutDuration}ms`);
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
                setTimeout(() => {
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
            const { layer } = layerInfo;
            
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
            return function() {
                state = (state * 1664525 + 1013904223) % 4294967296;
                return state / 4294967296;
            };
        },

        randomBetween(min, max) {
            return Math.random() * (max - min) + min;
        },

        createLayer(imageId, img, transformations) {
            const layer = document.createElement('div');
            layer.className = 'image-layer';
            layer.id = `layer-${imageId}-${Date.now()}`;
            
            const imgElement = img.cloneNode();
            imgElement.draggable = false;
            
            // Apply transformations
            if (transformations) {
                const transforms = [];
                
                if (config.translationEnabled && (transformations.translateX || transformations.translateY)) {
                    transforms.push(`translate(${transformations.translateX}vw, ${transformations.translateY}vh)`);
                }
                
                if (config.rotationEnabled && transformations.rotation) {
                    transforms.push(`rotate(${transformations.rotation}deg)`);
                }
                
                if (config.scaleEnabled && transformations.scale !== 1) {
                    transforms.push(`scale(${transformations.scale})`);
                }
                
                if (transforms.length > 0) {
                    imgElement.style.transform = transforms.join(' ');
                    imgElement.style.transformOrigin = 'center center';
                }
            }
            
            layer.appendChild(imgElement);
            return layer;
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

        async init() {
            await this.generateNewPattern();
            this.startPatternSequence();
        },

        async generateNewPattern(seed = null) {
            try {
                if (!seed) {
                    seed = this.generateSeed();
                }

                // For now, generate a simple random sequence
                // TODO: Implement server-side pattern generation
                this.currentSeed = seed;
                this.imageSequence = ImageManager.getRandomImageIds(20);
                this.sequenceIndex = 0;

                console.log(`PatternManager: Generated pattern with seed ${seed}`);
                this.updatePatternDisplay();
                
                // Preload upcoming images
                const upcomingImages = this.imageSequence.slice(0, config.preloadBufferSize);
                await ImageManager.preloadImages(upcomingImages, true);

            } catch (error) {
                console.error('PatternManager: Failed to generate pattern:', error);
                throw error;
            }
        },

        generateSeed() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        },

        startPatternSequence() {
            this.stopPatternSequence();
            
            // Show first image immediately
            this.showNextImage();
            
            // Schedule next images based on configuration
            this.patternInterval = setInterval(() => {
                this.showNextImage();
            }, (config.layerSpawnIntervalSec || 4) * 1000);
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

            const imageId = this.imageSequence[this.sequenceIndex];
            this.sequenceIndex = (this.sequenceIndex + 1) % this.imageSequence.length;

            try {
                // Pass the current seed for deterministic transformations
                const options = {
                    seed: this.currentSeed + '-' + this.sequenceIndex
                };
                
                await AnimationEngine.showImage(imageId, options);
                
                // Preload upcoming images
                const upcomingCount = Math.min(config.preloadBufferSize, this.imageSequence.length);
                const upcomingImages = [];
                
                for (let i = 0; i < upcomingCount; i++) {
                    const nextIndex = (this.sequenceIndex + i) % this.imageSequence.length;
                    upcomingImages.push(this.imageSequence[nextIndex]);
                }
                
                ImageManager.preloadImages(upcomingImages);
                
                // Cleanup memory if needed
                ImageManager.cleanupMemory();
                
            } catch (error) {
                console.error('PatternManager: Failed to show next image:', error);
            }
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

        init() {
            this.errorElement = document.getElementById('error-message');
            this.loadingElement = document.getElementById('loading-indicator');
            
            this.setupEventListeners();
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

            // Retry button
            const retryBtn = document.getElementById('retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', this.retry.bind(this));
            }

            // Keyboard shortcuts (non-kiosk mode)
            if (!kioskMode) {
                document.addEventListener('keydown', this.handleKeydown.bind(this));
            }
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

        async generateNewPattern() {
            try {
                this.showLoading();
                AnimationEngine.clearAllLayers();
                await PatternManager.generateNewPattern();
                this.hideLoading();
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
                UI.showLoading();

                await ImageManager.init();
                AnimationEngine.init();
                await PatternManager.init();

                AnimationEngine.start();

                UI.hideLoading();
                isInitialized = true;

                console.log('App initialization complete');

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