/**
 * RemoteSync Manager - Handles synchronization with remote control changes
 * Polls server for setting changes and applies them to the main display
 */

export class RemoteSync {
    constructor() {
        this.pollingInterval = 1000; // Poll every 1 second when active (maximum responsiveness)
        this.heartbeatInterval = 10000; // Check for new remotes every 10 seconds when idle
        this.isPolling = false;
        this.pollTimer = null;
        this.lastSettings = {};
        this.lastPollTime = 0;
        this.lastPatternRequest = null; // Track last pattern request timestamp
        this.hasActiveRemotes = false; // Track if we currently have active remotes
        this.consecutiveEmptyChecks = 0; // Count consecutive checks with no remotes
        
        // Global toast cooldown to prevent spam
        this.lastToastTime = 0;
        this.toastCooldownPeriod = 2000; // 2 seconds between toasts
        
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
        
        // Reset toast cooldown when stopping
        this.lastToastTime = 0;
        
        console.log('RemoteSync: Stopped polling');
    }
    
    /**
     * Schedule the next poll
     */
    scheduleNextPoll() {
        if (!this.isPolling) {
            return;
        }
        
        // Use different intervals based on remote activity
        const interval = this.hasActiveRemotes ? this.pollingInterval : this.heartbeatInterval;
        
        this.pollTimer = setTimeout(() => {
            this.pollForChanges();
        }, interval);
    }
    
    /**
     * Poll the server for changes and apply them
     */
    async pollForChanges() {
        if (!this.isPolling) {
            return;
        }
        
        try {
            // First check if any remote controls are active
            const remoteStatus = await this.checkRemoteStatus();
            const currentlyHasRemotes = remoteStatus.active_remotes > 0;
            
            // State transition logging
            if (currentlyHasRemotes !== this.hasActiveRemotes) {
                if (currentlyHasRemotes) {
                    console.log(`RemoteSync: Remote activity detected! Switching to active polling (${this.pollingInterval}ms)`);
                    this.consecutiveEmptyChecks = 0;
                } else {
                    console.log(`RemoteSync: No active remotes. Switching to heartbeat mode (${this.heartbeatInterval}ms)`);
                }
                this.hasActiveRemotes = currentlyHasRemotes;
            }
            
            if (this.hasActiveRemotes) {
                // Active remotes detected - perform full polling
                console.log(`RemoteSync: Processing ${remoteStatus.active_remotes} active remote(s)`);
                
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
                
                // Check for image refresh requests
                await this.checkImageRefreshRequests();
                
                // Check for download image requests
                await this.checkDownloadImageRequests();
                
                this.consecutiveEmptyChecks = 0;
            } else {
                // No active remotes - heartbeat mode
                this.consecutiveEmptyChecks++;
                if (this.consecutiveEmptyChecks <= 2) {
                    console.log('RemoteSync: Heartbeat mode - checking for new remote connections');
                } else if (this.consecutiveEmptyChecks % 6 === 0) {
                    // Log every minute in heartbeat mode (6 * 10 seconds)
                    console.log('RemoteSync: Still in heartbeat mode - no active remotes detected');
                }
            }
            
        } catch (error) {
            console.warn('RemoteSync: Polling error:', error);
        } finally {
            // Schedule next poll
            this.scheduleNextPoll();
        }
    }
    
    /**
     * Check if any remote controls are currently active
     */
    async checkRemoteStatus() {
        try {
            const response = await fetch('/api/remote-status');
            if (!response.ok) {
                // If endpoint fails, assume no active remotes
                return { active_remotes: 0 };
            }
            
            const status = await response.json();
            return status;
            
        } catch (error) {
            console.warn('RemoteSync: Failed to check remote status:', error);
            // On error, assume no active remotes to be safe
            return { active_remotes: 0 };
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
            
            // On first poll, initialize lastSettings without detecting changes
            if (Object.keys(this.lastSettings).length === 0) {
                console.log('RemoteSync: Initializing settings baseline');
                this.lastSettings = currentSettings;
                return; // Skip change detection on first poll
            }
            
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
            const response = await fetch('/api/settings');
            if (!response.ok) return;
            
            const settings = await response.json();
            
            // Initialize lastPatternRequest on first poll to avoid false positives
            if (this.lastPatternRequest === null) {
                this.lastPatternRequest = settings.newPatternRequest || 0;
                console.log('RemoteSync: Initialized pattern request tracking');
                return; // Skip triggering on initialization
            }
            
            // Check if there's a new pattern request timestamp
            if (settings.newPatternRequest && settings.newPatternRequest !== this.lastPatternRequest) {
                console.log('RemoteSync: New pattern request detected');
                this.lastPatternRequest = settings.newPatternRequest;
                
                // Trigger new pattern generation
                await this.generateNewPatternFromRemote();
            }
        } catch (error) {
            console.warn('RemoteSync: Failed to check pattern requests:', error);
        }
    }

