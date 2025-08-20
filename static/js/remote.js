/**
 * ManyPaintings Remote Control Application
 * iPhone-optimized web interface for controlling the main display
 */

class RemoteController {
    constructor() {
        this.settings = {};
        this.favorites = [];
        this.images = [];
        this.connectionStatus = 'connecting';
        this.isLoading = false;
        this.pollingInterval = 3000; // Poll every 3 seconds
        this.pollTimer = null;
        this.refreshTimeout = null; // Timer for progressive refresh
        this.toastThrottle = {
            gallery: null,  // Timer for gallery setting toasts
            basic: null     // Timer for basic setting toasts
        };
        
        // Activity tracking for smart disconnect
        this.lastActivityTime = Date.now();
        this.inactivityTimeout = 120000; // 120 seconds (2 minutes)
        this.activityCheckInterval = 5000; // Check every 5 seconds
        this.activityTimer = null;
        this.isActive = true;
        
        // Hero image cycling properties
        this.heroImages = [];
        this.currentHeroIndex = 0;
        this.heroRotationTimer = null;
        this.heroRotationInterval = 20000; // 20 seconds
        this.activeHeroLayer = 1; // Track which layer is currently active
        
        // Elements
        this.elements = {};
        this.initializeElements();
        
        // Event listeners
        this.setupEventListeners();
        
        // Initialize the app
        this.init();
    }
    
    initializeElements() {
        // Hero image elements
        this.elements.heroImage1 = document.getElementById('hero-image-1');
        this.elements.heroImage2 = document.getElementById('hero-image-2');
        
        // Connection status
        this.elements.connectionIndicator = document.querySelector('.connection-indicator');
        this.elements.connectionText = document.querySelector('.connection-text');
        
        // Quick action buttons
        this.elements.playPauseBtn = document.getElementById('remote-play-pause-btn');
        this.elements.newPatternBtn = document.getElementById('remote-new-pattern-btn');
        this.elements.backgroundToggleBtn = document.getElementById('remote-background-toggle-btn');
        this.elements.favoriteBtn = document.getElementById('remote-favorite-btn');
        this.elements.downloadBtn = document.getElementById('remote-download-btn');
        
        // Control sliders
        this.elements.speedSlider = document.getElementById('remote-speed-slider');
        this.elements.speedValue = document.getElementById('remote-speed-value');
        this.elements.layersSlider = document.getElementById('remote-layers-slider');
        this.elements.layersValue = document.getElementById('remote-layers-value');
        this.elements.volumeSlider = document.getElementById('remote-volume-slider');
        this.elements.volumeValue = document.getElementById('remote-volume-value');
        
        // Gallery manager controls
        this.elements.brightnessSlider = document.getElementById('remote-brightness-slider');
        this.elements.brightnessValue = document.getElementById('remote-brightness-value');
        this.elements.contrastSlider = document.getElementById('remote-contrast-slider');
        this.elements.contrastValue = document.getElementById('remote-contrast-value');
        this.elements.saturationSlider = document.getElementById('remote-saturation-slider');
        this.elements.saturationValue = document.getElementById('remote-saturation-value');
        this.elements.whiteBalanceSlider = document.getElementById('remote-white-balance-slider');
        this.elements.whiteBalanceValue = document.getElementById('remote-white-balance-value');
        this.elements.textureIntensitySlider = document.getElementById('remote-texture-intensity-slider');
        this.elements.textureIntensityValue = document.getElementById('remote-texture-intensity-value');
        this.elements.galleryResetBtn = document.getElementById('remote-gallery-reset-btn');
        
        // Favorites
        this.elements.favoritesLoading = document.getElementById('remote-favorites-loading');
        this.elements.favoritesEmpty = document.getElementById('remote-favorites-empty');
        this.elements.favoritesGrid = document.getElementById('remote-favorites-grid');
        
        // Image Manager
        this.elements.uploadArea = document.getElementById('remote-upload-area');
        this.elements.uploadInput = document.getElementById('remote-image-upload-input');
        this.elements.uploadProgress = document.getElementById('remote-upload-progress');
        this.elements.uploadProgressBar = document.getElementById('remote-upload-progress-bar');
        this.elements.uploadStatus = document.getElementById('remote-upload-status');
        this.elements.imagesLoading = document.getElementById('remote-images-loading');
        this.elements.imagesEmpty = document.getElementById('remote-images-empty');
        this.elements.imagesGrid = document.getElementById('remote-images-grid');
        
        // Toast
        this.elements.toast = document.getElementById('remote-toast');
        this.elements.toastMessage = document.getElementById('remote-toast-message');
        
        // IP Address Display
        this.elements.ipDisplay = document.getElementById('remote-ip-display');
        
    }
    
