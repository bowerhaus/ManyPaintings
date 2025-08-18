/**
 * Audio Manager - Handles background audio playback
 * Extracted from main.js for better modularity
 */
import { userPreferences } from './UserPreferences.js';

export const AudioManager = {
  audioElement: null,
  isEnabled: false,
  volume: 0.5,
  filePath: null,

  async init() {
    const config = window.APP_CONFIG || {};
    console.log('AudioManager: Initializing with config:', config);
    console.log('AudioManager: Audio config section:', config.audio);

    if (!config.audio || !config.audio.enabled) {
      console.log('AudioManager: Audio disabled in config');
      return;
    }

    this.isEnabled = config.audio.enabled;
    
    // Get volume from preferences (0-100) and convert to 0-1 range
    const volumePercent = await userPreferences.get('volume') || 50;
    this.volume = volumePercent / 100; // Convert percentage to decimal
    
    this.filePath = config.audio.file_path || 'static/audio/ambient.mp3';

    console.log(`AudioManager: Initialized with file: ${this.filePath}, volume: ${this.volume} (${volumePercent}%)`);

    // Test if the audio file URL is accessible
    fetch(this.filePath, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          console.log('AudioManager: Audio file is accessible via HTTP');
        } else {
          console.error('AudioManager: Audio file not accessible:', response.status, response.statusText);
        }
      })
      .catch(error => {
        console.error('AudioManager: Failed to test audio file accessibility:', error);
      });

    this.createAudioElement();
  },

  createAudioElement() {
    const config = window.APP_CONFIG || {};
    this.audioElement = document.createElement('audio');
    this.audioElement.src = this.filePath;
    this.audioElement.loop = config.audio.loop !== false;
    this.audioElement.volume = this.volume;
    this.audioElement.preload = 'auto';

    // Handle audio loading and errors
    this.audioElement.addEventListener('loadstart', () => {
      console.log('AudioManager: Started loading audio file');
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      console.log('AudioManager: Audio metadata loaded');
    });

    this.audioElement.addEventListener('canplaythrough', () => {
      console.log('AudioManager: Audio loaded and ready to play');
      console.log('AudioManager: Autoplay setting:', config.audio.autoplay);
      if (config.audio.autoplay === true) {
        this.tryAutoplay();
      } else {
        console.log('AudioManager: Autoplay disabled, audio will remain paused');
        // Update UI to show correct initial state
        if (window.App && window.App.UI) {
          window.App.UI.updateAudioButton();
        }
      }
    });

    this.audioElement.addEventListener('error', (e) => {
      console.error('AudioManager: Audio error:', e);
      console.error('AudioManager: Failed to load audio file:', this.filePath);
      console.error('AudioManager: Error details:', e.target.error);
    });

    this.audioElement.addEventListener('ended', () => {
      if (config.audio.loop !== false) {
        this.play();
      }
    });

    // Add to DOM (hidden)
    this.audioElement.style.display = 'none';
    document.body.appendChild(this.audioElement);
  },

  async tryAutoplay() {
    if (!this.audioElement) return;

    try {
      await this.audioElement.play();
      console.log('AudioManager: Autoplay started successfully');
    } catch (error) {
      console.log('AudioManager: Autoplay blocked by browser, waiting for user interaction');
      // Autoplay was blocked, will need user interaction
      this.setupUserInteractionHandler();
    }
  },

  setupUserInteractionHandler() {
    console.log('AudioManager: Setting up user interaction handler for autoplay');

    const handleUserInteraction = async (event) => {
      console.log('AudioManager: User interaction detected, attempting to start audio');
      try {
        await this.audioElement.play();
        console.log('AudioManager: Audio started successfully after user interaction');
        // Update UI button state
        if (window.App && window.App.UI) {
          window.App.UI.updateAudioButton();
        }
      } catch (error) {
        console.error('AudioManager: Failed to start audio after user interaction:', error);
      }
    };

    // Listen for any user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    console.log('AudioManager: User interaction listeners added');
  },

  async play() {
    if (!this.audioElement || !this.isEnabled) {
      console.log('AudioManager: Play called but audio element not ready or disabled');
      return;
    }

    try {
      console.log('AudioManager: Attempting to play audio...');
      await this.audioElement.play();
      console.log('AudioManager: Audio playing successfully');
      // Update UI button state
      if (window.App && window.App.UI) {
        window.App.UI.updateAudioButton();
      }
    } catch (error) {
      console.error('AudioManager: Failed to play audio:', error);
      console.error('AudioManager: Error name:', error.name);
      console.error('AudioManager: Error message:', error.message);
    }
  },

  pause() {
    if (!this.audioElement) return;

    this.audioElement.pause();
    console.log('AudioManager: Audio paused');
    // Update UI button state
    if (window.App && window.App.UI) {
      window.App.UI.updateAudioButton();
    }
  },

  stop() {
    if (!this.audioElement) return;

    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    console.log('AudioManager: Audio stopped');
  },

  async setVolume(volume) {
    if (!this.audioElement) return;

    this.volume = Math.max(0, Math.min(1, volume)); // Keep internal volume as 0-1
    this.audioElement.volume = this.volume;
    
    // Save to user preferences as percentage (0-100)
    const volumePercent = Math.round(this.volume * 100);
    await userPreferences.set('volume', volumePercent);
    
    console.log(`AudioManager: Volume set to ${this.volume} (${volumePercent}%)`);
  },

  toggle() {
    if (!this.audioElement) return;

    if (this.audioElement.paused) {
      this.play();
    } else {
      this.pause();
    }
  },

  isPlaying() {
    return this.audioElement && !this.audioElement.paused;
  }
};