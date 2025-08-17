/**
 * Gallery Manager - Professional artwork display adjustment interface
 * Provides Samsung Frame TV-style gallery controls for color grading
 */
import { userPreferences } from '../managers/UserPreferences.js';

export const GalleryManager = {
  modal: null,
  
  // Gallery settings
  gallerySettings: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    whiteBalance: 100,
    textureIntensity: 0
  },

  async init() {
    this.modal = document.getElementById('gallery-manager-modal');
    
    const closeBtn = document.getElementById('gallery-manager-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Close modal when clicking outside content
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.hide();
        }
      });
    }

    // Close modal with ESC key
    this.escKeyHandler = (e) => {
      if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
        this.hide();
      }
    };
    document.addEventListener('keydown', this.escKeyHandler);

    // Load preferences
    await this.loadGallerySettings();
    
    // Setup controls
    this.setupSliderControls();

    console.log('GalleryManager: Initialized with settings:', this.gallerySettings);
  },

  async loadGallerySettings() {
    this.gallerySettings = {
      brightness: await userPreferences.get('gallery.brightness') || 100,
      contrast: await userPreferences.get('gallery.contrast') || 100,
      saturation: await userPreferences.get('gallery.saturation') || 100,
      whiteBalance: await userPreferences.get('gallery.whiteBalance') || 100,
      textureIntensity: await userPreferences.get('gallery.textureIntensity') || 0
    };
  },

  show() {
    if (!this.modal) return;

    // Load current settings
    this.loadGallerySettings();
    
    // Update sliders with current values
    this.updateSliders();
    
    // Apply current settings
    this.applyGallerySettings();

    this.modal.classList.remove('hidden');
    console.log('GalleryManager: Modal shown with settings:', this.gallerySettings);
  },

  hide() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
    console.log('GalleryManager: Modal hidden');
  },

  setupSliderControls() {
    // Brightness slider (85-115%)
    const brightnessSlider = document.getElementById('gallery-brightness-slider');
    const brightnessValue = document.getElementById('gallery-brightness-value');
    if (brightnessSlider && brightnessValue) {
      brightnessSlider.addEventListener('input', async (e) => {
        this.gallerySettings.brightness = parseInt(e.target.value);
        brightnessValue.textContent = `${this.gallerySettings.brightness}%`;
        await userPreferences.set('gallery.brightness', this.gallerySettings.brightness);
        console.log(`GalleryManager: Brightness changed to ${this.gallerySettings.brightness}%`);
        this.applyGallerySettings();
      });
    }

    // Contrast slider (85-115%)
    const contrastSlider = document.getElementById('gallery-contrast-slider');
    const contrastValue = document.getElementById('gallery-contrast-value');
    if (contrastSlider && contrastValue) {
      contrastSlider.addEventListener('input', async (e) => {
        this.gallerySettings.contrast = parseInt(e.target.value);
        contrastValue.textContent = `${this.gallerySettings.contrast}%`;
        await userPreferences.set('gallery.contrast', this.gallerySettings.contrast);
        console.log(`GalleryManager: Contrast changed to ${this.gallerySettings.contrast}%`);
        this.applyGallerySettings();
      });
    }

    // Saturation slider (50-120%)
    const saturationSlider = document.getElementById('gallery-saturation-slider');
    const saturationValue = document.getElementById('gallery-saturation-value');
    if (saturationSlider && saturationValue) {
      saturationSlider.addEventListener('input', async (e) => {
        this.gallerySettings.saturation = parseInt(e.target.value);
        saturationValue.textContent = `${this.gallerySettings.saturation}%`;
        await userPreferences.set('gallery.saturation', this.gallerySettings.saturation);
        console.log(`GalleryManager: Saturation changed to ${this.gallerySettings.saturation}%`);
        this.applyGallerySettings();
      });
    }

    // White balance slider (80-120%)
    const whiteBalanceSlider = document.getElementById('gallery-white-balance-slider');
    const whiteBalanceValue = document.getElementById('gallery-white-balance-value');
    if (whiteBalanceSlider && whiteBalanceValue) {
      whiteBalanceSlider.addEventListener('input', async (e) => {
        this.gallerySettings.whiteBalance = parseInt(e.target.value);
        whiteBalanceValue.textContent = `${this.gallerySettings.whiteBalance}%`;
        await userPreferences.set('gallery.whiteBalance', this.gallerySettings.whiteBalance);
        console.log(`GalleryManager: White balance changed to ${this.gallerySettings.whiteBalance}%`);
        this.applyGallerySettings();
      });
    }

    // Texture intensity slider (0-100%)
    const textureIntensitySlider = document.getElementById('gallery-texture-intensity-slider');
    const textureIntensityValue = document.getElementById('gallery-texture-intensity-value');
    if (textureIntensitySlider && textureIntensityValue) {
      textureIntensitySlider.addEventListener('input', async (e) => {
        this.gallerySettings.textureIntensity = parseInt(e.target.value);
        textureIntensityValue.textContent = `${this.gallerySettings.textureIntensity}%`;
        await userPreferences.set('gallery.textureIntensity', this.gallerySettings.textureIntensity);
        console.log(`GalleryManager: Texture intensity changed to ${this.gallerySettings.textureIntensity}%`);
        this.applyTextureSettings();
      });
    }


    // Reset button
    const resetBtn = document.getElementById('gallery-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetToDefaults());
    }
  },

  updateSliders() {
    // Update brightness slider
    const brightnessSlider = document.getElementById('gallery-brightness-slider');
    const brightnessValue = document.getElementById('gallery-brightness-value');
    if (brightnessSlider && brightnessValue) {
      brightnessSlider.value = this.gallerySettings.brightness.toString();
      brightnessValue.textContent = `${this.gallerySettings.brightness}%`;
    }

    // Update contrast slider
    const contrastSlider = document.getElementById('gallery-contrast-slider');
    const contrastValue = document.getElementById('gallery-contrast-value');
    if (contrastSlider && contrastValue) {
      contrastSlider.value = this.gallerySettings.contrast.toString();
      contrastValue.textContent = `${this.gallerySettings.contrast}%`;
    }

    // Update saturation slider
    const saturationSlider = document.getElementById('gallery-saturation-slider');
    const saturationValue = document.getElementById('gallery-saturation-value');
    if (saturationSlider && saturationValue) {
      saturationSlider.value = this.gallerySettings.saturation.toString();
      saturationValue.textContent = `${this.gallerySettings.saturation}%`;
    }

    // Update white balance slider
    const whiteBalanceSlider = document.getElementById('gallery-white-balance-slider');
    const whiteBalanceValue = document.getElementById('gallery-white-balance-value');
    if (whiteBalanceSlider && whiteBalanceValue) {
      whiteBalanceSlider.value = this.gallerySettings.whiteBalance.toString();
      whiteBalanceValue.textContent = `${this.gallerySettings.whiteBalance}%`;
    }

    // Update texture intensity slider
    const textureIntensitySlider = document.getElementById('gallery-texture-intensity-slider');
    const textureIntensityValue = document.getElementById('gallery-texture-intensity-value');
    if (textureIntensitySlider && textureIntensityValue) {
      textureIntensitySlider.value = this.gallerySettings.textureIntensity.toString();
      textureIntensityValue.textContent = `${this.gallerySettings.textureIntensity}%`;
    }

  },

  applyGallerySettings() {
    const AnimationEngine = window.App?.AnimationEngine;
    if (!AnimationEngine) {
      console.error('GalleryManager: AnimationEngine not available');
      return;
    }

    if (!AnimationEngine.layersContainer) {
      console.error('GalleryManager: layersContainer not available');
      return;
    }

    // Convert white balance percentage to hue rotation degrees
    // 100% = 0°, 80% = -72°, 120% = +72° (±20% maps to ±72°)
    const whiteBalanceHue = (this.gallerySettings.whiteBalance - 100) * 3.6;

    const colorSettings = {
      brightness: this.gallerySettings.brightness,
      contrast: this.gallerySettings.contrast,
      saturation: this.gallerySettings.saturation,
      hue: whiteBalanceHue
    };

    AnimationEngine.applyColorGrading(colorSettings);
    
    console.log(`GalleryManager: Applied settings - brightness:${colorSettings.brightness}% contrast:${colorSettings.contrast}% saturation:${colorSettings.saturation}% whiteBalance:${this.gallerySettings.whiteBalance}% (${whiteBalanceHue.toFixed(1)}°)`);
    
    // Also apply texture settings
    this.applyTextureSettings();
  },

  applyTextureSettings() {
    const textureOverlay = document.getElementById('texture-overlay');
    if (!textureOverlay) {
      console.error('GalleryManager: texture-overlay element not found');
      return;
    }

    // Convert percentage to opacity (0-100% -> 0-1.0)
    const opacity = this.gallerySettings.textureIntensity / 100;
    textureOverlay.style.opacity = opacity.toString();
    
    console.log(`GalleryManager: Applied texture intensity - ${this.gallerySettings.textureIntensity}% (opacity: ${opacity})`);
  },

  resetToDefaults() {
    // Reset to default values
    this.gallerySettings = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      whiteBalance: 100,
      textureIntensity: 0
    };

    // Update sliders
    this.updateSliders();

    // Apply settings
    this.applyGallerySettings();
    
    // Apply texture settings
    this.applyTextureSettings();

    // Save to preferences
    userPreferences.update(this.gallerySettings);

    console.log('GalleryManager: Reset to defaults');
  },

  // Initialize gallery settings on app startup
  initializeOnStartup() {
    this.loadGallerySettings();
    this.applyGallerySettings();
    this.applyTextureSettings();
    console.log('GalleryManager: Initialized on startup with saved settings');
  }
};