    setupEventListeners() {
        // Quick action buttons - wrapped with activity tracking
        this.elements.playPauseBtn?.addEventListener('click', () => {
            this.recordActivity();
            this.handleAction('play-pause');
        });
        this.elements.newPatternBtn?.addEventListener('click', () => {
            this.recordActivity();
            this.handleAction('new-pattern');
        });
        this.elements.backgroundToggleBtn?.addEventListener('click', () => {
            this.recordActivity();
            this.handleAction('background-toggle');
        });
        this.elements.favoriteBtn?.addEventListener('click', () => {
            this.recordActivity();
            this.handleAction('save-favorite');
        });
        this.elements.downloadBtn?.addEventListener('click', () => {
            this.recordActivity();
            this.downloadCurrentImage();
        });
        
        // Control sliders - wrapped with activity tracking
        this.elements.speedSlider?.addEventListener('input', (e) => {
            this.recordActivity();
            this.handleSliderChange('speed', parseInt(e.target.value));
        });
        this.elements.layersSlider?.addEventListener('input', (e) => {
            this.recordActivity();
            this.handleSliderChange('maxLayers', parseInt(e.target.value));
        });
        this.elements.volumeSlider?.addEventListener('input', (e) => {
            this.recordActivity();
            this.handleSliderChange('volume', parseInt(e.target.value));
        });
        
        // Gallery manager sliders - wrapped with activity tracking
        this.elements.brightnessSlider?.addEventListener('input', (e) => {
            this.recordActivity();
            this.handleGallerySliderChange('brightness', parseInt(e.target.value));
        });
        this.elements.contrastSlider?.addEventListener('input', (e) => {
            this.recordActivity();
            this.handleGallerySliderChange('contrast', parseInt(e.target.value));
        });
        this.elements.saturationSlider?.addEventListener('input', (e) => {
            this.recordActivity();
            this.handleGallerySliderChange('saturation', parseInt(e.target.value));
        });
        this.elements.whiteBalanceSlider?.addEventListener('input', (e) => {
            this.recordActivity();
            this.handleGallerySliderChange('whiteBalance', parseInt(e.target.value));
        });
        this.elements.textureIntensitySlider?.addEventListener('input', (e) => {
            this.recordActivity();
            this.handleGallerySliderChange('textureIntensity', parseInt(e.target.value));
        });
        
        // Gallery reset - wrapped with activity tracking
        this.elements.galleryResetBtn?.addEventListener('click', () => {
            this.recordActivity();
            this.resetGallerySettings();
        });
        
        // Image Manager upload events - wrapped with activity tracking
        if (this.elements.uploadArea && this.elements.uploadInput) {
            this.elements.uploadArea.addEventListener('click', () => {
                this.recordActivity();
                this.elements.uploadInput.click();
            });

            this.elements.uploadInput.addEventListener('change', (e) => {
                this.recordActivity();
                const files = e.target.files;
                if (files.length > 0) {
                    this.uploadFiles(Array.from(files));
                }
            });
        }
        
        // Global activity tracking for touch and mouse events
        document.addEventListener('touchstart', () => this.recordActivity(), { passive: true });
        document.addEventListener('touchmove', () => this.recordActivity(), { passive: true });
        document.addEventListener('mousedown', () => this.recordActivity());
        document.addEventListener('scroll', () => this.recordActivity(), { passive: true });
    }
    
    async init() {
        console.log('Remote Controller: Initializing...');
        
        try {
            
            // Set IP address display
            this.setIPAddress();
            
            // Load initial settings
            await this.loadSettings();
            this.updateConnectionStatus('connected');
            
            // Load favorites
            await this.loadFavorites();
            
            // Load images
            await this.loadImages();
            
            // Initialize hero images
            this.initializeHeroImages();
            
            // Start polling for changes from main display
            this.startPolling();
            
            // Start activity monitoring
            this.startActivityMonitoring();
            
            console.log('Remote Controller: Initialized successfully');
        } catch (error) {
            console.error('Remote Controller: Initialization failed:', error);
            this.updateConnectionStatus('disconnected');
            this.showToast('Connection failed. Check your network.');
        }
    }
    
    /**
     * Record user activity for idle detection
     */
    recordActivity() {
        this.lastActivityTime = Date.now();
        
        // If we were inactive, reconnect immediately
        if (!this.isActive) {
            console.log('Remote Controller: Activity detected, reconnecting...');
            this.isActive = true;
            this.updateConnectionStatus('connecting');
            
            // Resume polling immediately
            this.startPolling();
            
            // Resume hero cycling
            this.resumeHeroRotation();
        }
    }
    
    /**
     * Start monitoring for user inactivity
     */
    startActivityMonitoring() {
        if (this.activityTimer) {
            clearInterval(this.activityTimer);
        }
        
        this.activityTimer = setInterval(() => {
            this.checkInactivity();
        }, this.activityCheckInterval);
        
        console.log('Remote Controller: Started activity monitoring (120s timeout)');
    }
    
    /**
     * Check if user has been inactive and disconnect if needed
     */
    checkInactivity() {
        if (!this.isActive) {
            return; // Already disconnected
        }
        
        const timeSinceLastActivity = Date.now() - this.lastActivityTime;
        
        if (timeSinceLastActivity >= this.inactivityTimeout) {
            console.log('Remote Controller: 120 seconds of inactivity detected, disconnecting...');
            this.disconnect();
        }
    }
    
    /**
     * Disconnect from main display due to inactivity
     */
    disconnect() {
        this.isActive = false;
        
        // Stop polling to save battery/bandwidth
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        
        // Pause hero rotation to save battery
        this.pauseHeroRotation();
        
        // Update status
        this.updateConnectionStatus('disconnected');
        console.log('Remote Controller: Disconnected due to inactivity');
        
        // No toast notification for disconnect to avoid interrupting user
    }
    
    /**
     * Stop activity monitoring (cleanup)
     */
    stopActivityMonitoring() {
        if (this.activityTimer) {
            clearInterval(this.activityTimer);
            this.activityTimer = null;
        }
        console.log('Remote Controller: Stopped activity monitoring');
    }
    
