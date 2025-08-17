/**
 * RemoteSync Manager - Handles synchronization with remote control changes
 * Polls server for setting changes and applies them to the main display
 */

export class RemoteSync {
    constructor() {
        this.pollingInterval = 2000; // Poll every 2 seconds
        this.isPolling = false;
        this.pollTimer = null;
        this.lastSettings = {};
        this.lastPollTime = 0;
        
        console.log('RemoteSync: Initialized');
    }
    
    /**
     * Start polling for remote changes
     */
    async init() {
        try {
            // Load initial settings to establish baseline
            await this.loadCurrentSettings();
            
            // Start polling
            this.startPolling();
            
            console.log('RemoteSync: Started polling for remote changes');
        } catch (error) {
            console.error('RemoteSync: Failed to initialize:', error);
        }
    }
    
    /**
     * Load current settings from server to establish baseline
     */
    async loadCurrentSettings() {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                this.lastSettings = await response.json();
                console.log('RemoteSync: Loaded baseline settings:', this.lastSettings);
            }
        } catch (error) {
            console.warn('RemoteSync: Failed to load baseline settings:', error);
        }
    }
    
    /**
     * Start the polling mechanism
     */
    startPolling() {
        if (this.isPolling) {
            return;
        }
        
        this.isPolling = true;
        this.scheduleNextPoll();
    }
    
    /**
     * Stop the polling mechanism
     */
    stopPolling() {
        this.isPolling = false;
        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
        console.log('RemoteSync: Stopped polling');
    }
    
    /**
     * Schedule the next poll
     */
    scheduleNextPoll() {
        if (!this.isPolling) {
            return;
        }
        
        this.pollTimer = setTimeout(() => {
            this.pollForChanges();
        }, this.pollingInterval);
    }
    
    /**
     * Poll the server for changes and apply them
     */
    async pollForChanges() {
        if (!this.isPolling) {
            return;
        }
        
        try {
            // Check for settings changes
            await this.checkSettingsChanges();
            
            // Check for pattern generation requests
            await this.checkPatternRequests();
            
            // Check for favorite load requests
            await this.checkFavoriteRequests();
            
            // Check for save favorite requests
            await this.checkSimpleSaveFavoriteRequests();
            
            // Check for play/pause requests
            await this.checkPlayPauseRequests();
            
        } catch (error) {
            console.warn('RemoteSync: Polling error:', error);
        } finally {
            // Schedule next poll
            this.scheduleNextPoll();
        }
    }
    
    /**
     * Check for settings changes from remote control
     */
    async checkSettingsChanges() {
        try {
            const response = await fetch('/api/settings');
            if (!response.ok) {
                return;
            }
            
            const currentSettings = await response.json();
            
            // Compare with last known settings
            const changes = this.detectSettingsChanges(this.lastSettings, currentSettings);
            
            if (Object.keys(changes).length > 0) {
                console.log('RemoteSync: Detected settings changes:', changes);
                await this.applySettingsChanges(changes);
                this.lastSettings = currentSettings;
            }
            
        } catch (error) {
            console.warn('RemoteSync: Failed to check settings changes:', error);
        }
    }
    
    /**
     * Detect what settings have changed
     */
    detectSettingsChanges(oldSettings, newSettings) {
        const changes = {};
        
        // Check basic settings
        const basicSettings = ['speed', 'maxLayers', 'volume', 'isWhiteBackground'];
        for (const setting of basicSettings) {
            if (oldSettings[setting] !== newSettings[setting]) {
                changes[setting] = newSettings[setting];
            }
        }
        
        // Check gallery settings
        const oldGallery = oldSettings.gallery || {};
        const newGallery = newSettings.gallery || {};
        const gallerySettings = ['brightness', 'contrast', 'saturation', 'whiteBalance', 'textureIntensity'];
        
        for (const setting of gallerySettings) {
            if (oldGallery[setting] !== newGallery[setting]) {
                if (!changes.gallery) {
                    changes.gallery = {};
                }
                changes.gallery[setting] = newGallery[setting];
            }
        }
        
        return changes;
    }
    
    /**
     * Apply detected settings changes to the UI
     */
    async applySettingsChanges(changes) {
        try {
            // Import UI and other managers dynamically to avoid circular dependencies
            const { UI } = await import('../ui/UI.js');
            const { GalleryManager } = await import('../ui/GalleryManager.js');
            const { AudioManager } = await import('./AudioManager.js');
            const { AnimationEngine } = await import('../modules/AnimationEngine.js');
            
            // Apply basic settings changes
            if (changes.speed !== undefined) {
                console.log('RemoteSync: Applying speed change:', changes.speed);
                if (UI && UI.updateSpeedDisplay) {
                    UI.speedMultiplier = changes.speed;
                    UI.updateSpeedDisplay();
                }
            }
            
            if (changes.maxLayers !== undefined) {
                console.log('RemoteSync: Applying max layers change:', changes.maxLayers);
                if (UI && UI.updateMaxLayersDisplay) {
                    UI.maxLayers = changes.maxLayers;
                    UI.updateMaxLayersDisplay();
                }
                if (AnimationEngine && AnimationEngine.setMaxLayers) {
                    AnimationEngine.setMaxLayers(changes.maxLayers);
                }
            }
            
            if (changes.volume !== undefined) {
                console.log('RemoteSync: Applying volume change:', changes.volume);
                if (AudioManager && AudioManager.setVolume) {
                    AudioManager.setVolume(changes.volume / 100); // Convert percentage to decimal
                }
                if (UI && UI.updateVolumeDisplay) {
                    UI.updateVolumeDisplay();
                }
            }
            
            if (changes.isWhiteBackground !== undefined) {
                console.log('RemoteSync: Applying background change:', changes.isWhiteBackground);
                if (UI && UI.toggleBackground) {
                    const currentIsWhite = document.body.classList.contains('white-background');
                    if (currentIsWhite !== changes.isWhiteBackground) {
                        UI.toggleBackground();
                    }
                }
            }
            
            // Apply gallery settings changes
            if (changes.gallery) {
                console.log('RemoteSync: Applying gallery changes:', changes.gallery);
                if (GalleryManager && GalleryManager.applyRemoteChanges) {
                    await GalleryManager.applyRemoteChanges(changes.gallery);
                }
            }
            
            // Show toast notification for changes
            this.showChangeNotification(changes);
            
        } catch (error) {
            console.error('RemoteSync: Failed to apply settings changes:', error);
        }
    }
    
    /**
     * Check for new pattern generation requests
     */
    async checkPatternRequests() {
        try {
            // For now, we don't have a pattern request mechanism
            // This could be implemented with a timestamp file or database field
            // that the main app checks for new pattern requests
        } catch (error) {
            console.warn('RemoteSync: Failed to check pattern requests:', error);
        }
    }
    
    /**
     * Check for favorite load requests
     */
    async checkFavoriteRequests() {
        try {
            const response = await fetch('/api/load-favorite-status');
            if (response.ok) {
                const status = await response.json();
                
                if (status.has_request && status.request) {
                    const requestTime = new Date(status.request.timestamp).getTime();
                    
                    // Only process requests newer than our last poll
                    if (requestTime > this.lastPollTime) {
                        console.log('RemoteSync: Detected favorite load request:', status.request.favorite_id);
                        await this.loadFavoriteFromRequest(status.request);
                        
                        // Clean up the request file
                        await fetch('/load_favorite.json', { method: 'DELETE' }).catch(() => {});
                    }
                }
                // No logging needed when has_request is false - this is normal
            } else {
                console.warn('RemoteSync: Failed to check favorite load status:', response.status);
            }
        } catch (error) {
            console.warn('RemoteSync: Error checking favorite requests:', error);
        }
        
        this.lastPollTime = Date.now();
    }
    
    /**
     * Check for save favorite requests (simplified approach)
     */
    async checkSimpleSaveFavoriteRequests() {
        try {
            const response = await fetch('/api/check-save-favorite');
            if (response.ok) {
                const result = await response.json();
                
                if (result.has_request) {
                    console.log('RemoteSync: Detected save favorite request from remote');
                    await this.saveFavoriteFromRemote();
                }
            }
        } catch (error) {
            // This is expected when no requests are pending
        }
    }
    
    /**
     * Check for play/pause requests
     */
    async checkPlayPauseRequests() {
        try {
            const response = await fetch('/api/check-play-pause');
            if (response.ok) {
                const result = await response.json();
                
                if (result.has_request) {
                    console.log('RemoteSync: Detected play/pause request from remote');
                    await this.handlePlayPauseFromRemote();
                }
            }
        } catch (error) {
            // This is expected when no requests are pending
        }
    }
    
    /**
     * Handle play/pause triggered by remote control
     */
    async handlePlayPauseFromRemote() {
        try {
            const { UI } = await import('../ui/UI.js');
            
            if (UI && UI.togglePlayPause) {
                // Get current state before toggling
                const AnimationEngine = window.App?.AnimationEngine;
                const wasPlaying = AnimationEngine ? AnimationEngine.isPlaying : false;
                
                // Toggle play/pause
                UI.togglePlayPause();
                
                // Show appropriate toast message
                const newState = AnimationEngine ? AnimationEngine.isPlaying : !wasPlaying;
                const message = newState ? 'Resumed from remote' : 'Paused from remote';
                this.showToast(message);
                
                console.log('RemoteSync: Successfully toggled play/pause from remote:', newState ? 'playing' : 'paused');
            }
        } catch (error) {
            console.error('RemoteSync: Failed to toggle play/pause from remote:', error);
        }
    }
    
    /**
     * Save a favorite triggered by remote control
     */
    async saveFavoriteFromRemote() {
        try {
            const { FavoritesManager } = await import('./FavoritesManager.js');
            
            if (FavoritesManager && FavoritesManager.saveFavorite) {
                await FavoritesManager.saveFavorite();
                console.log('RemoteSync: Successfully saved favorite from remote request');
                
                // Show notification
                this.showToast('Favorite saved from remote');
            }
        } catch (error) {
            console.error('RemoteSync: Failed to save favorite from remote:', error);
        }
    }
    
    /**
     * Load a favorite from a remote request
     */
    async loadFavoriteFromRequest(loadRequest) {
        try {
            const { FavoritesManager } = await import('./FavoritesManager.js');
            
            if (FavoritesManager && FavoritesManager.loadFavorite) {
                await FavoritesManager.loadFavorite(loadRequest.favorite_id);
                console.log('RemoteSync: Successfully loaded favorite:', loadRequest.favorite_id);
                
                // Show notification
                this.showToast('Favorite loaded from remote');
            }
        } catch (error) {
            console.error('RemoteSync: Failed to load favorite from remote:', error);
        }
    }
    
    /**
     * Show a notification for remote changes
     */
    showChangeNotification(changes) {
        try {
            const changeMessages = [];
            
            if (changes.speed !== undefined) {
                changeMessages.push(`Speed: ${changes.speed}x`);
            }
            if (changes.maxLayers !== undefined) {
                changeMessages.push(`Layers: ${changes.maxLayers}`);
            }
            if (changes.volume !== undefined) {
                changeMessages.push(`Volume: ${changes.volume}%`);
            }
            if (changes.isWhiteBackground !== undefined) {
                changeMessages.push(`Background: ${changes.isWhiteBackground ? 'White' : 'Black'}`);
            }
            if (changes.gallery) {
                changeMessages.push('Gallery settings updated');
            }
            
            if (changeMessages.length > 0) {
                const message = `Remote: ${changeMessages.join(', ')}`;
                this.showToast(message);
            }
            
        } catch (error) {
            console.warn('RemoteSync: Failed to show change notification:', error);
        }
    }
    
    /**
     * Show a toast notification
     */
    showToast(message, duration = 2000) {
        try {
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
                opacity: 0;
            `;
            toast.textContent = message;
            document.body.appendChild(toast);
            
            // Animate in
            setTimeout(() => {
                toast.style.transform = 'translateX(-50%) translateY(0)';
                toast.style.opacity = '1';
            }, 10);
            
            // Remove after duration
            setTimeout(() => {
                toast.style.transform = 'translateX(-50%) translateY(-100px)';
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, duration);
            
        } catch (error) {
            console.warn('RemoteSync: Failed to show toast:', error);
        }
    }
}

// Create singleton instance
export const remoteSync = new RemoteSync();