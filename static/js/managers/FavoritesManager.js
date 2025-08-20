/**
 * Favorites Manager - Handles saving and loading painting states
 * Extracted from main.js for better modularity
 */
export const FavoritesManager = {
  async captureCanvas(targetWidth, targetHeight, format = 'png', quality = 0.8) {
    try {
      // Check if html2canvas is available
      if (typeof html2canvas === 'undefined') {
        console.error('FavoritesManager: html2canvas library not loaded');
        return null;
      }

      // Get the image layers container
      const layersContainer = document.getElementById('image-layers');
      if (!layersContainer) {
        throw new Error('Image layers container not found');
      }

      console.log(`FavoritesManager: Capturing canvas at ${targetWidth}x${targetHeight} (${format})...`);

      // Use html2canvas to capture the layers container
      const canvas = await html2canvas(layersContainer, {
        width: layersContainer.offsetWidth,
        height: layersContainer.offsetHeight,
        backgroundColor: null, // Keep transparency to get the actual background
        scale: Math.max(targetWidth / layersContainer.offsetWidth, targetHeight / layersContainer.offsetHeight),
        logging: false,
        useCORS: true, // Allow cross-origin images
        allowTaint: true, // Allow images from same origin
        ignoreElements: (element) => {
          // Don't ignore any elements - capture everything including opacity
          return false;
        },
        onclone: (clonedDoc, element) => {
          // Ensure all computed styles are preserved in the clone, especially opacity
          const originalLayers = layersContainer.querySelectorAll('.image-layer');
          const clonedLayers = element.querySelectorAll('.image-layer');
          
          originalLayers.forEach((originalLayer, index) => {
            if (clonedLayers[index]) {
              const computedStyle = window.getComputedStyle(originalLayer);
              const clonedLayer = clonedLayers[index];
              
              // Force all styles to ensure they're preserved
              clonedLayer.style.opacity = computedStyle.opacity;
              clonedLayer.style.transform = computedStyle.transform;
              clonedLayer.style.filter = computedStyle.filter;
              clonedLayer.style.display = computedStyle.display;
              clonedLayer.style.visibility = computedStyle.visibility;
              clonedLayer.style.position = computedStyle.position;
              clonedLayer.style.left = computedStyle.left;
              clonedLayer.style.top = computedStyle.top;
              clonedLayer.style.width = computedStyle.width;
              clonedLayer.style.height = computedStyle.height;
              clonedLayer.style.zIndex = computedStyle.zIndex;
              
              // Force remove any transitions that might interfere
              clonedLayer.style.transition = 'none';
              clonedLayer.style.animation = 'none';
              
              // Ensure minimum opacity for very low values
              const opacity = parseFloat(computedStyle.opacity);
              if (opacity > 0 && opacity < 0.01) {
                clonedLayer.style.opacity = '0.01'; // Make very low opacity visible
              }
            }
          });
        }
      });

      // Create final canvas at target dimensions
      const finalCanvas = document.createElement('canvas');
      const ctx = finalCanvas.getContext('2d');
      finalCanvas.width = targetWidth;
      finalCanvas.height = targetHeight;

      // Fill background color first - check the actual background mode
      const isWhiteBackground = document.body.classList.contains('white-background');
      const bgColor = isWhiteBackground ? '#ffffff' : '#000000';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Calculate centering for the captured canvas
      const scale = Math.min(targetWidth / canvas.width, targetHeight / canvas.height);
      const scaledWidth = canvas.width * scale;
      const scaledHeight = canvas.height * scale;
      const x = (targetWidth - scaledWidth) / 2;
      const y = (targetHeight - scaledHeight) / 2;

      // Draw the captured canvas centered in the final canvas
      ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight);

      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      console.log(`FavoritesManager: Canvas captured successfully at ${targetWidth}x${targetHeight}`);
      return finalCanvas.toDataURL(mimeType, quality);
      
    } catch (error) {
      console.error(`FavoritesManager: Failed to capture canvas at ${targetWidth}x${targetHeight}:`, error);
      return null;
    }
  },

  async captureCanvasThumbnail() {
    return await this.captureCanvas(200, 200, 'png', 0.8);
  },

  async captureCanvasHero() {
    return await this.captureCanvas(800, 400, 'jpeg', 0.8);
  },

  async captureCanvasDownload() {
    return await this.captureCanvas(1920, 1080, 'jpeg', 0.9);
  },

  async downloadCurrentImage() {
    try {
      const imageData = await this.captureCanvasDownload();
      if (!imageData) {
        throw new Error('Failed to capture image for download');
      }

      // Create download link
      const link = document.createElement('a');
      link.download = `ManyPaintings_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`;
      link.href = imageData;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('FavoritesManager: Image download triggered');
      
      // Show success feedback
      const UI = window.App?.UI;
      if (UI) {
        UI.showSuccess('Image downloaded');
      }
      
      return true;
    } catch (error) {
      console.error('FavoritesManager: Failed to download image:', error);
      const UI = window.App?.UI;
      if (UI) {
        UI.showError('Failed to download image: ' + error.message);
      }
      throw error;
    }
  },

  async captureCurrentState() {
    // Capture only visible layers from AnimationEngine
    const layers = [];

    // Access AnimationEngine through global App object
    const AnimationEngine = window.App?.AnimationEngine;
    if (!AnimationEngine) {
      throw new Error('AnimationEngine not available');
    }

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
          hueShift: layerInfo.transformations.hueShift,
          useViewportUnits: layerInfo.transformations.useViewportUnits
        },
        animationPhase: layerInfo.phase
      };

      console.log(`FavoritesManager: Capturing layer ${imageId} - stored opacity: ${layerInfo.opacity}, computed opacity: ${computedOpacity}, using: ${layerData.opacity}`);
      layers.push(layerData);
    });

    if (layers.length === 0) {
      throw new Error('No active layers to save');
    }

    // Access UI through global App object
    const UI = window.App?.UI;
    const state = {
      layers: layers,
      backgroundColor: UI?.isWhiteBackground ? 'white' : 'black'
    };

    console.log('FavoritesManager: Captured state:', state);
    return state;
  },

  async saveFavorite() {
    try {
      const state = await this.captureCurrentState();
      const thumbnail = await this.captureCanvasThumbnail();
      const heroImage = await this.captureCanvasHero();

      const favoriteData = {
        state: state,
        thumbnail: thumbnail,
        heroImage: heroImage
      };

      console.log('FavoritesManager: Saving favorite with dual resolutions:', {
        stateSize: JSON.stringify(state).length,
        thumbnailSize: thumbnail ? thumbnail.length : 0,
        heroImageSize: heroImage ? heroImage.length : 0,
        hasThumbnail: !!thumbnail,
        hasHeroImage: !!heroImage
      });

      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(favoriteData)
      });

      if (!response.ok) {
        throw new Error(`Failed to save favorite: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('FavoritesManager: Favorite saved with ID:', result.id);

      // Show success feedback
      const UI = window.App?.UI;
      if (UI) {
        UI.showSuccess('Favorite saved');
      }

      return result.id;
    } catch (error) {
      console.error('FavoritesManager: Failed to save favorite:', error);
      const UI = window.App?.UI;
      if (UI) {
        UI.showError('Failed to save favorite: ' + error.message);
      }
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

      const favoriteData = await response.json();
      console.log('FavoritesManager: Loading favorite data:', favoriteData);

      // Extract the state from the full favorite object
      const state = favoriteData.state || favoriteData;
      await this.restoreState(state);
      console.log('FavoritesManager: Favorite restored successfully');

    } catch (error) {
      console.error('FavoritesManager: Failed to load favorite:', error);
      const UI = window.App?.UI;
      if (UI) {
        UI.showError('Failed to load favorite: ' + error.message);
      }
      throw error;
    }
  },

  async restoreState(state) {
    // Access managers through global App object
    const PatternManager = window.App?.PatternManager;
    const AnimationEngine = window.App?.AnimationEngine;
    const UI = window.App?.UI;

    if (!PatternManager || !AnimationEngine) {
      throw new Error('Required managers not available');
    }

    // Stop any ongoing pattern sequence first
    PatternManager.stopPatternSequence();

    // Clear all current layers immediately (no fade transitions)
    AnimationEngine.clearAllLayersImmediate();

    // Restore background color if saved
    if (state.backgroundColor && UI) {
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
    const speedMultiplier = UI?.speedMultiplier || 1.0;
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