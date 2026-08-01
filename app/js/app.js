import Router from './router.js';
import Store from './store.js';
import DashboardView from './views/dashboard.js';

class App {
    constructor() {
        this.store = new Store();
        this.router = new Router(this.store);
        this.init();
    }

    async init() {
        console.log("FalconZ V1 Initializing...");
        
        // Initialize Store (load from backend / local cache)
        await this.store.init();

        // Listen for store changes to update global UI
        window.addEventListener('store-updated', () => {
            this.updateActiveDroneSelector();
            // Re-render current view if necessary
            if (this.router.currentRoute) {
                this.router.navigate(this.router.currentRoute, false);
            }
        });

        // Register Views with Router
        this.router.register('/', DashboardView);
        
        // Load dynamically the views
        import('./views/drones.js').then(module => {
            this.router.register('/drones', module.default);
        }).catch(err => console.error("Failed to load drones view", err));

        import('./views/falcon-ai.js').then(module => {
            this.router.register('/falcon-ai', module.default);
        }).catch(err => console.error("Failed to load falcon-ai view", err));
        
        import('./views/flight-log-analyzer.js').then(module => {
            this.router.register('/flight-logs', module.default);
        }).catch(err => console.error("Failed to load flight-log view", err));
        
        import('./views/calibration.js').then(module => {
            this.router.register('/calibration', module.default);
        }).catch(err => console.error("Failed to load calibration view", err));
        
        import('./views/pid-tuning.js').then(module => {
            this.router.register('/pid-tuning', module.default);
        }).catch(err => console.error("Failed to load pid-tuning view", err));
        
        import('./views/gps-telemetry.js').then(module => {
            this.router.register('/gps-telemetry', module.default);
        }).catch(err => console.error("Failed to load gps-telemetry view", err));

        import('./views/environmental-mission.js').then(module => {
            this.router.register('/environmental-mission', module.default);
        }).catch(err => console.error("Failed to load environmental-mission view", err));
        
        // Initialize Router
        this.router.init();
        
        // Update global UI elements
        this.updateActiveDroneSelector();
        
        // Bind drone selector change event
        document.getElementById('drone-select').addEventListener('change', (e) => {
            if (e.target.value) {
                this.store.setActiveDrone(e.target.value);
            }
        });
    }

    updateActiveDroneSelector() {
        const select = document.getElementById('drone-select');
        const activeDroneId = this.store.state.activeDroneId;
        const drones = this.store.getDrones();
        
        if (drones.length === 0) {
            select.innerHTML = '<option value="">No drone configured</option>';
            select.disabled = true;
        } else {
            select.disabled = false;
            select.innerHTML = drones.map(d => 
                `<option value="${d.id}" ${d.id === activeDroneId ? 'selected' : ''}>${d.name}</option>`
            ).join('');
        }
    }
}

// Bootstrap application
document.addEventListener('DOMContentLoaded', () => {
    window.falconApp = new App();
});
