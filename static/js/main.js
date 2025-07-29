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

        init() {
            this.layersContainer = document.getElementById('image-layers');
            this.frameRate = config.animationFPS || 30;
            this.frameInterval = 1000 / this.frameRate;
            
            if (!this.layersContainer) {
                throw new Error('Image layers container not found');
            }

            console.log(`AnimationEngine: Initialized with ${this.frameRate} FPS target`);
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

        async showImage(imageId, duration = 5000, opacity = 0.7) {
            try {
                const img = await ImageManager.loadImage(imageId);
                const layer = this.createLayer(imageId, img);
                
                this.layersContainer.appendChild(layer);
                this.activeLayers.set(imageId, { layer, startTime: Date.now(), duration, opacity });

                // Trigger fade in
                requestAnimationFrame(() => {
                    layer.style.opacity = opacity;
                    layer.classList.add('active');
                });

                // Schedule fade out
                setTimeout(() => {
                    this.hideImage(imageId);
                }, duration);

                return layer;
            } catch (error) {
                console.error(`AnimationEngine: Failed to show image ${imageId}:`, error);
                throw error;
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

        createLayer(imageId, img) {
            const layer = document.createElement('div');
            layer.className = 'image-layer';
            layer.id = `layer-${imageId}`;
            
            const imgElement = img.cloneNode();
            imgElement.draggable = false;
            
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
            
            // Schedule next images
            this.patternInterval = setInterval(() => {
                this.showNextImage();
            }, 3000); // Show new image every 3 seconds
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
                await AnimationEngine.showImage(imageId, 8000, 0.6 + Math.random() * 0.3);
                
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