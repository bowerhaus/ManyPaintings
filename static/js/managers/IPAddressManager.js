export class IPAddressManager {
    constructor() {
        this.ipAddressElement = null;
        this.updateInterval = null;
        this.init();
    }

    async init() {
        console.log('IPAddressManager: Initializing...');
        try {
            const response = await fetch('/api/ip-address');
            if (response.ok) {
                const data = await response.json();
                this.createIPAddressDisplay(data.ip_address);
                this.startUpdates();
                console.log('IPAddressManager: Initialization complete');
            } else {
                console.warn('IPAddressManager: Could not fetch IP address.');
            }
        } catch (error) {
            console.error('IPAddressManager: Error during initialization:', error);
        }
    }

    createIPAddressDisplay(ipAddress) {
        // Create IP address display element
        this.ipAddressElement = document.createElement('div');
        this.ipAddressElement.id = 'ip-address';
        this.ipAddressElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
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
        this.ipAddressElement.textContent = ipAddress;
        document.body.appendChild(this.ipAddressElement);
    }

    async updateIPAddress() {
        if (!this.ipAddressElement) return;

        try {
            const response = await fetch('/api/ip-address');
            if (response.ok) {
                const data = await response.json();
                this.ipAddressElement.textContent = data.ip_address;
            }
        } catch (error) {
            console.warn('Failed to update IP address:', error);
        }
    }

    startUpdates() {
        // Update every 30 seconds, as IP addresses don't change often
        this.updateInterval = setInterval(() => {
            this.updateIPAddress();
        }, 30000);
    }

    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    destroy() {
        this.stopUpdates();
        if (this.ipAddressElement && this.ipAddressElement.parentNode) {
            this.ipAddressElement.parentNode.removeChild(this.ipAddressElement);
        }
        this.ipAddressElement = null;
    }
}