    /**
     * Generate a new pattern triggered by remote control
     */
    async generateNewPatternFromRemote() {
        try {
            console.log('RemoteSync: Attempting to generate new pattern from remote');
            console.log('RemoteSync: window.App available:', !!window.App);
            console.log('RemoteSync: window.App.UI available:', !!(window.App && window.App.UI));
            console.log('RemoteSync: UI.generateNewPattern available:', !!(window.App && window.App.UI && window.App.UI.generateNewPattern));
            
            const UI = window.App?.UI;
            if (UI && UI.generateNewPattern) {
                await UI.generateNewPattern();
                console.log('RemoteSync: Successfully generated new pattern from remote request');
                this.showToast('New pattern generated');
            } else {
                console.warn('RemoteSync: UI or generateNewPattern method not available');
                if (!UI) {
                    console.warn('RemoteSync: UI not found on window.App');
                } else if (!UI.generateNewPattern) {
                    console.warn('RemoteSync: generateNewPattern method not found on UI');
                }
            }
        } catch (error) {
            console.error('RemoteSync: Failed to generate new pattern from remote:', error);
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
                
                // Show toast message
                const newState = AnimationEngine ? AnimationEngine.isPlaying : !wasPlaying;
                const message = newState ? 'Resumed' : 'Paused';
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
                
                // Don't show toast - FavoritesManager already handles this
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
                
                // Don't show toast - FavoritesGallery already handles this
            }
        } catch (error) {
            console.error('RemoteSync: Failed to load favorite from remote:', error);
        }
    }
    
    /**
     * Check for image refresh requests from remote control
     */
    async checkImageRefreshRequests() {
        try {
            const response = await fetch('/api/check-refresh-images');
            if (response.ok) {
                const result = await response.json();
                
                if (result.has_request) {
                    console.log('RemoteSync: Detected image refresh request from remote with uploaded IDs:', result.uploaded_image_ids);
                    await this.handleImageRefreshFromRemote(result.uploaded_image_ids || []);
                    
                    // Clear the request
                    await fetch('/api/refresh-images-status', { method: 'DELETE' }).catch(() => {});
                }
            }
        } catch (error) {
            // This is expected when no requests are pending
        }
    }
    
    /**
     * Handle image refresh triggered by remote control
     */
    async handleImageRefreshFromRemote(uploadedImageIds) {
        try {
            console.log('RemoteSync: Processing image refresh with uploaded IDs:', uploadedImageIds);
            
            // First refresh the ImageManager catalog
            const ImageManager = window.App?.ImageManager;
            if (!ImageManager) {
                console.error('RemoteSync: ImageManager not available on window.App');
                this.showToast('ImageManager not available');
                return;
            }
            
            if (!ImageManager.init) {
                console.error('RemoteSync: ImageManager.init method not available');
                this.showToast('ImageManager.init not available');
                return;
            }
            
            console.log('RemoteSync: Refreshing ImageManager catalog...');
            await ImageManager.init();
            console.log('RemoteSync: ImageManager catalog refreshed');
            
            // If we have specific uploaded image IDs, trigger immediate display
            if (uploadedImageIds.length > 0) {
                console.log('RemoteSync: Processing specific uploaded image IDs:', uploadedImageIds);
                
                const PatternManager = window.App?.PatternManager;
                if (!PatternManager) {
                    console.error('RemoteSync: PatternManager not available on window.App');
                    this.showToast('PatternManager not available');
                    return;
                }
                
                // Verify uploaded image IDs exist in the catalog
                const catalogImageIds = Array.from(ImageManager.images.keys());
                const validUploadedIds = uploadedImageIds.filter(id => catalogImageIds.includes(id));
                
                console.log('RemoteSync: Catalog has', catalogImageIds.length, 'images');
                console.log('RemoteSync: Valid uploaded IDs:', validUploadedIds);
                
                if (validUploadedIds.length > 0) {
                    try {
                        // Preload the newly uploaded images
                        if (ImageManager.preloadImages) {
                            console.log('RemoteSync: Preloading uploaded images...');
                            await ImageManager.preloadImages(validUploadedIds, true);
                        }
                        
                        // Insert uploaded images at the current sequence position
                        const currentIndex = PatternManager.sequenceIndex || 0;
                        const sequenceLengthBefore = PatternManager.imageSequence.length;
                        
                        console.log('RemoteSync: Current sequence index:', currentIndex);
                        console.log('RemoteSync: Sequence length before insertion:', sequenceLengthBefore);
                        
                        // Insert new images at the current position, pushing existing images forward
                        // Reverse the array so they appear in the same order they were uploaded
                        validUploadedIds.reverse().forEach(imageId => {
                            PatternManager.imageSequence.splice(currentIndex, 0, imageId);
                        });
                        
                        console.log('RemoteSync: Inserted', validUploadedIds.length, 'images at position', currentIndex);
                        console.log('RemoteSync: Sequence length after insertion:', PatternManager.imageSequence.length);
                        console.log('RemoteSync: Next few images in sequence:', PatternManager.imageSequence.slice(currentIndex, currentIndex + 5));
                        
                        // Free up layer slots if we're at the limit
                        const AnimationEngine = window.App?.AnimationEngine;
                        if (AnimationEngine) {
                            const config = window.APP_CONFIG || {};
                            const maxLayers = config.layer_management?.max_concurrent_layers || 4;
                            const currentLayerCount = AnimationEngine.activeLayers.size;
                            
                            console.log('RemoteSync: Current layer count:', currentLayerCount, 'Max layers:', maxLayers);
                            
                            if (currentLayerCount >= maxLayers) {
                                console.log(`RemoteSync: At layer limit (${currentLayerCount}/${maxLayers}), removing oldest layer to make room`);
                                
                                // Find the oldest layer (earliest startTime) and remove it immediately
                                let oldestLayer = null;
                                let oldestTime = Date.now();
                                
                                AnimationEngine.activeLayers.forEach((layerInfo, imageId) => {
                                    if (layerInfo.startTime < oldestTime) {
                                        oldestTime = layerInfo.startTime;
                                        oldestLayer = layerInfo;
                                    }
                                });
                                
                                if (oldestLayer) {
                                    console.log('RemoteSync: Removing oldest layer with imageId:', oldestLayer.imageId || 'unknown', 'startTime:', oldestTime);
                                    if (AnimationEngine.removeLayer) {
                                        AnimationEngine.removeLayer(oldestLayer);
                                        console.log('RemoteSync: Successfully removed oldest layer. New layer count:', AnimationEngine.activeLayers.size);
                                    } else {
                                        console.error('RemoteSync: AnimationEngine.removeLayer method not available');
                                    }
                                } else {
                                    console.warn('RemoteSync: No oldest layer found to remove');
                                }
                            }
                        } else {
                            console.error('RemoteSync: AnimationEngine not available for layer management');
                        }
                        
                        // Trigger the next image to appear immediately
                        console.log('RemoteSync: Triggering immediate display of uploaded images');
                        if (PatternManager.showNextImage) {
                            await PatternManager.showNextImage();
                            console.log('RemoteSync: Successfully triggered showNextImage');
                        } else {
                            console.error('RemoteSync: PatternManager.showNextImage method not available');
                        }
                        
                        this.showToast(`${validUploadedIds.length} image(s) uploaded - displaying now`);
                    } catch (preloadError) {
                        console.error('RemoteSync: Error in preload/display logic:', preloadError);
                        // Still show the toast as the catalog was refreshed
                        this.showToast('Images uploaded - catalog refreshed');
                    }
                } else {
                    console.warn('RemoteSync: No valid uploaded image IDs found in catalog');
                    console.log('RemoteSync: Uploaded IDs:', uploadedImageIds);
                    console.log('RemoteSync: First 10 catalog IDs:', catalogImageIds.slice(0, 10));
                    this.showToast('Images uploaded - catalog refreshed');
                }
            } else {
                console.log('RemoteSync: No specific uploaded IDs, just refreshed catalog');
                this.showToast('Image catalog refreshed');
            }
            
        } catch (error) {
            console.error('RemoteSync: Failed to handle image refresh from remote:', error);
            this.showToast('Failed to refresh images: ' + error.message);
        }
    }
    
    /**
     * Check for download image requests from remote control
     */
    async checkDownloadImageRequests() {
        try {
            const response = await fetch('/api/check-download-image');
            if (response.ok) {
                const result = await response.json();
                
                if (result.has_request) {
                    console.log('RemoteSync: Detected download image request from remote');
                    await this.handleDownloadImageFromRemote();
                }
            }
        } catch (error) {
            // This is expected when no requests are pending
        }
    }
    
    /**
     * Handle download image triggered by remote control
     */
    async handleDownloadImageFromRemote() {
        try {
            const { FavoritesManager } = await import('./FavoritesManager.js');
            
            if (FavoritesManager && FavoritesManager.captureCanvasDownload) {
                // Capture the image data
                const imageData = await FavoritesManager.captureCanvasDownload();
                
                if (imageData) {
                    // Send the captured image data back to the server for remote download
                    await fetch('/api/store-download-image', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            imageData: imageData
                        })
                    });
                    
                    console.log('RemoteSync: Successfully captured and stored image for remote download');
                } else {
                    console.error('RemoteSync: Failed to capture image data');
                }
            } else {
                console.error('RemoteSync: FavoritesManager.captureCanvasDownload not available');
            }
        } catch (error) {
            console.error('RemoteSync: Failed to handle download image from remote:', error);
        }
    }
    
    /**
     * Show a notification for remote changes (with throttling)
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
                const message = changeMessages.join(', ');
                this.showToast(message);
            }
            
        } catch (error) {
            console.warn('RemoteSync: Failed to show change notification:', error);
        }
    }
    
    /**
     * Show a toast notification (with global cooldown)
     */
    showToast(message, duration = 2000) {
        try {
            // Check global cooldown to prevent toast spam
            const currentTime = Date.now();
            if (currentTime - this.lastToastTime < this.toastCooldownPeriod) {
                console.log('RemoteSync: Toast suppressed due to cooldown:', message);
                return;
            }
            
            this.lastToastTime = currentTime;
            
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