export class CPUTemperatureManager {
    constructor() {
        this.temperatureElement = null;
        this.updateInterval = null;
        this.isEnabled = false;
        
        this.init();
    }
    
    init() {
        console.log('CPUTemperatureManager: Initializing...');
        // Check if we're on Raspberry Pi by trying to fetch temperature
        this.checkRPiAvailability().then(isRPi => {
            console.log('CPUTemperatureManager: RPi availability check result:', isRPi);
            if (isRPi) {
                console.log('CPUTemperatureManager: Creating temperature display...');
                this.createTemperatureDisplay();
                this.startUpdates();
                this.isEnabled = true;
                console.log('CPUTemperatureManager: Initialization complete');
            } else {
                console.log('CPUTemperatureManager: Not on Raspberry Pi, skipping temperature display');
            }
        }).catch(error => {
            console.error('CPUTemperatureManager: Error during initialization:', error);
        });
    }
    
    async checkRPiAvailability() {
        try {
            console.log('CPUTemperatureManager: Checking RPi availability...');
            const response = await fetch('/api/cpu-temperature');
            console.log('CPUTemperatureManager: API response status:', response.status);
            return response.ok;
        } catch (error) {
            console.error('CPUTemperatureManager: Error checking RPi availability:', error);
            return false;
        }
    }
    
    createTemperatureDisplay() {
        // Create temperature display element
        this.temperatureElement = document.createElement('div');
        this.temperatureElement.id = 'cpu-temperature';
        this.temperatureElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            color: rgba(255, 255, 255, 0.8);
            font-family: 'Courier New', monospace;
            font-size: 12px;
            font-weight: bold;
            background: transparent;
            padding: 4px 6px;
            z-index: 1000;
            pointer-events: none;
            user-select: none;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        `;
        
        document.body.appendChild(this.temperatureElement);
    }
    
    async updateTemperature() {
        if (!this.temperatureElement) return;
        
        try {
            const response = await fetch('/api/cpu-temperature');
            if (response.ok) {
                const data = await response.json();
                this.temperatureElement.textContent = `${data.temperature}°${data.unit}`;
                
                // Change color based on temperature
                const temp = data.temperature;
                let color = 'rgba(255, 255, 255, 0.8)'; // Normal
                
                if (temp > 70) {
                    color = 'rgba(255, 100, 100, 0.9)'; // Hot - red
                } else if (temp > 60) {
                    color = 'rgba(255, 200, 100, 0.9)'; // Warm - orange
                } else if (temp < 40) {
                    color = 'rgba(100, 150, 255, 0.9)'; // Cool - blue
                }
                
                this.temperatureElement.style.color = color;
            }
        } catch (error) {
            console.warn('Failed to update CPU temperature:', error);
        }
    }
    
    startUpdates() {
        // Update immediately
        this.updateTemperature();
        
        // Update every 5 seconds
        this.updateInterval = setInterval(() => {
            this.updateTemperature();
        }, 5000);
    }
    
    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    destroy() {
        this.stopUpdates();
        if (this.temperatureElement && this.temperatureElement.parentNode) {
            this.temperatureElement.parentNode.removeChild(this.temperatureElement);
        }
        this.temperatureElement = null;
        this.isEnabled = false;
    }
}