/**
 * UI Manager - Handles main user interface, controls, and user interactions
 * Extracted from main.js for better modularity
 */
import { userPreferences } from '../managers/UserPreferences.js';

export const UI = {
  errorElement: null,
  loadingElement: null,
  isWhiteBackground: false,
  onscreenControls: null,
  mouseTimer: null,
  speedMultiplier: 1.0,
  maxLayers: 4,

  async init() {
    this.errorElement = document.getElementById('error-message');
    this.loadingElement = document.getElementById('loading-indicator');
    this.onscreenControls = document.getElementById('onscreen-controls');
    this.controlsTriggerArea = document.getElementById('controls-trigger-area');

    console.log('UI: Elements found:', {
      onscreenControls: !!this.onscreenControls,
      controlsTriggerArea: !!this.controlsTriggerArea
    });

    // Initialize UI values from config and user preferences
    const config = window.APP_CONFIG || {};
    
    // Load user preferences from server
    console.log('UI: Loading preferences from server...');
    await userPreferences.init();
    
    this.speedMultiplier = await userPreferences.get('speed');
    this.maxLayers = await userPreferences.get('maxLayers');
    this.isWhiteBackground = await userPreferences.get('isWhiteBackground');
    
    console.log(`UI: Loaded preferences from server - speed: ${this.speedMultiplier}, maxLayers: ${this.maxLayers}, isWhiteBackground: ${this.isWhiteBackground}`);
    
    // Override with config if maxLayers not set in preferences
    if (this.maxLayers === userPreferences.defaults.maxLayers) {
      this.maxLayers = config.layer_management?.max_concurrent_layers || 4;
    }
    
    console.log(`UI: Initialized with preferences - speed: ${this.speedMultiplier}, maxLayers: ${this.maxLayers}, background: ${this.isWhiteBackground ? 'white' : 'black'}`);
    
    // Apply loaded preferences to UI elements
    this.applyUserPreferences();

    this.setupEventListeners();
    this.setupOnscreenControls();

    // Check kiosk mode from global variable
    const kioskMode = window.kioskMode || false;

    // Ensure onscreen controls start hidden
    if (this.onscreenControls && !kioskMode) {
      this.onscreenControls.classList.remove('visible');
      console.log('UI: Onscreen controls initialized as hidden');
    }

    this.showMainControls();
    this.hideLoading();
  },

  applyUserPreferences() {
    // Apply background preference
    console.log(`UI: Applying background preference - isWhiteBackground: ${this.isWhiteBackground}`);
    
    // Set filterable background element
    const filterableBackground = document.getElementById('filterable-background');
    if (filterableBackground) {
      if (this.isWhiteBackground) {
        filterableBackground.style.background = '#fff';
        document.body.classList.add('white-background');
      } else {
        filterableBackground.style.background = '#000';
        document.body.classList.remove('white-background');
      }
    }
    
    // Keep body background for UI elements
    if (this.isWhiteBackground) {
      document.body.style.setProperty('background-color', 'white', 'important');
      console.log('UI: Applied white background with !important');
    } else {
      document.body.style.setProperty('background-color', 'black', 'important');
      console.log('UI: Applied black background with !important');
    }
    
    // Verify the changes were applied after a small delay
    setTimeout(() => {
      const actualBgColor = getComputedStyle(document.body).backgroundColor;
      const hasWhiteClass = document.body.classList.contains('white-background');
      console.log(`UI: Background verification (delayed) - computed color: ${actualBgColor}, has white-background class: ${hasWhiteClass}`);
    }, 10);
    
    this.updateBackgroundToggle();
    
    // Apply UI slider values when DOM is ready
    setTimeout(async () => {
      // Set speed slider
      const speedSlider = document.getElementById('speed-slider');
      if (speedSlider) {
        speedSlider.value = this.speedMultiplier.toString();
        const speedValue = document.getElementById('speed-value');
        if (speedValue) {
          speedValue.textContent = `${this.speedMultiplier}`;
        }
      }
      
      // Set layers slider
      const layersSlider = document.getElementById('layers-slider');
      if (layersSlider) {
        layersSlider.value = this.maxLayers.toString();
        const layersValue = document.getElementById('layers-value');
        if (layersValue) {
          layersValue.textContent = this.maxLayers.toString();
        }
      }
      
      // Set volume slider
      const volumeSlider = document.getElementById('audio-volume-slider');
      if (volumeSlider) {
        const volumePercent = await userPreferences.get('volume') || 50;
        volumeSlider.value = volumePercent.toString();
        const volumeValue = document.getElementById('audio-volume-value');
        if (volumeValue) {
          volumeValue.textContent = `${volumePercent}%`;
        }
        console.log(`UI: Set volume slider to ${volumePercent}%`);
      }

      
      console.log(`UI: Applied user preferences - speed: ${this.speedMultiplier}, layers: ${this.maxLayers}, background: ${this.isWhiteBackground}`);
      console.log('UI: Speed slider found:', !!speedSlider, 'Layers slider found:', !!layersSlider, 'Volume slider found:', !!volumeSlider);
    }, 100);
  },

  // Note: This is a partial extraction - the full UI component is very large (~665 lines)
  // For now, I'm extracting the essential methods. The full extraction would include all methods.
  // This is a working foundation that can be extended.

  showError(message) {
    if (this.errorElement) {
      this.errorElement.textContent = message;
      this.errorElement.style.display = 'block';
      setTimeout(() => {
        this.errorElement.style.display = 'none';
      }, 5000);
    }
    console.error('UI Error:', message);
  },

  showSuccess(message) {
    // Create a temporary success toast
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 32px;
      left: 50%;
      transform: translateX(-50%) translateY(-100px);
      background: rgba(76, 175, 80, 0.95);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 999999;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-width: 400px;
      word-wrap: break-word;
      text-align: center;
      opacity: 0;
      pointer-events: none;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    console.log('UI Success:', message);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
      toast.style.opacity = '1';
    });
    
    // Remove after delay
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(-100px)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2000);
  },

  showLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'block';
    }
  },

  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'none';
    }
  },

  setupEventListeners() {
    const kioskMode = window.kioskMode || false;

    // Play/Pause button (in onscreen controls)
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', this.togglePlayPause.bind(this));
    }

    // New pattern button (in onscreen controls)
    const newPatternBtn = document.getElementById('new-pattern-btn');
    if (newPatternBtn) {
      newPatternBtn.addEventListener('click', this.generateNewPattern.bind(this));
    }

    // Background toggle button (in onscreen controls)
    const backgroundToggleBtn = document.getElementById('background-toggle-btn');
    if (backgroundToggleBtn) {
      backgroundToggleBtn.addEventListener('click', this.toggleBackground.bind(this));
    }

    // Audio toggle button (in onscreen controls)
    const audioToggleBtn = document.getElementById('audio-toggle-btn');
    if (audioToggleBtn) {
      audioToggleBtn.addEventListener('click', this.toggleAudio.bind(this));
    }

    // Favorite button (in onscreen controls)
    const favoriteBtn = document.getElementById('favorite-btn');
    if (favoriteBtn) {
      console.log('UI: Favorite button found, adding click listener');
      favoriteBtn.addEventListener('click', (e) => {
        console.log('UI: Favorite button clicked!');
        e.preventDefault();
        this.saveFavorite();
      });
    } else {
      console.warn('UI: Favorite button not found');
    }

    // Favorites gallery button (in onscreen controls)
    const favoritesGalleryBtn = document.getElementById('favorites-gallery-btn');
    if (favoritesGalleryBtn) {
      favoritesGalleryBtn.addEventListener('click', this.showFavoritesGallery.bind(this));
    }

    // Image manager button (in onscreen controls)
    const imageManagerBtn = document.getElementById('image-manager-btn');
    if (imageManagerBtn) {
      imageManagerBtn.addEventListener('click', this.showImageManager.bind(this));
    }

    // Gallery manager button (in onscreen controls)
    const galleryManagerBtn = document.getElementById('gallery-manager-btn');
    if (galleryManagerBtn) {
      galleryManagerBtn.addEventListener('click', this.showGalleryManager.bind(this));
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
      console.log('UI: Setting up mouse events for control trigger area');
      this.controlsTriggerArea.addEventListener('mouseenter', this.showOnscreenControls.bind(this));
      this.controlsTriggerArea.addEventListener('mouseleave', this.scheduleHideControls.bind(this));

      // Also add pointer events to ensure trigger works
      this.controlsTriggerArea.style.pointerEvents = 'auto';

      // Add debugging
      this.controlsTriggerArea.addEventListener('mouseenter', () => {
        console.log('UI: Mouse entered trigger area');
      });
      this.controlsTriggerArea.addEventListener('mouseleave', () => {
        console.log('UI: Mouse left trigger area');
      });
    } else {
      console.log('UI: Not setting up mouse events. kioskMode:', kioskMode, 'controlsTriggerArea:', !!this.controlsTriggerArea);
    }

    // Setup slider controls
    this.setupSliderControls();
  },

  setupSliderControls() {
    const kioskMode = window.kioskMode || false;
    if (kioskMode) return;

    // Speed slider (1-10 maps to speed multipliers)
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    if (speedSlider && speedValue) {
      speedSlider.addEventListener('input', async (e) => {
        const sliderValue = parseInt(e.target.value);
        // Map 1-10 to speed multipliers: 1=1x, 2=2x, 3=3x, 4=4x, 5=5x, 6=6x, 7=7x, 8=8x, 9=9x, 10=10x
        const speedMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        this.speedMultiplier = speedMap[sliderValue];
        speedValue.textContent = `${sliderValue}`;
        console.log(`UI: Speed changed to level ${sliderValue} (${this.speedMultiplier}x)`);
        
        // Save to user preferences
        await userPreferences.set('speed', this.speedMultiplier);
        
        this.updateAnimationSpeed();
      });
    }

    // Layers slider
    const layersSlider = document.getElementById('layers-slider');
    const layersValue = document.getElementById('layers-value');
    if (layersSlider && layersValue) {
      layersSlider.addEventListener('input', async (e) => {
        this.maxLayers = parseInt(e.target.value);
        layersValue.textContent = this.maxLayers.toString();
        console.log(`UI: Max layers changed to ${this.maxLayers}`);
        
        // Save to user preferences
        await userPreferences.set('maxLayers', this.maxLayers);
        
        this.updateMaxLayers();
      });
    }

    // Audio volume slider (0-100 in steps of 10)
    const audioVolumeSlider = document.getElementById('audio-volume-slider');
    const audioVolumeValue = document.getElementById('audio-volume-value');
    if (audioVolumeSlider && audioVolumeValue) {
      audioVolumeSlider.addEventListener('input', async (e) => {
        const volumePercent = parseInt(e.target.value);
        const volume = volumePercent / 100; // Convert to 0-1 range for audio API
        audioVolumeValue.textContent = `${volumePercent}%`;
        console.log(`UI: Audio volume changed to ${volumePercent}% (${volume})`);
        const AudioManager = window.App?.AudioManager;
        if (AudioManager) {
          await AudioManager.setVolume(volume);
        }
      });
    }

    // Click outside to close onscreen controls (non-kiosk mode)
    if (!kioskMode) {
      document.addEventListener('click', this.handleClickOutside.bind(this));
    }
  },

  setupOnscreenControls() {
    // Setup onscreen controls visibility and behavior
    const kioskMode = window.kioskMode || false;
    
    if (kioskMode && this.onscreenControls) {
      this.onscreenControls.classList.add('visible');
      console.log('UI: Onscreen controls set to always visible in kiosk mode');
    }
    
    // Initialize play/pause button state
    this.updatePlayPauseButton();
  },

  showMainControls() {
    // Show main UI controls
    console.log('UI: Main controls shown');
  },

  async togglePlayPause() {
    const AnimationEngine = window.App?.AnimationEngine;
    const PatternManager = window.App?.PatternManager;
    if (!AnimationEngine) return;
    
    if (AnimationEngine.isPlaying) {
      console.log('UI: Pausing animations and pattern sequence');
      AnimationEngine.stop();
      if (PatternManager) {
        PatternManager.stopPatternSequence();
      }
      this.updatePlayPauseButton(false);
      
      // Save playing state
      await userPreferences.set('isPlaying', false);
    } else {
      console.log('UI: Resuming animations and pattern sequence');
      AnimationEngine.start();
      if (PatternManager) {
        PatternManager.startPatternSequence();
      }
      this.updatePlayPauseButton(true);
      
      // Save playing state
      await userPreferences.set('isPlaying', true);
    }
  },

  updatePlayPauseButton(isPlaying = null) {
    const playPauseBtn = document.getElementById('play-pause-btn');
    const AnimationEngine = window.App?.AnimationEngine;
    
    if (playPauseBtn && AnimationEngine) {
      const playing = isPlaying !== null ? isPlaying : AnimationEngine.isPlaying;
      const icon = playPauseBtn.querySelector('svg path');
      if (icon) {
        if (playing) {
          // Pause icon
          icon.setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
          playPauseBtn.title = 'Pause (Spacebar)';
        } else {
          // Play icon  
          icon.setAttribute('d', 'M8 5v14l11-7z');
          playPauseBtn.title = 'Play (Spacebar)';
        }
      }
    }
  },

  async generateNewPattern() {
    const PatternManager = window.App?.PatternManager;
    const AnimationEngine = window.App?.AnimationEngine;
    
    if (PatternManager && AnimationEngine) {
      try {
        console.log('UI: Generating new pattern...');
        // Clear all current layers first
        AnimationEngine.clearAllLayers();
        // Generate new pattern
        await PatternManager.generateNewPattern();
        console.log('UI: New pattern generated successfully');
      } catch (error) {
        console.error('UI: Failed to generate new pattern:', error);
        this.showError('Failed to generate new pattern');
      }
    } else {
      console.error('UI: PatternManager or AnimationEngine not available');
      this.showError('Pattern system not ready');
    }
  },

  async toggleBackground() {
    this.isWhiteBackground = !this.isWhiteBackground;
    
    // Control filterable background element instead of CSS background-color
    const filterableBackground = document.getElementById('filterable-background');
    if (filterableBackground) {
      if (this.isWhiteBackground) {
        filterableBackground.style.background = '#fff';
        document.body.classList.add('white-background');
      } else {
        filterableBackground.style.background = '#000';
        document.body.classList.remove('white-background');
      }
    }
    
    // Keep body background for UI elements
    if (this.isWhiteBackground) {
      document.body.style.setProperty('background-color', 'white', 'important');
    } else {
      document.body.style.setProperty('background-color', 'black', 'important');
    }
    
    // Save to user preferences
    await userPreferences.set('isWhiteBackground', this.isWhiteBackground);
    
    this.updateBackgroundToggle();
    console.log('UI: Background toggled to', this.isWhiteBackground ? 'white' : 'black');
  },

  updateBackgroundToggle() {
    const backgroundToggleBtn = document.getElementById('background-toggle-btn');
    if (backgroundToggleBtn) {
      // Update the title and visual indication
      backgroundToggleBtn.title = this.isWhiteBackground ? 'Switch to Black' : 'Switch to White';
      
      // Update visual state by toggling a CSS class
      if (this.isWhiteBackground) {
        backgroundToggleBtn.classList.add('white-bg-active');
      } else {
        backgroundToggleBtn.classList.remove('white-bg-active');
      }
    }
  },

  toggleAudio() {
    const AudioManager = window.App?.AudioManager;
    if (AudioManager) {
      AudioManager.toggle();
    }
  },

  updateAudioButton() {
    const audioToggleBtn = document.getElementById('audio-toggle-btn');
    const AudioManager = window.App?.AudioManager;
    
    if (audioToggleBtn && AudioManager) {
      const isPlaying = AudioManager.isPlaying();
      const icon = audioToggleBtn.querySelector('svg path');
      if (icon) {
        if (isPlaying) {
          // Speaker on icon
          icon.setAttribute('d', 'M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16.03C15.5,15.29 16.5,13.77 16.5,12M3,9V15H7L12,20V4L7,9H3Z');
          audioToggleBtn.title = 'Pause Audio';
        } else {
          // Muted speaker icon
          icon.setAttribute('d', 'M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.52C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z');
          audioToggleBtn.title = 'Play Audio';
        }
      }
    }
  },

  retry() {
    window.location.reload();
  },

  showOnscreenControls() {
    if (this.onscreenControls) {
      this.onscreenControls.classList.add('visible');
      console.log('UI: Onscreen controls shown');
    }
    
    // Clear any existing timer
    if (this.mouseTimer) {
      clearTimeout(this.mouseTimer);
      this.mouseTimer = null;
    }
  },

  scheduleHideControls() {
    // Clear any existing timer
    if (this.mouseTimer) {
      clearTimeout(this.mouseTimer);
    }
    
    // Schedule hiding controls after 3 seconds
    this.mouseTimer = setTimeout(() => {
      if (this.onscreenControls) {
        this.onscreenControls.classList.remove('visible');
        console.log('UI: Onscreen controls hidden due to inactivity');
      }
    }, 3000);
  },

  hideOnscreenControls() {
    if (!this.onscreenControls || window.kioskMode) return;
    console.log('UI: Hiding onscreen controls');
    this.onscreenControls.classList.remove('visible');
    // Clear any existing timer
    if (this.mouseTimer) {
      clearTimeout(this.mouseTimer);
      this.mouseTimer = null;
    }
  },

  handleKeydown(event) {
    switch (event.key.toLowerCase()) {
      case ' ':
        event.preventDefault();
        this.togglePlayPause();
        break;
      case 'n':
        this.generateNewPattern();
        break;
      case 'b':
        this.toggleBackground();
        break;
      case 'a':
        this.toggleAudio();
        break;
      case 'f':
        this.saveFavorite();
        break;
      case 'v':
        this.showFavoritesGallery();
        break;
      case 'g':
        this.toggleDebugGrid();
        break;
      case 'i':
        this.showImageManager();
        break;
      case 'c':
        this.showGalleryManager();
        break;
    }
  },

  handleClickOutside(event) {
    if (!this.onscreenControls || window.kioskMode) return;

    // Check if the panel is currently visible
    if (!this.onscreenControls.classList.contains('visible')) return;

    // Check if the click was inside the control panel
    const clickedInsidePanel = this.onscreenControls.contains(event.target);

    // Debug logging
    console.log('UI: Click detected at:', event.clientX, event.clientY);
    console.log('UI: Clicked inside panel:', clickedInsidePanel);
    console.log('UI: Target element:', event.target);

    // If clicked outside the panel, hide the controls
    // Note: clicks in trigger area should hide controls when they're visible
    if (!clickedInsidePanel) {
      console.log('UI: Click outside panel detected, hiding onscreen controls');
      this.hideOnscreenControls();
    } else {
      console.log('UI: Click inside panel, keeping controls visible');
    }
  },

  async saveFavorite() {
    console.log('UI: saveFavorite method called');
    try {
      const FavoritesManager = window.App?.FavoritesManager;
      console.log('UI: FavoritesManager available:', !!FavoritesManager);
      if (FavoritesManager) {
        console.log('UI: Calling FavoritesManager.saveFavorite()');
        await FavoritesManager.saveFavorite();
        console.log('UI: Favorite saved successfully');
        // Toast handled by FavoritesManager
      } else {
        console.error('UI: FavoritesManager not available');
        this.showError('FavoritesManager not available');
      }
    } catch (error) {
      console.error('UI: Failed to save favorite:', error);
      this.showError(`Failed to save favorite: ${error.message}`);
    }
  },

  showFavoritesGallery() {
    const FavoritesGallery = window.App?.FavoritesGallery;
    if (FavoritesGallery) {
      FavoritesGallery.show();
    }
  },

  showImageManager() {
    const ImageManagerUI = window.App?.ImageManagerUI;
    if (ImageManagerUI) {
      ImageManagerUI.show();
    }
  },

  showGalleryManager() {
    const GalleryManager = window.App?.GalleryManager;
    if (GalleryManager) {
      GalleryManager.show();
    }
  },

  toggleDebugGrid() {
    // Toggle rule of thirds grid - only works in rule of thirds layout modes
    const currentLayoutMode = window.APP_CONFIG?.transformations?.translation?.layout_mode;
    
    // Only allow grid in rule of thirds modes
    if (currentLayoutMode !== 'rule_of_thirds' && currentLayoutMode !== 'rule_of_thirds_and_centre' && currentLayoutMode !== 'rule_of_fifths_thirds_and_centre' && currentLayoutMode !== 'rule_of_fifths_and_thirds') {
      console.log('Debug grid only available in rule of thirds and rule of fifths thirds layout modes');
      return;
    }
    
    // Use the existing rule-of-thirds-grid element
    const grid = document.getElementById('rule-of-thirds-grid');
    if (grid) {
      const isVisible = grid.style.display !== 'none' && grid.style.display !== '';
      
      if (!isVisible) {
        grid.style.display = 'block';
        
        // Update grid position to account for matte border
        const GridManager = window.App?.GridManager;
        if (GridManager && GridManager.updateGridPosition) {
          GridManager.updateGridPosition();
        }
        
        // Update center dot visibility using GridManager method
        if (GridManager && GridManager.updateCenterDotVisibility) {
          GridManager.updateCenterDotVisibility();
        }
        
        // Add green borders to all existing images
        this.updateImageBorders(true);
      } else {
        grid.style.display = 'none';
        
        // Update center dot visibility using GridManager method
        const GridManager = window.App?.GridManager;
        if (GridManager && GridManager.updateCenterDotVisibility) {
          GridManager.updateCenterDotVisibility();
        }
        
        // Remove green borders from all images
        this.updateImageBorders(false);
      }
    }
  },
  
  updateImageBorders(showBorders) {
    // Update borders on all existing image layers
    const images = document.querySelectorAll('.image-layer img');
    images.forEach(img => {
      if (showBorders) {
        img.style.border = '3px solid rgba(0, 255, 0, 0.9)';
        img.style.boxShadow = '0 0 0 1px rgba(0, 255, 0, 0.5)';
      } else {
        img.style.border = '';
        img.style.boxShadow = '';
      }
    });
  },

  updateAnimationSpeed() {
    // Update the pattern sequence interval based on speed multiplier
    console.log(`UI: Updating animation speed to ${this.speedMultiplier}x`);
    
    const PatternManager = window.App?.PatternManager;
    if (PatternManager && PatternManager.patternInterval) {
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
    
    const config = window.APP_CONFIG || {};
    if (!config.layer_management) config.layer_management = {};
    config.layer_management.max_concurrent_layers = this.maxLayers;
    console.log(`UI: Config updated - max_concurrent_layers: ${config.layer_management.max_concurrent_layers}`);
    
    // If we've reduced the layer limit, remove excess layers immediately
    const AnimationEngine = window.App?.AnimationEngine;
    if (AnimationEngine) {
      const currentLayerCount = AnimationEngine.activeLayers.size;
      if (currentLayerCount > this.maxLayers) {
        const excessLayers = currentLayerCount - this.maxLayers;
        console.log(`UI: Removing ${excessLayers} excess layers (${currentLayerCount} -> ${this.maxLayers})`);
        this.removeExcessLayers(excessLayers);
      }
    }
  },

  removeExcessLayers(excessCount) {
    const AnimationEngine = window.App?.AnimationEngine;
    if (!AnimationEngine) return;

    // Remove the oldest layers first
    let removed = 0;
    for (const [imageId, layerInfo] of AnimationEngine.activeLayers.entries()) {
      if (removed >= excessCount) break;
      
      // Clear any pending timeouts
      if (layerInfo.holdTimeout) {
        clearTimeout(layerInfo.holdTimeout);
      }
      
      // Remove from DOM
      if (layerInfo.layer && layerInfo.layer.parentNode) {
        layerInfo.layer.parentNode.removeChild(layerInfo.layer);
      }
      
      // Remove from active layers
      AnimationEngine.activeLayers.delete(imageId);
      removed++;
    }
    
    console.log(`UI: Removed ${removed} excess layers`);
  },

  // Methods for RemoteSync to update UI from remote control changes
  updateSpeedDisplay() {
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    
    if (speedSlider) {
      speedSlider.value = this.speedMultiplier.toString();
    }
    if (speedValue) {
      speedValue.textContent = `${this.speedMultiplier}`;
    }
    
    this.updateAnimationSpeed();
    console.log(`UI: Speed display updated to ${this.speedMultiplier}x from remote`);
  },

  updateMaxLayersDisplay() {
    const layersSlider = document.getElementById('layers-slider');
    const layersValue = document.getElementById('layers-value');
    
    if (layersSlider) {
      layersSlider.value = this.maxLayers.toString();
    }
    if (layersValue) {
      layersValue.textContent = this.maxLayers.toString();
    }
    
    this.updateMaxLayers();
    console.log(`UI: Max layers display updated to ${this.maxLayers} from remote`);
  },

  async updateVolumeDisplay() {
    const volumeSlider = document.getElementById('audio-volume-slider');
    const volumeValue = document.getElementById('audio-volume-value');
    
    try {
      const volumePercent = await userPreferences.get('volume') || 50;
      
      if (volumeSlider) {
        volumeSlider.value = volumePercent.toString();
      }
      if (volumeValue) {
        volumeValue.textContent = `${volumePercent}%`;
      }
      
      console.log(`UI: Volume display updated to ${volumePercent}% from remote`);
    } catch (error) {
      console.warn('UI: Failed to update volume display:', error);
    }
  },

  showToast(message, duration = 2000) {
    // Create green toast matching main app style (upper middle)
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 32px;
      left: 50%;
      transform: translateX(-50%) translateY(-100px);
      background: rgba(76, 175, 80, 0.95);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-width: 400px;
      word-wrap: break-word;
      text-align: center;
      opacity: 0;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
      toast.style.opacity = '1';
    }, 10);
    
    // Animate out and remove
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(-100px)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }
};