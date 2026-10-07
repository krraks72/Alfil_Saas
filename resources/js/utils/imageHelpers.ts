/**
 * Convert relative image path to full URL
 * @param relativePath - The relative path stored in database (e.g., "storage/media/9/iPhone-15.png")
 * @returns Full URL for the image
 */
export function getImageUrl(relativePath: string | null | undefined): string {
  if (!relativePath) {
    return '';
  }

  // If it's already a full URL, return as is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  // Get the base URL from Laravel (set in app.blade.php)
  const baseUrl = (window as any).baseUrl || window.location.origin;
  
  // Ensure the path starts with a slash
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  const finalUrl = `${baseUrl}${path}`;
  
  return finalUrl;
}

/**
 * Get image URL with fallback
 * @param relativePath - The relative path stored in database
 * @param fallback - Fallback URL if the main path is empty
 * @returns Full URL for the image or fallback
 */
export function getImageUrlWithFallback(relativePath: string | null | undefined, fallback: string = ''): string {
  if (!relativePath) {
    return fallback;
  }
  
  return getImageUrl(relativePath);
}