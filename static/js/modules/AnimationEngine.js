// AnimationEngine.js - Core animation logic and layer management
class AnimationEngine {
    constructor() {
        this.layersContainer = null;
        this.activeLayers = new Map();
        this.layerQueue = [];
        this.animationSpeed = 1.0;
        this.maxConcurrentLayers = 4;
        this.isRunning = false;
        this.animationId = null;
        this.frameInterval = 1000 / 30;
        this.lastFrameTime = 0;
        this.transformationCache = new Map();
        this.ruleOfThirdsIndex = 0;
        this.config = {};
    }

    // Initialize animation engine
    init(config = {}) {
        this.config = config;
        this.layersContainer = document.getElementById('image-layers');
        this.maxConcurrentLayers = config.maxConcurrentLayers || 4;
        
        if (!this.layersContainer) {
            console.error('Could not find #image-layers container');
            return false;
        }

        console.log('AnimationEngine initialized');
        return true;
    }

    // Start animation loop
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('Animation started');
        this.animate();
    }

    // Stop animation loop
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        console.log('Animation stopped');
    }

    // Main animation loop
    animate(currentTime = 0) {
        if (!this.isRunning) return;

        if (currentTime - this.lastFrameTime >= this.frameInterval) {
            this.updateLayers();
            this.lastFrameTime = currentTime;
        }

        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }

    // Update all active layers
    updateLayers() {
        const currentTime = Date.now();
        const layersToRemove = [];

        for (const [layerId, layerInfo] of this.activeLayers.entries()) {
            const layer = layerInfo.element;
            if (!layer || !layer.parentNode) {
                layersToRemove.push(layerId);
                continue;
            }

            const elapsed = (currentTime - layerInfo.startTime) / 1000 * this.animationSpeed;

            switch (layerInfo.phase) {
                case 'fade-in':
                    if (elapsed >= layerInfo.fadeInDuration) {
                        this.transitionToHold(layerInfo);
                    } else {
                        const progress = elapsed / layerInfo.fadeInDuration;
                        const currentOpacity = progress * layerInfo.targetOpacity;
                        layer.style.opacity = Math.min(currentOpacity, layerInfo.targetOpacity);
                    }
                    break;

                case 'hold':
                    if (elapsed >= layerInfo.holdDuration) {
                        this.startFadeOut(layerInfo);
                    }
                    break;

                case 'fade-out':
                    if (elapsed >= layerInfo.fadeOutDuration) {
                        layersToRemove.push(layerId);
                    } else {
                        const progress = elapsed / layerInfo.fadeOutDuration;
                        const currentOpacity = layerInfo.targetOpacity * (1 - progress);
                        layer.style.opacity = Math.max(currentOpacity, 0);
                    }
                    break;
            }
        }

        // Remove completed layers
        layersToRemove.forEach(layerId => this.removeLayer(this.activeLayers.get(layerId)));
    }

    // Transition layer from fade-in to hold phase
    transitionToHold(layerInfo) {
        layerInfo.phase = 'hold';
        layerInfo.startTime = Date.now();
        layerInfo.element.style.opacity = layerInfo.targetOpacity;
        console.log(`Layer ${layerInfo.imageId} transitioned to hold phase`);
    }

    // Start fade-in animation for a layer
    startFadeIn(layerInfo) {
        layerInfo.phase = 'fade-in';
        layerInfo.startTime = Date.now();
        layerInfo.element.style.opacity = '0';
        console.log(`Started fade-in for ${layerInfo.imageId}`);
    }

    // Start fade-out animation for a layer
    startFadeOut(layerInfo) {
        layerInfo.phase = 'fade-out';
        layerInfo.startTime = Date.now();
        console.log(`Started fade-out for ${layerInfo.imageId}`);
    }

    // Remove layer from DOM and tracking
    removeLayer(layerInfo) {
        if (!layerInfo) return;

        const layerId = layerInfo.element.id;
        
        if (layerInfo.element && layerInfo.element.parentNode) {
            layerInfo.element.remove();
        }
        
        this.activeLayers.delete(layerId);
        console.log(`Removed layer: ${layerInfo.imageId}`);
    }

    // Update animation speed for all layers
    updateAnimationSpeed(newSpeed) {
        this.animationSpeed = Math.max(0.1, Math.min(20.0, newSpeed));
        console.log(`Animation speed updated to: ${this.animationSpeed}x`);
    }

    // Set maximum concurrent layers
    setMaxConcurrentLayers(count) {
        this.maxConcurrentLayers = Math.max(1, Math.min(8, count));
        
        // Remove excess layers if needed
        const activeLayerArray = Array.from(this.activeLayers.values());
        if (activeLayerArray.length > this.maxConcurrentLayers) {
            const excessLayers = activeLayerArray.slice(this.maxConcurrentLayers);
            excessLayers.forEach(layerInfo => this.removeLayer(layerInfo));
        }
        
        console.log(`Max concurrent layers set to: ${this.maxConcurrentLayers}`);
    }

    // Get current number of active layers
    getActiveLayerCount() {
        return this.activeLayers.size;
    }

    // Check if animation is running
    isAnimationRunning() {
        return this.isRunning;
    }
}

// Export for use in main application
window.AnimationEngine = AnimationEngine;