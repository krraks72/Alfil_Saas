// Global image URL helper
export function getFullImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
        return path;
    }
    
    const baseUrl = window.appSettings?.imageUrl || '';
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return baseUrl + cleanPath;
}

// Auto-fix all images on page load
export function fixAllImageUrls() {
    const images = document.querySelectorAll('img[src^="/storage"]');
    images.forEach((img: HTMLImageElement) => {
        const src = img.getAttribute('src');
        if (src && src.startsWith('/storage')) {
            img.src = getFullImageUrl(src);
        }
    });
}

// Set up automatic image fixing
if (typeof window !== 'undefined') {
    // Fix images when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixAllImageUrls);
    } else {
        fixAllImageUrls();
    }
    
    // Fix images when new content is added
    const observer = new MutationObserver(() => {
        fixAllImageUrls();
    });
    
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }
}