    async loadSettings() {
        try {
            const response = await fetch(`/api/settings`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.settings = await response.json();
            this.updateUI();
            console.log('Remote Controller: Settings loaded:', this.settings);
        } catch (error) {
            console.error('Remote Controller: Failed to load settings:', error);
            throw error;
        }
    }
    
    async saveSettings(updates) {
        try {
            const response = await fetch(`/api/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Update local settings
            Object.assign(this.settings, updates);
            this.updateConnectionStatus('connected');
            
            console.log('Remote Controller: Settings saved:', updates);
        } catch (error) {
            console.error('Remote Controller: Failed to save settings:', error);
            this.updateConnectionStatus('disconnected');
            this.showToast('Failed to save settings');
            throw error;
        }
    }
    
    async loadFavorites() {
        try {
            this.showFavoritesLoading(true);
            
            const response = await fetch(`/api/favorites`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.favorites = await response.json();
            this.updateFavoritesDisplay();
            
            // Update hero images when favorites change
            this.updateHeroImages();
            
            console.log('Remote Controller: Favorites loaded:', this.favorites.length);
        } catch (error) {
            console.error('Remote Controller: Failed to load favorites:', error);
            this.showFavoritesEmpty(true);
        } finally {
            this.showFavoritesLoading(false);
        }
    }
    
    updateUI() {
        // Update basic controls
        if (this.elements.speedSlider) {
            this.elements.speedSlider.value = this.settings.speed || 1;
            this.elements.speedValue.textContent = `${this.settings.speed || 1}x`;
        }
        
        if (this.elements.layersSlider) {
            this.elements.layersSlider.value = this.settings.maxLayers || 4;
            this.elements.layersValue.textContent = this.settings.maxLayers || 4;
        }
        
        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.value = this.settings.volume || 50;
            this.elements.volumeValue.textContent = `${this.settings.volume || 50}%`;
        }
        
        // Update remote background to match main app
        this.updateRemoteBackground();
        
        // Update play/pause button state
        this.updatePlayPauseButton();
        
        // Update gallery manager controls
        const gallery = this.settings.gallery || {};
        
        if (this.elements.brightnessSlider) {
            this.elements.brightnessSlider.value = gallery.brightness || 100;
            this.elements.brightnessValue.textContent = `${gallery.brightness || 100}%`;
        }
        
        if (this.elements.contrastSlider) {
            this.elements.contrastSlider.value = gallery.contrast || 100;
            this.elements.contrastValue.textContent = `${gallery.contrast || 100}%`;
        }
        
        if (this.elements.saturationSlider) {
            this.elements.saturationSlider.value = gallery.saturation || 100;
            this.elements.saturationValue.textContent = `${gallery.saturation || 100}%`;
        }
        
        if (this.elements.whiteBalanceSlider) {
            this.elements.whiteBalanceSlider.value = gallery.whiteBalance || 100;
            this.elements.whiteBalanceValue.textContent = `${gallery.whiteBalance || 100}%`;
        }
        
        if (this.elements.textureIntensitySlider) {
            this.elements.textureIntensitySlider.value = gallery.textureIntensity || 0;
            this.elements.textureIntensityValue.textContent = `${gallery.textureIntensity || 0}%`;
        }
        
        // Update background toggle button style
        if (this.elements.backgroundToggleBtn) {
            if (this.settings.isWhiteBackground) {
                this.elements.backgroundToggleBtn.style.background = 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)';
                this.elements.backgroundToggleBtn.style.color = '#333';
            } else {
                this.elements.backgroundToggleBtn.style.background = 'linear-gradient(135deg, #444 0%, #555 100%)';
                this.elements.backgroundToggleBtn.style.color = '#ffffff';
            }
        }
    }
    
    async handleSliderChange(setting, value) {
        try {
            const update = { [setting]: value };
            await this.saveSettings(update);
            
            let toastMessage = '';
            
            // Update the corresponding value display
            if (setting === 'speed') {
                this.elements.speedValue.textContent = `${value}x`;
                toastMessage = `Speed: ${value}x`;
            } else if (setting === 'maxLayers') {
                this.elements.layersValue.textContent = value;
                toastMessage = `Layers: ${value}`;
            } else if (setting === 'volume') {
                this.elements.volumeValue.textContent = `${value}%`;
                toastMessage = `Volume: ${value}%`;
            }
            
            // Throttle basic setting toast notifications (only show after 750ms of no changes)
            if (this.toastThrottle.basic) {
                clearTimeout(this.toastThrottle.basic);
            }
            
            this.toastThrottle.basic = setTimeout(() => {
                if (toastMessage) {
                    this.showToast(toastMessage);
                }
                this.toastThrottle.basic = null;
            }, 750);
            
        } catch (error) {
            console.error('Failed to update setting:', error);
        }
    }
    
    async handleGallerySliderChange(setting, value) {
        try {
            const update = { 
                gallery: { 
                    ...this.settings.gallery, 
                    [setting]: value 
                } 
            };
            await this.saveSettings(update);
            
            // Update the corresponding value display
            const valueElement = this.elements[`${setting}Value`];
            if (valueElement) {
                valueElement.textContent = `${value}%`;
            }
            
            // Throttle gallery toast notifications (only show after 750ms of no changes)
            if (this.toastThrottle.gallery) {
                clearTimeout(this.toastThrottle.gallery);
            }
            
            this.toastThrottle.gallery = setTimeout(() => {
                this.showToast(`${this.formatSettingName(setting)}: ${value}%`);
                this.toastThrottle.gallery = null;
            }, 750);
            
        } catch (error) {
            console.error('Failed to update gallery setting:', error);
        }
    }
    
    async handleAction(action) {
        try {
            let update = {};
            let message = '';
            
            switch (action) {
                case 'play-pause':
                    // Trigger play/pause on main display
                    const currentlyPlaying = this.settings.isPlaying !== false;
                    await fetch(`/api/play-pause`, { method: 'POST' });
                    // Show what state we're switching TO
                    message = currentlyPlaying ? 'Paused' : 'Playing';
                    // Optimistically update the state (will be corrected by polling if wrong)
                    this.settings.isPlaying = !currentlyPlaying;
                    this.updatePlayPauseButton();
                    break;
                    
                case 'new-pattern':
                    // Trigger new pattern via API call
                    await fetch(`/api/new-pattern`, { method: 'POST' });
                    message = 'New pattern generated';
                    break;
                    
                case 'background-toggle':
                    update = { isWhiteBackground: !this.settings.isWhiteBackground };
                    message = this.settings.isWhiteBackground ? 'Background: Black' : 'Background: White';
                    break;
                    
                case 'save-favorite':
                    // Request save and start progressive refresh
                    await fetch(`/api/save-current-favorite`, { method: 'POST' });
                    message = 'Saving favorite...';
                    this.startProgressiveRefresh();
                    break;
            }
            
            if (Object.keys(update).length > 0) {
                await this.saveSettings(update);
                // Apply the background change immediately to the remote
                if (update.isWhiteBackground !== undefined) {
                    this.settings.isWhiteBackground = update.isWhiteBackground;
                    this.updateRemoteBackground();
                }
            }
            
            if (message) {
                this.showToast(message);
            }
        } catch (error) {
            console.error('Failed to handle action:', error);
            this.showToast('Action failed');
        }
    }
    
    async downloadCurrentImage() {
        try {
            this.showToast('Capturing image...');
            
            // Request image capture from main display
            await fetch('/api/download-current-image', {
                method: 'POST'
            });
            
            // Wait for the main display to process and provide the image
            this.showToast('Preparing download...');
            
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds total (50 * 100ms)
            
            while (attempts < maxAttempts) {
                try {
                    const response = await fetch('/api/get-download-image');
                    
                    if (response.ok) {
                        const result = await response.json();
                        
                        if (result.success && result.imageData) {
                            // Convert data URL to blob for proper iOS handling
                            const response = await fetch(result.imageData);
                            const blob = await response.blob();
                            
                            // Create object URL for the blob
                            const url = URL.createObjectURL(blob);
                            
                            // Create a temporary image element for iOS photo library save
                            const img = document.createElement('img');
                            img.src = url;
                            img.style.position = 'fixed';
                            img.style.top = '-9999px';
                            img.style.left = '-9999px';
                            img.style.width = '1px';
                            img.style.height = '1px';
                            img.style.opacity = '0';
                            
                            document.body.appendChild(img);
                            
                            // For iOS Safari - create download link with proper attributes
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = result.filename || `ManyPaintings_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`;
                            link.style.position = 'fixed';
                            link.style.top = '-9999px';
                            link.style.left = '-9999px';
                            
                            // Add target="_blank" for iOS compatibility
                            link.target = '_blank';
                            link.rel = 'noopener noreferrer';
                            
                            document.body.appendChild(link);
                            
                            // Trigger download with iOS-specific handling
                            if (navigator.userAgent.match(/iPhone|iPad|iPod/)) {
                                // For iOS devices, open in new tab which allows "Save to Photos"
                                link.click();
                                this.showToast('Tap and hold the image, then "Save to Photos"');
                            } else {
                                // Standard download for other devices
                                link.click();
                                this.showToast('Image downloaded');
                            }
                            
                            // Cleanup
                            setTimeout(() => {
                                document.body.removeChild(img);
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
                            }, 1000);
                            
                            return;
                        }
                    }
                } catch (fetchError) {
                    console.log('Download not ready yet, retrying...');
                }
                
                // Wait 100ms before trying again
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            throw new Error('Timeout waiting for image capture');
            
        } catch (error) {
            console.error('Failed to download image:', error);
            this.showToast('Download failed: ' + error.message);
        }
    }
    
    async resetGallerySettings() {
        try {
            const defaultGallery = {
                brightness: 100,
                contrast: 100,
                saturation: 100,
                whiteBalance: 100,
                textureIntensity: 0
            };
            
            const update = { gallery: defaultGallery };
            await this.saveSettings(update);
            this.updateUI();
            this.showToast('Gallery settings reset');
        } catch (error) {
            console.error('Failed to reset gallery settings:', error);
            this.showToast('Reset failed');
        }
    }
    
    async loadFavorite(favoriteId) {
        try {
            const response = await fetch(`/api/favorites/${favoriteId}/load`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.showToast('Favorite loaded');
        } catch (error) {
            console.error('Failed to load favorite:', error);
            this.showToast('Failed to load favorite');
        }
    }
    
    async deleteFavorite(favoriteId, itemElement) {
        try {
            const response = await fetch(`/api/favorites/${favoriteId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Remove the element from the UI
            itemElement.remove();
            
            // Update local favorites array
            this.favorites = this.favorites.filter(fav => fav.id !== favoriteId);
            
            // Check if grid is now empty
            if (this.favorites.length === 0) {
                this.showFavoritesEmpty(true);
            }
            
            this.showToast('Favorite deleted');
        } catch (error) {
            console.error('Failed to delete favorite:', error);
            this.showToast('Failed to delete favorite');
        }
    }
    
    async loadImages() {
        try {
            this.showImagesLoading(true);
            
            // Add cache-busting parameter to prevent stale data
            const cacheBuster = Date.now();
            const response = await fetch(`/api/images?_t=${cacheBuster}`, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.images = data.images || [];
            this.updateImagesDisplay();
            
            console.log('Remote Controller: Images loaded:', this.images.length);
        } catch (error) {
            console.error('Remote Controller: Failed to load images:', error);
            this.showImagesEmpty(true);
        } finally {
            this.showImagesLoading(false);
        }
    }
    
    updateImagesDisplay() {
        if (!this.elements.imagesGrid) return;
        
        if (this.images.length === 0) {
            this.showImagesEmpty(true);
            return;
        }
        
        this.showImagesEmpty(false);
        
        // Clear existing images
        this.elements.imagesGrid.innerHTML = '';
        
        // Add image items
        this.images.forEach(image => {
            const imageElement = this.createImageElement(image);
            this.elements.imagesGrid.appendChild(imageElement);
        });
    }
    
    createImageElement(image) {
        const item = document.createElement('div');
        item.className = 'remote-image-item';
        
        const thumbnail = document.createElement('img');
        thumbnail.className = 'remote-image-thumbnail';
        thumbnail.src = image.path;
        thumbnail.alt = image.filename;
        thumbnail.loading = 'lazy';
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'remote-image-delete-btn';
        deleteBtn.title = 'Delete';
        deleteBtn.innerHTML = `
            <svg fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
        `;
        
        const info = document.createElement('div');
        info.className = 'remote-image-info';
        info.innerHTML = `
            <p class="remote-image-filename" title="${image.filename}">${image.filename}</p>
            <div class="remote-image-details">
                <span>${image.width}×${image.height}</span>
                <span>${this.formatFileSize(image.size)}</span>
            </div>
        `;
        
        // Add delete button click handler
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.deleteImage(image.filename, item);
        });
        
        item.appendChild(thumbnail);
        item.appendChild(deleteBtn);
        item.appendChild(info);
        
        return item;
    }
    
    async uploadFiles(files) {
        const validFiles = files.filter(file => {
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
            return validTypes.includes(file.type);
        });

        if (validFiles.length === 0) {
            this.showToast('Please select valid image files (PNG, JPG, JPEG, GIF, WEBP)');
            return;
        }

        this.showUploadProgress();
        
        const uploadedImageIds = [];

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            const progress = ((i + 1) / validFiles.length) * 100;
            
            this.updateUploadProgress(progress, `Uploading ${file.name}...`);

            try {
                const uploadResult = await this.uploadSingleFile(file);
                console.log(`Remote Controller: Upload result for ${file.name}:`, uploadResult);
                if (uploadResult && uploadResult.image && uploadResult.image.id) {
                    uploadedImageIds.push(uploadResult.image.id);
                    console.log(`Remote Controller: Added image ID ${uploadResult.image.id} to array. Array now:`, uploadedImageIds);
                    if (uploadResult.duplicate) {
                        console.log(`Remote Controller: Duplicate detected for ${file.name}, triggering existing image with ID: ${uploadResult.image.id}`);
                    } else {
                        console.log(`Remote Controller: Uploaded ${file.name} with ID: ${uploadResult.image.id}`);
                    }
                } else {
                    console.log(`Remote Controller: No image ID found in upload result for ${file.name}`);
                }
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                this.showToast(`Failed to upload ${file.name}: ${error.message}`);
            }
        }

        this.hideUploadProgress();
        await this.loadImages(); // Refresh the grid
        
        // Trigger main display refresh with the specific uploaded image IDs
        console.log('Remote Controller: BEFORE REFRESH - About to send refresh request with uploaded IDs:', uploadedImageIds);
        console.log('Remote Controller: BEFORE REFRESH - uploadedImageIds.length:', uploadedImageIds.length);
        console.log('Remote Controller: BEFORE REFRESH - validFiles.length:', validFiles.length);
        
        try {
            console.log('Remote Controller: Making fetch request to /api/images/refresh');
            const refreshResponse = await fetch(`/api/images/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uploaded_image_ids: uploadedImageIds
                })
            });
            
            console.log('Remote Controller: Refresh response status:', refreshResponse.status);
            console.log('Remote Controller: Refresh response ok:', refreshResponse.ok);
            
            if (refreshResponse.ok) {
                const responseData = await refreshResponse.json();
                console.log('Remote Controller: Refresh response data:', responseData);
                console.log('Remote Controller: Successfully requested image refresh on main display with IDs:', uploadedImageIds);
                if (uploadedImageIds.length > 0) {
                    this.showToast(`Successfully uploaded ${validFiles.length} image(s) - triggering immediate display`);
                } else {
                    this.showToast(`Successfully uploaded ${validFiles.length} image(s) - refresh requested`);
                }
            } else {
                console.warn('Remote Controller: Failed to request image refresh, status:', refreshResponse.status);
                this.showToast(`Successfully uploaded ${validFiles.length} image(s)`);
            }
        } catch (error) {
            console.error('Remote Controller: Error requesting image refresh:', error);
            this.showToast(`Successfully uploaded ${validFiles.length} image(s) - error: ${error.message}`);
        }
        
        // Clear the input
        if (this.elements.uploadInput) {
            this.elements.uploadInput.value = '';
        }
    }
    
    async uploadSingleFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/images/upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Upload failed');
        }

        return result;
    }
    
    async deleteImage(filename, itemElement) {
        try {
            const response = await fetch(`/api/images/${encodeURIComponent(filename)}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Delete failed');
            }

            // Remove the element from the UI
            itemElement.remove();
            
            // Update local images array
            this.images = this.images.filter(img => img.filename !== filename);
            
            // Check if grid is now empty
            if (this.images.length === 0) {
                this.showImagesEmpty(true);
            }
            
            this.showToast(`Image "${filename}" deleted`);
        } catch (error) {
            console.error('Failed to delete image:', error);
            this.showToast(`Failed to delete image: ${error.message}`);
        }
    }
    
    showImagesLoading(show) {
        if (this.elements.imagesLoading) {
            this.elements.imagesLoading.classList.toggle('hidden', !show);
        }
    }
    
    showImagesEmpty(show) {
        if (this.elements.imagesEmpty) {
            this.elements.imagesEmpty.classList.toggle('hidden', !show);
        }
    }
    
    showUploadProgress() {
        if (this.elements.uploadProgress) {
            this.elements.uploadProgress.classList.remove('hidden');
        }
    }

    hideUploadProgress() {
        if (this.elements.uploadProgress) {
            this.elements.uploadProgress.classList.add('hidden');
        }
    }

    updateUploadProgress(percentage, status) {
        if (this.elements.uploadProgressBar) {
            this.elements.uploadProgressBar.style.width = `${percentage}%`;
        }
        if (this.elements.uploadStatus) {
            this.elements.uploadStatus.textContent = status;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    updateFavoritesDisplay() {
        if (!this.elements.favoritesGrid) return;
        
        if (this.favorites.length === 0) {
            this.showFavoritesEmpty(true);
            return;
        }
        
        this.showFavoritesEmpty(false);
        
        // Clear existing favorites
        this.elements.favoritesGrid.innerHTML = '';
        
        // Add favorite items
        this.favorites.forEach(favorite => {
            const favoriteElement = this.createFavoriteElement(favorite);
            this.elements.favoritesGrid.appendChild(favoriteElement);
        });
    }
    
    createFavoriteElement(favorite) {
        const item = document.createElement('div');
        item.className = 'favorite-item';
        
        const thumbnail = document.createElement('img');
        thumbnail.className = 'favorite-thumbnail';
        thumbnail.src = favorite.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMyIvPjwvc3ZnPg==';
        thumbnail.alt = favorite.name || 'Favorite';
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'remote-favorite-delete-btn';
        deleteBtn.title = 'Delete';
        deleteBtn.innerHTML = `
            <svg fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
        `;
        
        const title = document.createElement('div');
        title.className = 'favorite-title';
        // Use created_at timestamp to create a readable name
        const createdDate = new Date(favorite.created_at);
        const dateStr = createdDate.toLocaleDateString();
        const timeStr = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        title.textContent = `${dateStr} ${timeStr}`;
        
        // Add click handler for loading favorite (on the main area, not delete button)
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.remote-favorite-delete-btn')) {
                this.loadFavorite(favorite.id);
            }
        });
        
        // Add click handler for delete button
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.deleteFavorite(favorite.id, item);
        });
        
        item.appendChild(thumbnail);
        item.appendChild(deleteBtn);
        item.appendChild(title);
        
        return item;
    }
    
    showFavoritesLoading(show) {
        if (this.elements.favoritesLoading) {
            this.elements.favoritesLoading.classList.toggle('hidden', !show);
        }
    }
    
    showFavoritesEmpty(show) {
        if (this.elements.favoritesEmpty) {
            this.elements.favoritesEmpty.classList.toggle('hidden', !show);
        }
    }
    
    updateConnectionStatus(status) {
        this.connectionStatus = status;
        
        if (this.elements.connectionIndicator) {
            this.elements.connectionIndicator.className = `connection-indicator ${status === 'disconnected' ? 'disconnected' : ''}`;
        }
        
        if (this.elements.connectionText) {
            this.elements.connectionText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        }
    }
    
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
            max-width: 300px;
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
    
    formatSettingName(setting) {
        const names = {
            brightness: 'Brightness',
            contrast: 'Contrast',
            saturation: 'Saturation',
            whiteBalance: 'White Balance',
            textureIntensity: 'Texture'
        };
        return names[setting] || setting;
    }
    
    updateRemoteBackground() {
        const isWhiteBackground = this.settings.isWhiteBackground || false;
        const body = document.body;
        
        if (isWhiteBackground) {
            // Switch to white background theme using CSS classes
            body.classList.add('white-theme');
            
            // Update background toggle button style
            if (this.elements.backgroundToggleBtn) {
                this.elements.backgroundToggleBtn.style.background = 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)';
                this.elements.backgroundToggleBtn.style.color = '#333';
                this.elements.backgroundToggleBtn.style.borderColor = '#ccc';
            }
            
        } else {
            // Switch to black background theme (remove white theme class)
            body.classList.remove('white-theme');
            
            // Update background toggle button style
            if (this.elements.backgroundToggleBtn) {
                this.elements.backgroundToggleBtn.style.background = 'linear-gradient(135deg, #444 0%, #555 100%)';
                this.elements.backgroundToggleBtn.style.color = '#ffffff';
                this.elements.backgroundToggleBtn.style.borderColor = '#666';
            }
        }
        
        console.log(`Remote Controller: Background updated to ${isWhiteBackground ? 'white' : 'black'} theme`);
    }
    
    updatePlayPauseButton() {
        const isPlaying = this.settings.isPlaying !== false; // Default to playing if not set
        
        if (this.elements.playPauseBtn) {
            const icon = this.elements.playPauseBtn.querySelector('svg path');
            const label = this.elements.playPauseBtn.querySelector('.action-label');
            
            if (icon && label) {
                if (isPlaying) {
                    // Show pause icon
                    icon.setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
                    label.textContent = 'Pause';
                } else {
                    // Show play icon
                    icon.setAttribute('d', 'M8 5v14l11-7z');
                    label.textContent = 'Play';
                }
            }
        }
        
        console.log(`Remote Controller: Play/pause button updated - ${isPlaying ? 'playing' : 'paused'}`);
    }
    
    startPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
        }
        
        // Only start polling if we're active
        if (!this.isActive) {
            console.log('Remote Controller: Not starting polling - inactive state');
            return;
        }
        
        // Clear any existing toast throttle timers
        if (this.toastThrottle.gallery) {
            clearTimeout(this.toastThrottle.gallery);
            this.toastThrottle.gallery = null;
        }
        if (this.toastThrottle.basic) {
            clearTimeout(this.toastThrottle.basic);
            this.toastThrottle.basic = null;
        }
        
        this.pollTimer = setInterval(async () => {
            await this.pollForChanges();
        }, this.pollingInterval);
        
        console.log('Remote Controller: Started polling for main display changes');
    }
    
    async pollForChanges() {
        try {
            // Include heartbeat in request to signal we're active
            const response = await fetch(`/api/settings?heartbeat=${Date.now()}`);
            if (!response.ok) {
                this.updateConnectionStatus('disconnected');
                return;
            }
            
            const currentSettings = await response.json();
            
            // Check if background setting changed
            if (currentSettings.isWhiteBackground !== this.settings.isWhiteBackground) {
                console.log(`Remote Controller: Background changed from main display to ${currentSettings.isWhiteBackground ? 'white' : 'black'}`);
                this.settings.isWhiteBackground = currentSettings.isWhiteBackground;
                this.updateRemoteBackground();
                this.updateUI(); // Update the toggle button visual state
            }
            
            // Check if play/pause state changed
            if (currentSettings.isPlaying !== this.settings.isPlaying) {
                console.log(`Remote Controller: Play state changed from main display to ${currentSettings.isPlaying ? 'playing' : 'paused'}`);
                this.settings.isPlaying = currentSettings.isPlaying;
                this.updatePlayPauseButton();
            }
            
            // Check if other settings changed and update UI if needed
            let hasOtherChanges = false;
            if (currentSettings.speed !== this.settings.speed ||
                currentSettings.maxLayers !== this.settings.maxLayers ||
                currentSettings.volume !== this.settings.volume ||
                currentSettings.isPlaying !== this.settings.isPlaying) {
                hasOtherChanges = true;
            }
            
            // Check gallery settings
            const currentGallery = currentSettings.gallery || {};
            const localGallery = this.settings.gallery || {};
            if (JSON.stringify(currentGallery) !== JSON.stringify(localGallery)) {
                hasOtherChanges = true;
            }
            
            if (hasOtherChanges) {
                this.settings = currentSettings;
                this.updateUI();
                console.log('Remote Controller: Updated settings from main display');
            }
            
            this.updateConnectionStatus('connected');
            
        } catch (error) {
            console.warn('Remote Controller: Polling error:', error);
            this.updateConnectionStatus('disconnected');
        }
    }
    
    /**
     * Start progressive refresh after saving a favorite
     */
    startProgressiveRefresh() {
        console.log('Remote Controller: Starting progressive refresh for new favorite');
        
        // Cancel any existing refresh
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }
        
        // Track original favorites count to detect new ones
        const originalCount = this.favorites.length;
        let attempts = 0;
        const maxAttempts = 5;
        
        const tryRefresh = async () => {
            attempts++;
            
            try {
                // Set refresh visual state
                this.setRefreshState(true);
                
                const response = await fetch(`/api/favorites`);
                if (response.ok) {
                    const newFavorites = await response.json();
                    
                    // Check if we got a new favorite
                    if (newFavorites.length > originalCount) {
                        console.log('Remote Controller: New favorite detected, refreshing display');
                        this.favorites = newFavorites;
                        this.updateFavoritesDisplay();
                        this.setRefreshState(false);
                        this.showToast('Favorite saved');
                        return; // Success - stop trying
                    }
                }
                
                // If no new favorite yet and we haven't exceeded max attempts
                if (attempts < maxAttempts) {
                    const delay = attempts === 1 ? 2000 : 1000; // 2s first attempt, then 1s
                    this.refreshTimeout = setTimeout(tryRefresh, delay);
                } else {
                    console.log('Remote Controller: Max refresh attempts reached');
                    this.setRefreshState(false);
                    this.showToast('Favorite saved (refresh manually if needed)');
                }
                
            } catch (error) {
                console.error('Remote Controller: Progressive refresh error:', error);
                this.setRefreshState(false);
                if (attempts >= maxAttempts) {
                    this.showToast('Favorite saved (refresh manually if needed)');
                } else {
                    // Retry on error unless max attempts reached
                    const delay = 1000;
                    this.refreshTimeout = setTimeout(tryRefresh, delay);
                }
            }
        };
        
        // Start with first attempt after 2 seconds
        this.refreshTimeout = setTimeout(tryRefresh, 2000);
    }
    
    /**
     * Set visual refresh state (spinner animation)
     */
    setRefreshState(isRefreshing) {
        // No visual refresh state needed since refresh button was removed
        // Progressive refresh still works in background
    }
    
    /**
     * Initialize hero image cycling
     */
    initializeHeroImages() {
        console.log('Hero Images: Initializing...');
        
        // Setup Page Visibility API to pause/resume rotation
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseHeroRotation();
            } else {
                this.resumeHeroRotation();
            }
        });
        
        // Load hero images from favorites
        this.loadHeroImages();
    }
    
    /**
     * Load favorites for hero image cycling
     */
    loadHeroImages() {
        if (this.favorites && this.favorites.length > 0) {
            // Filter favorites that have thumbnails
            this.heroImages = this.favorites.filter(fav => fav.thumbnail);
            
            if (this.heroImages.length > 0) {
                console.log(`Hero Images: Loaded ${this.heroImages.length} favorites for cycling`);
                this.startHeroRotation();
                return;
            }
        }
        
        console.log('Hero Images: No favorites found, showing fallback pattern');
        this.showFallbackHero();
    }
    
    /**
     * Start hero image rotation
     */
    startHeroRotation() {
        if (this.heroImages.length === 0) {
            this.showFallbackHero();
            return;
        }
        
        // Clear any existing timer
        this.pauseHeroRotation();
        
        // Show first image immediately
        this.showHeroImage(0);
        
        // Start rotation if we have more than one image
        if (this.heroImages.length > 1) {
            this.heroRotationTimer = setInterval(() => {
                this.nextHeroImage();
            }, this.heroRotationInterval);
        }
        
        console.log('Hero Images: Rotation started');
    }
    
    /**
     * Pause hero image rotation
     */
    pauseHeroRotation() {
        if (this.heroRotationTimer) {
            clearInterval(this.heroRotationTimer);
            this.heroRotationTimer = null;
        }
    }
    
    /**
     * Resume hero image rotation
     */
    resumeHeroRotation() {
        if (this.heroImages.length > 1) {
            this.startHeroRotation();
        }
    }
    
    /**
     * Show next hero image
     */
    nextHeroImage() {
        this.currentHeroIndex = (this.currentHeroIndex + 1) % this.heroImages.length;
        this.showHeroImage(this.currentHeroIndex);
    }
    
    /**
     * Show specific hero image with crossfade
     */
    showHeroImage(index) {
        if (!this.heroImages[index]) return;
        
        const heroData = this.heroImages[index];
        const nextLayer = this.activeHeroLayer === 1 ? 2 : 1;
        const currentElement = this.elements[`heroImage${this.activeHeroLayer}`];
        const nextElement = this.elements[`heroImage${nextLayer}`];
        
        if (!nextElement) return;
        
        // Preload the new image
        const img = new Image();
        img.onload = () => {
            // Use hero image if available, fallback to thumbnail
            const imageUrl = heroData.hero_url || heroData.thumbnail;
            
            // Set the background image on the next layer
            nextElement.style.backgroundImage = `url(${imageUrl})`;
            nextElement.classList.remove('fallback');
            
            // Fade in the next layer
            nextElement.classList.add('active');
            
            // After transition, fade out current layer and switch active
            setTimeout(() => {
                if (currentElement) {
                    currentElement.classList.remove('active');
                }
                this.activeHeroLayer = nextLayer;
            }, 100);
        };
        
        // Use hero image if available, fallback to thumbnail for preloading
        img.src = heroData.hero_url || heroData.thumbnail;
    }
    
    /**
     * Show fallback hero pattern when no favorites available
     */
    showFallbackHero() {
        const layer1 = this.elements.heroImage1;
        const layer2 = this.elements.heroImage2;
        
        if (layer1) {
            layer1.style.backgroundImage = '';
            layer1.classList.add('fallback');
            layer1.classList.remove('active');
        }
        
        if (layer2) {
            layer2.style.backgroundImage = '';
            layer2.classList.remove('active');
        }
        
        // Show layer 1 as fallback
        setTimeout(() => {
            if (layer1) {
                layer1.classList.add('active');
            }
        }, 100);
        
        this.activeHeroLayer = 1;
        console.log('Hero Images: Showing fallback pattern');
    }
    
    /**
     * Update hero images when favorites change
     */
    updateHeroImages() {
        console.log('Hero Images: Favorites updated, reloading hero images');
        this.pauseHeroRotation();
        this.currentHeroIndex = 0;
        this.loadHeroImages();
    }
    
    /**
     * Set the IP address display in the header
     */
    setIPAddress() {
        if (this.elements.ipDisplay) {
            // Extract IP address from window.location.hostname
            const ipAddress = window.location.hostname;
            this.elements.ipDisplay.textContent = ipAddress;
            console.log(`Remote Controller: IP address set to: ${ipAddress}`);
        }
    }
}

