/**
 * Image Manager - Handles loading, caching, and memory management
 */
export const ImageManager = {
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
      // UI will be available through the global window.App.UI
      if (window.App && window.App.UI) {
        window.App.UI.showError('Failed to load image catalog');
      }
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
    const config = window.App?.config || {};
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