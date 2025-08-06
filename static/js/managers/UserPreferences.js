/**
 * UserPreferences Manager - Handles localStorage for user settings
 * Provides centralized management of user preferences with validation and error handling
 */
export class UserPreferences {
    constructor() {
        this.STORAGE_KEY = 'manyPaintings_preferences';
        this.VERSION = '1.0';
        
        // Default preferences
        this.defaults = {
            speed: 1,           // Speed multiplier (1-10)
            maxLayers: 4,       // Maximum concurrent layers (1-8)  
            volume: 0.5,        // Audio volume (0-1)
            isWhiteBackground: false,  // Background color (false=black, true=white)
            brightness: 100,    // Brightness percentage (85-115)
            contrast: 100,      // Contrast percentage (85-115)
            saturation: 100,    // Saturation percentage (50-120)
            whiteBalance: 100,  // White balance percentage (80-120, maps to hue rotation)
            textureIntensity: 0, // Texture overlay intensity percentage (0-100)
            version: this.VERSION
        };
        
        // Check localStorage support
        console.log('UserPreferences: localStorage supported:', UserPreferences.isSupported());
        
        this.preferences = this.loadPreferences();
        
        console.log('UserPreferences: Initialized with preferences:', this.preferences);
    }
    
    /**
     * Load preferences from localStorage with fallback to defaults
     * @returns {Object} Merged preferences object
     */
    loadPreferences() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (!stored) {
                return { ...this.defaults };
            }
            
            const parsed = JSON.parse(stored);
            
            // Validate and merge with defaults
            const preferences = this.validateAndMerge(parsed);
            
            console.log('UserPreferences: Loaded preferences from localStorage:', preferences);
            return preferences;
            
        } catch (error) {
            console.warn('UserPreferences: Failed to load from localStorage, using defaults:', error);
            return { ...this.defaults };
        }
    }
    
    /**
     * Save preferences to localStorage
     * @param {Object} updates - Preference updates to apply
     */
    savePreferences(updates = {}) {
        try {
            console.log('UserPreferences: Attempting to save updates:', updates);
            
            // Merge updates with current preferences
            this.preferences = { ...this.preferences, ...updates, version: this.VERSION };
            
            // Validate before saving
            this.preferences = this.validateAndMerge(this.preferences);
            
            // Save to localStorage
            const jsonString = JSON.stringify(this.preferences);
            localStorage.setItem(this.STORAGE_KEY, jsonString);
            
            // Verify save worked
            const verifyRead = localStorage.getItem(this.STORAGE_KEY);
            console.log('UserPreferences: Save verification - stored successfully:', !!verifyRead);
            console.log('UserPreferences: Saved to localStorage:', this.preferences);
            
        } catch (error) {
            console.error('UserPreferences: Failed to save to localStorage:', error);
            console.error('UserPreferences: Error details:', error.message, error.name);
        }
    }
    
    /**
     * Validate preference values and merge with defaults
     * @param {Object} prefs - Preferences to validate
     * @returns {Object} Validated preferences
     */
    validateAndMerge(prefs) {
        const validated = { ...this.defaults };
        
        // Validate speed (1-10)
        if (typeof prefs.speed === 'number' && prefs.speed >= 1 && prefs.speed <= 10) {
            validated.speed = prefs.speed;
        }
        
        // Validate maxLayers (1-8)
        if (typeof prefs.maxLayers === 'number' && prefs.maxLayers >= 1 && prefs.maxLayers <= 8) {
            validated.maxLayers = prefs.maxLayers;
        }
        
        // Validate volume (0-1)
        if (typeof prefs.volume === 'number' && prefs.volume >= 0 && prefs.volume <= 1) {
            validated.volume = prefs.volume;
        }
        
        // Validate background (boolean)
        if (typeof prefs.isWhiteBackground === 'boolean') {
            validated.isWhiteBackground = prefs.isWhiteBackground;
        }
        
        // Validate brightness (85-115)
        if (typeof prefs.brightness === 'number' && prefs.brightness >= 85 && prefs.brightness <= 115) {
            validated.brightness = prefs.brightness;
        }
        
        // Validate contrast (85-115)
        if (typeof prefs.contrast === 'number' && prefs.contrast >= 85 && prefs.contrast <= 115) {
            validated.contrast = prefs.contrast;
        }
        
        // Validate saturation (50-120)
        if (typeof prefs.saturation === 'number' && prefs.saturation >= 50 && prefs.saturation <= 120) {
            validated.saturation = prefs.saturation;
        }
        
        // Validate white balance (80-120)
        if (typeof prefs.whiteBalance === 'number' && prefs.whiteBalance >= 80 && prefs.whiteBalance <= 120) {
            validated.whiteBalance = prefs.whiteBalance;
        }
        
        // Validate textureIntensity (0-100%)
        if (typeof prefs.textureIntensity === 'number' && prefs.textureIntensity >= 0 && prefs.textureIntensity <= 100) {
            validated.textureIntensity = prefs.textureIntensity;
        }
        
        return validated;
    }
    
    /**
     * Get a specific preference value
     * @param {string} key - Preference key
     * @returns {*} Preference value
     */
    get(key) {
        return this.preferences[key];
    }
    
    /**
     * Set a specific preference value and save
     * @param {string} key - Preference key
     * @param {*} value - Preference value
     */
    set(key, value) {
        console.log(`UserPreferences: Setting ${key} = ${value}`);
        this.savePreferences({ [key]: value });
    }
    
    /**
     * Get all current preferences
     * @returns {Object} All preferences
     */
    getAll() {
        return { ...this.preferences };
    }
    
    /**
     * Update multiple preferences at once
     * @param {Object} updates - Multiple preference updates
     */
    update(updates) {
        this.savePreferences(updates);
    }
    
    /**
     * Reset all preferences to defaults
     */
    reset() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            this.preferences = { ...this.defaults };
            console.log('UserPreferences: Reset to defaults');
        } catch (error) {
            console.error('UserPreferences: Failed to reset preferences:', error);
        }
    }
    
    /**
     * Check if localStorage is available
     * @returns {boolean} True if localStorage is supported
     */
    static isSupported() {
        try {
            const test = 'localStorage_test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
}

// Export singleton instance
export const userPreferences = new UserPreferences();