/**
 * Favorites Manager - Handles saving and loading painting states
 * Extracted from main.js for better modularity
 */
export const FavoritesManager = {
  async captureCanvasThumbnail() {
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

      console.log('FavoritesManager: Capturing thumbnail with html2canvas...');

      // Use html2canvas to capture the layers container
      const canvas = await html2canvas(layersContainer, {
        width: layersContainer.offsetWidth,
        height: layersContainer.offsetHeight,
        backgroundColor: null, // Keep transparency to get the actual background
        scale: 200 / Math.max(layersContainer.offsetWidth, layersContainer.offsetHeight), // Scale to fit 200px
        logging: false,
        useCORS: true, // Allow cross-origin images
        allowTaint: true // Allow images from same origin
      });

      // Create final thumbnail canvas at 200x200
      const thumbnailCanvas = document.createElement('canvas');
      const ctx = thumbnailCanvas.getContext('2d');
      thumbnailCanvas.width = 200;
      thumbnailCanvas.height = 200;

      // Fill background color first
      const bgColor = window.getComputedStyle(layersContainer).backgroundColor || '#000000';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 200, 200);

      // Calculate centering for the captured canvas
      const scale = Math.min(200 / canvas.width, 200 / canvas.height);
      const scaledWidth = canvas.width * scale;
      const scaledHeight = canvas.height * scale;
      const x = (200 - scaledWidth) / 2;
      const y = (200 - scaledHeight) / 2;

      // Draw the captured canvas centered in the thumbnail
      ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight);

      console.log('FavoritesManager: Thumbnail captured successfully');
      return thumbnailCanvas.toDataURL('image/png', 0.8);
      
    } catch (error) {
      console.error('FavoritesManager: Failed to capture canvas thumbnail:', error);
      return null;
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

      const favoriteData = {
        state: state,
        thumbnail: thumbnail
      };

      console.log('FavoritesManager: Saving favorite with thumbnail:', {
        stateSize: JSON.stringify(state).length,
        thumbnailSize: thumbnail ? thumbnail.length : 0,
        hasThumbnail: !!thumbnail
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
        UI.showSuccess('Favorite saved!');
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

      const state = await response.json();
      console.log('FavoritesManager: Loading favorite state:', state);

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