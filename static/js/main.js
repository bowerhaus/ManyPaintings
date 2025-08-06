/**
 * Many Paintings - Generative Art Application
 * Modular main entry point - imports all modules and coordinates initialization
 */

// Import all modules
import { ImageManager } from './managers/ImageManager.js';
import { PatternManager } from './managers/PatternManager.js';
import { AudioManager } from './managers/AudioManager.js';
import { FavoritesManager } from './managers/FavoritesManager.js';
import { MatteBorderManager } from './managers/MatteBorderManager.js';
import { UI } from './ui/UI.js';
import { FavoritesGallery } from './ui/FavoritesGallery.js';
import { ImageManagerUI } from './modules/imageManagerUI.js';
import { AnimationEngine } from './modules/AnimationEngine.js';
import { GridManager } from './utils/GridManager.js';

// Application state
let config = {};
let isInitialized = false;
let kioskMode = false;

/**
 * Main Application Interface
 */
const App = {
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
      window.kioskMode = kioskMode; // Make available globally
      
      console.log('Configuration loaded:', config);

      // Initialize modules in sequence
      UI.init();
      FavoritesGallery.init();
      ImageManagerUI.init();

      await ImageManager.init();
      AnimationEngine.init();
      AudioManager.init();

      // Initialize matte border after other modules are ready
      MatteBorderManager.init();
      
      // Initialize grid manager after matte border is set up
      GridManager.init();

      await PatternManager.init();

      AnimationEngine.start();
      isInitialized = true;

      // Set up window resize event listener
      this.setupResizeHandler();

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

  setupResizeHandler() {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
      // Debounce resize events to avoid excessive calculations
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        console.log('App: Handling window resize');
        
        // Update matte border positioning (which also triggers grid updates)
        if (MatteBorderManager && MatteBorderManager.handleResize) {
          MatteBorderManager.handleResize();
        }
      }, 150); // 150ms debounce
    });
    
    console.log('App: Window resize handler set up');
  },

  // Public API - expose all modules
  ImageManager,
  AnimationEngine,
  PatternManager,
  AudioManager,
  MatteBorderManager,
  FavoritesManager,
  FavoritesGallery,
  ImageManagerUI,
  UI,
  GridManager
};

// Expose App to global scope for template scripts
window.App = App;

// Ensure App is available immediately
console.log('App object exposed to window:', !!window.App);
console.log('App.UI available:', !!(window.App && window.App.UI));

// Export for module usage
export { App };