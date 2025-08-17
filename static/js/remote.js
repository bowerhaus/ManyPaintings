/**
 * ManyPaintings Remote Control Application
 * iPhone-optimized web interface for controlling the main display
 */

class RemoteController {
    constructor() {
        this.settings = {};
        this.favorites = [];
        this.connectionStatus = 'connecting';
        this.isLoading = false;
        this.pollingInterval = 3000; // Poll every 3 seconds
        this.pollTimer = null;
        this.toastThrottle = {
            gallery: null,  // Timer for gallery setting toasts
            basic: null     // Timer for basic setting toasts
        };
        
        // Elements
        this.elements = {};
        this.initializeElements();
        
        // Event listeners
        this.setupEventListeners();
        
        // Initialize the app
        this.init();
    }
    
    initializeElements() {
        // Connection status
        this.elements.connectionIndicator = document.querySelector('.connection-indicator');
        this.elements.connectionText = document.querySelector('.connection-text');
        
        // Quick action buttons
        this.elements.playPauseBtn = document.getElementById('remote-play-pause-btn');
        this.elements.newPatternBtn = document.getElementById('remote-new-pattern-btn');
        this.elements.backgroundToggleBtn = document.getElementById('remote-background-toggle-btn');
        this.elements.favoriteBtn = document.getElementById('remote-favorite-btn');
        
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
        
        // Toast
        this.elements.toast = document.getElementById('remote-toast');
        this.elements.toastMessage = document.getElementById('remote-toast-message');
    }
    
    setupEventListeners() {
        // Quick action buttons
        this.elements.playPauseBtn?.addEventListener('click', () => this.handleAction('play-pause'));
        this.elements.newPatternBtn?.addEventListener('click', () => this.handleAction('new-pattern'));
        this.elements.backgroundToggleBtn?.addEventListener('click', () => this.handleAction('background-toggle'));
        this.elements.favoriteBtn?.addEventListener('click', () => this.handleAction('save-favorite'));
        
        // Control sliders
        this.elements.speedSlider?.addEventListener('input', (e) => this.handleSliderChange('speed', parseInt(e.target.value)));
        this.elements.layersSlider?.addEventListener('input', (e) => this.handleSliderChange('maxLayers', parseInt(e.target.value)));
        this.elements.volumeSlider?.addEventListener('input', (e) => this.handleSliderChange('volume', parseInt(e.target.value)));
        
        // Gallery manager sliders
        this.elements.brightnessSlider?.addEventListener('input', (e) => this.handleGallerySliderChange('brightness', parseInt(e.target.value)));
        this.elements.contrastSlider?.addEventListener('input', (e) => this.handleGallerySliderChange('contrast', parseInt(e.target.value)));
        this.elements.saturationSlider?.addEventListener('input', (e) => this.handleGallerySliderChange('saturation', parseInt(e.target.value)));
        this.elements.whiteBalanceSlider?.addEventListener('input', (e) => this.handleGallerySliderChange('whiteBalance', parseInt(e.target.value)));
        this.elements.textureIntensitySlider?.addEventListener('input', (e) => this.handleGallerySliderChange('textureIntensity', parseInt(e.target.value)));
        
        // Gallery reset
        this.elements.galleryResetBtn?.addEventListener('click', () => this.resetGallerySettings());
        
        // Touch improvements for iOS
        document.addEventListener('touchstart', function() {}, { passive: true });
    }
    
    async init() {
        console.log('Remote Controller: Initializing...');
        
        try {
            // Load initial settings
            await this.loadSettings();
            this.updateConnectionStatus('connected');
            
            // Load favorites
            await this.loadFavorites();
            
            // Start polling for changes from main display
            this.startPolling();
            
            console.log('Remote Controller: Initialized successfully');
        } catch (error) {
            console.error('Remote Controller: Initialization failed:', error);
            this.updateConnectionStatus('disconnected');
            this.showToast('Connection failed. Check your network.');
        }
    }
    
    async loadSettings() {
        try {
            const response = await fetch('/api/settings');
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
            const response = await fetch('/api/settings', {
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
            
            const response = await fetch('/api/favorites');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.favorites = await response.json();
            this.updateFavoritesDisplay();
            
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
                    await fetch('/api/play-pause', { method: 'POST' });
                    // Show what state we're switching TO
                    message = currentlyPlaying ? 'Paused' : 'Playing';
                    // Optimistically update the state (will be corrected by polling if wrong)
                    this.settings.isPlaying = !currentlyPlaying;
                    this.updatePlayPauseButton();
                    break;
                    
                case 'new-pattern':
                    // Trigger new pattern via API call
                    await fetch('/api/new-pattern', { method: 'POST' });
                    message = 'New pattern generated';
                    break;
                    
                case 'background-toggle':
                    update = { isWhiteBackground: !this.settings.isWhiteBackground };
                    message = this.settings.isWhiteBackground ? 'Background: Black' : 'Background: White';
                    break;
                    
                case 'save-favorite':
                    // Simple approach: just call the endpoint, main display will handle it
                    await fetch('/api/save-current-favorite', { method: 'POST' });
                    message = 'Save favorite requested';
                    // Reload favorites after a delay to catch the new favorite
                    setTimeout(async () => {
                        await this.loadFavorites();
                    }, 2000);
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
            const response = await fetch('/api/settings');
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
}

// Initialize the remote controller when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Remote Control: DOM loaded, initializing...');
    window.remoteController = new RemoteController();
});

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