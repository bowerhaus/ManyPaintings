/**
 * UserPreferences Manager - Handles server-side storage for user settings
 * Provides centralized management of user preferences with API integration
 */
export class UserPreferences {
    constructor() {
        this.VERSION = '1.0';
        this.cache = {}; // Memory cache for current session
        this.initialized = false;
        
        // Default preferences (fallback when server unavailable)
        this.defaults = {
            speed: 1,           // Speed multiplier (1-10)
            maxLayers: 4,       // Maximum concurrent layers (1-8)  
            volume: 50,         // Audio volume (0-100)
            isWhiteBackground: false,  // Background color (false=black, true=white)
            gallery: {
                brightness: 100,    // Brightness percentage (25-115)
                contrast: 100,      // Contrast percentage (85-115)
                saturation: 100,    // Saturation percentage (50-120)
                whiteBalance: 100,  // White balance percentage (80-120, maps to hue rotation)
                textureIntensity: 0 // Texture overlay intensity percentage (0-100)
            }
        };
        
        console.log('UserPreferences: Initialized with server-side storage');
    }
    
    /**
     * Initialize preferences by loading from server
     * @returns {Promise<Object>} Current preferences
     */
    async init() {
        if (this.initialized) {
            return this.cache;
        }
        
        try {
            console.log('UserPreferences: Loading initial settings from server...');
            const response = await fetch('/api/settings');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const settings = await response.json();
            this.cache = settings;
            this.initialized = true;
            
            console.log('UserPreferences: Loaded from server:', settings);
            return settings;
            
        } catch (error) {
            console.warn('UserPreferences: Failed to load from server, using defaults:', error);
            this.cache = { ...this.defaults };
            this.initialized = true;
            return this.cache;
        }
    }
    
    /**
     * Get a specific preference value
     * @param {string} key - Preference key (supports nested keys like 'gallery.brightness')
     * @returns {Promise<*>} Preference value
     */
    async get(key) {
        // Ensure initialized
        if (!this.initialized) {
            await this.init();
        }
        
        // Handle nested keys (e.g., 'gallery.brightness')
        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            return this.cache[parent]?.[child] ?? this.getDefault(key);
        }
        
        return this.cache[key] ?? this.getDefault(key);
    }
    
    /**
     * Set a specific preference value and save to server
     * @param {string} key - Preference key (supports nested keys)
     * @param {*} value - Preference value
     * @returns {Promise<boolean>} Success status
     */
    async set(key, value) {
        console.log(`UserPreferences: Setting ${key} = ${value}`);
        
        // Ensure initialized
        if (!this.initialized) {
            await this.init();
        }
        
        // Update cache immediately for responsive UI
        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            if (!this.cache[parent]) {
                this.cache[parent] = {};
            }
            this.cache[parent][child] = value;
        } else {
            this.cache[key] = value;
        }
        
        // Save to server
        return await this.saveToServer({ [key]: value });
    }
    
    /**
     * Get all current preferences
     * @returns {Promise<Object>} All preferences
     */
    async getAll() {
        if (!this.initialized) {
            await this.init();
        }
        return { ...this.cache };
    }
    
    /**
     * Update multiple preferences at once
     * @param {Object} updates - Multiple preference updates
     * @returns {Promise<boolean>} Success status
     */
    async update(updates) {
        console.log('UserPreferences: Updating multiple settings:', updates);
        
        // Ensure initialized
        if (!this.initialized) {
            await this.init();
        }
        
        // Update cache immediately
        for (const [key, value] of Object.entries(updates)) {
            if (key.includes('.')) {
                const [parent, child] = key.split('.');
                if (!this.cache[parent]) {
                    this.cache[parent] = {};
                }
                this.cache[parent][child] = value;
            } else {
                this.cache[key] = value;
            }
        }
        
        // Save to server
        return await this.saveToServer(updates);
    }
    
    /**
     * Save settings to server
     * @param {Object} settings - Settings to save
     * @returns {Promise<boolean>} Success status
     * @private
     */
    async saveToServer(settings) {
        try {
            // Convert nested key notation to object structure
            const payload = {};
            for (const [key, value] of Object.entries(settings)) {
                if (key.includes('.')) {
                    const [parent, child] = key.split('.');
                    if (!payload[parent]) {
                        payload[parent] = {};
                    }
                    payload[parent][child] = value;
                } else {
                    payload[key] = value;
                }
            }
            
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                console.log('UserPreferences: Successfully saved to server');
                return true;
            } else {
                console.error('UserPreferences: Server returned error:', result.error);
                return false;
            }
            
        } catch (error) {
            console.error('UserPreferences: Failed to save to server:', error);
            return false;
        }
    }
    
    /**
     * Get default value for a preference key
     * @param {string} key - Preference key
     * @returns {*} Default value
     * @private
     */
    getDefault(key) {
        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            return this.defaults[parent]?.[child];
        }
        return this.defaults[key];
    }
    
    /**
     * Reset all preferences to defaults
     * @returns {Promise<boolean>} Success status
     */
    async reset() {
        try {
            console.log('UserPreferences: Resetting to defaults');
            
            // Reset cache
            this.cache = { ...this.defaults };
            
            // Save defaults to server
            const success = await this.saveToServer(this.defaults);
            
            if (success) {
                console.log('UserPreferences: Reset completed successfully');
            }
            
            return success;
            
        } catch (error) {
            console.error('UserPreferences: Failed to reset preferences:', error);
            return false;
        }
    }
    
    /**
     * Refresh settings from server (useful for remote control sync)
     * @returns {Promise<Object>} Updated settings
     */
    async refresh() {
        try {
            console.log('UserPreferences: Refreshing from server...');
            const response = await fetch('/api/settings');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const settings = await response.json();
            this.cache = settings;
            
            console.log('UserPreferences: Refreshed from server:', settings);
            return settings;
            
        } catch (error) {
            console.warn('UserPreferences: Failed to refresh from server:', error);
            return this.cache;
        }
    }
}

// Export singleton instance
export const userPreferences = new UserPreferences();