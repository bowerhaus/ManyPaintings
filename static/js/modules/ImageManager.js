// ImageManager.js - Image loading, caching, and memory management
class ImageManager {
    constructor() {
        this.images = new Map();
        this.imageCache = new Map();
        this.loadingQueue = new Set();
        this.config = {};
    }

    // Initialize with configuration
    init(config) {
        this.config = config;
        console.log('ImageManager initialized');
    }

    // Preload image if not already cached
    preloadImage(imagePath) {
        if (this.imageCache.has(imagePath) || this.loadingQueue.has(imagePath)) {
            return Promise.resolve(this.imageCache.get(imagePath));
        }

        this.loadingQueue.add(imagePath);
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.imageCache.set(imagePath, img);
                this.loadingQueue.delete(imagePath);
                console.log(`Image cached: ${imagePath}`);
                resolve(img);
            };
            img.onerror = (error) => {
                this.loadingQueue.delete(imagePath);
                console.error(`Failed to load image: ${imagePath}`, error);
                reject(error);
            };
            img.src = imagePath;
        });
    }

    // Load image with caching
    async loadImage(imagePath) {
        if (this.imageCache.has(imagePath)) {
            return this.imageCache.get(imagePath);
        }
        return await this.preloadImage(imagePath);
    }

    // Preload multiple images
    async preloadImages(imagePaths) {
        const promises = imagePaths.map(path => this.preloadImage(path));
        return await Promise.allSettled(promises);
    }

    // Clean up unused images from cache
    cleanupMemory() {
        const activeLayers = document.querySelectorAll('.image-layer');
        const activeImages = new Set();
        
        activeLayers.forEach(layer => {
            const img = layer.querySelector('img');
            if (img && img.src) {
                activeImages.add(img.src);
            }
        });

        for (const [path, img] of this.imageCache.entries()) {
            if (!activeImages.has(img.src)) {
                this.imageCache.delete(path);
                console.log(`Cleaned up unused image: ${path}`);
            }
        }
    }

    // Get random image IDs
    getRandomImageIds(count) {
        if (!window.availableImages || window.availableImages.length === 0) {
            console.warn('No images available');
            return [];
        }
        
        const shuffled = this.fisherYatesShuffle([...window.availableImages]);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    // Fisher-Yates shuffle algorithm
    fisherYatesShuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Get cached image
    getCachedImage(imagePath) {
        return this.imageCache.get(imagePath);
    }

    // Check if image is cached
    isCached(imagePath) {
        return this.imageCache.has(imagePath);
    }

    // Get cache size
    getCacheSize() {
        return this.imageCache.size;
    }
}

// Export for use in main application
window.ImageManager = ImageManager;