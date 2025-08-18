export default class ConfigManager {
  constructor() {
    this.config = window.APP_CONFIG || {};
    this.lastConfigString = JSON.stringify(this.config);
    this.pollInterval = null;
    this.listeners = new Set();
  }

  getConfig() {
    return this.config;
  }

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(changes) {
    this.listeners.forEach(callback => {
      try {
        callback(this.config, changes);
      } catch (error) {
        console.error('Error in config listener:', error);
      }
    });
  }

  detectChanges(oldConfig, newConfig) {
    const changes = {};
    
    const checkObject = (oldObj, newObj, path = '') => {
      Object.keys(newObj).forEach(key => {
        const fullPath = path ? `${path}.${key}` : key;
        
        if (typeof newObj[key] === 'object' && newObj[key] !== null && !Array.isArray(newObj[key])) {
          if (!oldObj[key] || typeof oldObj[key] !== 'object') {
            changes[fullPath] = { old: oldObj[key], new: newObj[key] };
          } else {
            checkObject(oldObj[key], newObj[key], fullPath);
          }
        } else if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
          changes[fullPath] = { old: oldObj[key], new: newObj[key] };
        }
      });
    };
    
    checkObject(oldConfig, newConfig);
    return changes;
  }

  async checkForConfigChanges() {
    try {
      const response = await fetch('/api/config', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch config:', response.status);
        return;
      }
      
      const newConfig = await response.json();
      const newConfigString = JSON.stringify(newConfig);
      
      if (newConfigString !== this.lastConfigString) {
        const changes = this.detectChanges(this.config, newConfig);
        
        if (Object.keys(changes).length > 0) {
          console.log('Config changed, detected changes:', changes);
          
          // Update the stored config
          this.config = newConfig;
          window.APP_CONFIG = newConfig;
          this.lastConfigString = newConfigString;
          
          // Notify all listeners
          this.notifyListeners(changes);
        }
      }
    } catch (error) {
      console.error('Error checking for config changes:', error);
    }
  }

  startPolling(intervalMs = 2000) {
    if (this.pollInterval) {
      return;
    }
    
    console.log(`ConfigManager: Starting config polling every ${intervalMs}ms`);
    
    // Check immediately
    this.checkForConfigChanges();
    
    // Then poll at intervals
    this.pollInterval = setInterval(() => {
      this.checkForConfigChanges();
    }, intervalMs);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('ConfigManager: Stopped config polling');
    }
  }
}