// Initialize the remote controller when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Remote Control: DOM loaded, initializing...');
    window.remoteController = new RemoteController();
    
    // Register service worker for PWA functionality
    registerServiceWorker();
});

/**
 * Register service worker for Progressive Web App functionality
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('[PWA] Service worker registered successfully:', registration.scope);
                
                // Check for service worker updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    // New content is available, show update notification
                                    showUpdateNotification();
                                } else {
                                    // Content is cached for the first time
                                    console.log('[PWA] App is ready for offline use');
                                }
                            }
                        });
                    }
                });
            })
            .catch((error) => {
                console.warn('[PWA] Service worker registration failed:', error);
            });
        
        // Handle service worker updates
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[PWA] Service worker controller changed');
            // Optionally refresh the page to get the new content
            // window.location.reload();
        });
    } else {
        console.log('[PWA] Service workers not supported in this browser');
    }
}

/**
 * Show update notification when new version is available
 */
function showUpdateNotification() {
    // Use the existing toast system if available
    if (window.remoteController && window.remoteController.showToast) {
        window.remoteController.showToast('Update available - refresh to get latest version', 'success');
    } else {
        // Fallback notification
        console.log('[PWA] Update available - refresh to get latest version');
    }
    
    // Optionally auto-update after a delay
    setTimeout(() => {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        }
    }, 5000); // Auto-update after 5 seconds
}

// Add viewport meta tag for proper mobile rendering
if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(viewport);
}

// Prevent zoom on double tap for iOS
var lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    var now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);