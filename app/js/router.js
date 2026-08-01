export default class Router {
    constructor(store) {
        this.store = store;
        this.routes = {};
        this.currentRoute = null;
        this.viewContainer = document.getElementById('view-container');
        this.pageTitle = document.getElementById('page-title');
    }

    register(path, viewObj) {
        this.routes[path] = viewObj;
    }

    init() {
        // Handle navigation clicks
        document.body.addEventListener('click', e => {
            if (e.target.matches('.nav-link')) {
                e.preventDefault();
                this.navigate(e.target.getAttribute('data-route'));
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.navigate(window.location.pathname, false);
        });

        // Initial load
        this.navigate(window.location.pathname, false);
    }

    async navigate(path, pushState = true) {
        const route = this.routes[path] ? path : '/';
        const view = this.routes[route];

        if (!view) return;

        this.currentRoute = route;

        if (pushState && window.location.pathname !== route) {
            window.history.pushState(null, null, route);
        }

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-route') === route);
        });

        // Update page title based on nav link text
        const activeLink = document.querySelector(`.nav-link[data-route="${route}"]`);
        if (activeLink) {
            this.pageTitle.textContent = activeLink.textContent;
        }

        // Render view
        this.viewContainer.innerHTML = await view.render(this.store);
        
        // Mount view logic (event listeners, charts, etc)
        if (typeof view.mount === 'function') {
            view.mount(this.store);
        }
    }
}
