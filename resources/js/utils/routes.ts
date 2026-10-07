// Route helper function for Laravel routes
// This file ensures the route() function is available globally

declare global {
    interface Window {
        route: (name: string, params?: any) => string;
    }
}

// Make route function available globally if it exists
if (typeof window !== 'undefined' && window.route) {
    // Route function is already available via @routes directive in blade template
    // This file just ensures TypeScript knows about it
}

// Export route function for use in modules
export const route = (name: string, params?: any): string => {
    if (typeof window !== 'undefined' && window.route) {
        return window.route(name, params);
    }
    
    // Fallback for SSR or when route function is not available
    return '#';
};

export default route;