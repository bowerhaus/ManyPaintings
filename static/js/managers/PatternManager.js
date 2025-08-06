/**
 * Pattern Manager - Handles deterministic pattern generation and image sequencing
 * Extracted from main.js for better modularity
 */
export const PatternManager = {
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
      
      // Use config pattern if set, otherwise will generate random
      this.initialPatternCode = configData.initial_pattern_code;

      console.log(`PatternManager: Config loaded - initial_pattern_code: ${this.initialPatternCode}`);

      if (this.initialPatternCode) {
        console.log(`PatternManager: Using fixed pattern code from config: ${this.initialPatternCode}`);
      } else {
        console.log('PatternManager: No initial pattern code configured, will generate random seed on each refresh');
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
      
      // Get ImageManager from global App object
      const ImageManager = window.App?.ImageManager;
      if (!ImageManager) {
        throw new Error('ImageManager not available');
      }
      
      this.imageSequence = this.generateDeterministicSequence(seed, 100); // Longer sequence
      this.sequenceIndex = 0;

      console.log(`PatternManager: Generated pattern with seed ${seed}`);
      console.log(`PatternManager: Sequence length: ${this.imageSequence.length}`);
      console.log(`PatternManager: First 10 images in sequence:`, this.imageSequence.slice(0, 10));

      this.updatePatternDisplay();

      // Preload upcoming images
      const config = window.APP_CONFIG || {};
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

    // Import ImageManager - will be available since generateNewPattern imports it
    const ImageManager = window.App?.ImageManager;
    if (!ImageManager) {
      console.error('PatternManager: ImageManager not available');
      return [];
    }

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
    const uniqueImagesInSequence = new Set(sequence).size;
    console.log(`PatternManager: Generated weighted sequence - total images available: ${allImageIds.length}, unique in sequence: ${uniqueImagesInSequence}`);
    console.log(`PatternManager: Usage distribution - min appearances: ${minCount}, max appearances: ${maxCount}, range: ${maxCount - minCount}`);
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
    const config = window.APP_CONFIG || {};
    const baseInterval = (config.animation_timing?.layer_spawn_interval_sec || 4) * 1000;
    
    // Import UI dynamically to get speed multiplier
    const speedMultiplier = window.App?.UI?.speedMultiplier || 1.0;
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

        // Access AnimationEngine through global App object
        const AnimationEngine = window.App?.AnimationEngine;
        if (!AnimationEngine) {
          console.error('PatternManager: AnimationEngine not available');
          return;
        }

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
    const config = window.APP_CONFIG || {};
    const upcomingCount = Math.min(config.application?.preload_buffer_size || 5, this.imageSequence.length);
    const upcomingImages = [];

    for (let i = 0; i < upcomingCount; i++) {
      const nextIndex = (this.sequenceIndex + i) % this.imageSequence.length;
      upcomingImages.push(this.imageSequence[nextIndex]);
    }

    // Access ImageManager through global App object
    const ImageManager = window.App?.ImageManager;
    if (ImageManager) {
      ImageManager.preloadImages(upcomingImages);
      // Cleanup memory if needed
      ImageManager.cleanupMemory();
    }
  },

  updatePatternDisplay() {
    const codeElement = document.getElementById('current-pattern');
    if (codeElement) {
      codeElement.textContent = this.currentSeed || 'Loading...';
    }
  }
};