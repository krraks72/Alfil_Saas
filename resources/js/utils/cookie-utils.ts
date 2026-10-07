/**
 * Cookie utility functions for managing theme settings in demo mode
 */

export const setCookie = (name: string, value: string, days = 365) => {
  if (typeof document === 'undefined') {
    return;
  }

  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
};

export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
};

/**
 * Check if the application is running in demo mode
 */
export const isDemoMode = (): boolean => {
  const globalSettings = (window as any).page?.props?.globalSettings;
  if (globalSettings?.is_demo !== undefined) {
    return globalSettings.is_demo === true || globalSettings.is_demo === '1';
  }
  
  return false;
};

/**
 * Save theme settings using separate cookies in demo mode
 * Uses exact cookie names and JSON structures as specified
 */
export const saveSeparateThemeCookies = (settings: {
  themeColor?: string;
  customColor?: string;
  sidebarVariant?: string;
  sidebarStyle?: string;
  layoutDirection?: string;
  themeMode?: string;
}) => {
  if (!isDemoMode()) return;

  // layoutDirection: primitive value (left/right)
  if (settings.layoutDirection) {
    setCookie('layoutDirection', settings.layoutDirection);
  }

  // layoutPosition: primitive value (left/right)
  if (settings.layoutDirection) {
    setCookie('layoutPosition', settings.layoutDirection);
  }

  // sidebarSettings: JSON string
  if (settings.sidebarVariant || settings.sidebarStyle) {
    const existing = getSeparateThemeCookies();
    const sidebarSettings = {
      variant: settings.sidebarVariant || existing.sidebarVariant || 'inset',
      collapsible: 'icon', // Fixed value as per requirement
      style: settings.sidebarStyle || existing.sidebarStyle || 'plain'
    };
    setCookie('sidebarSettings', JSON.stringify(sidebarSettings));
  }

  // themeSettings: JSON string
  if (settings.themeMode || settings.themeColor || settings.customColor) {
    const existing = getSeparateThemeCookies();
    const themeSettings = {
      appearance: settings.themeMode || existing.themeMode || 'light',
      themeColor: settings.themeColor || existing.themeColor || 'green',
      customColor: settings.customColor || existing.customColor || '#10b77f'
    };
    setCookie('themeSettings', JSON.stringify(themeSettings));
  }
};

/**
 * Get theme settings from separate cookies in demo mode
 * Falls back to old single cookie format for backward compatibility
 */
export const getSeparateThemeCookies = () => {
  if (!isDemoMode()) return {};

  try {
    // Try to read from separate cookies first
    const layoutDirection = getCookie('layoutDirection');
    const layoutPosition = getCookie('layoutPosition');
    const sidebarSettingsStr = getCookie('sidebarSettings');
    const themeSettingsStr = getCookie('themeSettings');

    let result: any = {};

    // Parse layout settings
    if (layoutDirection) {
      result.layoutDirection = layoutDirection;
    } else if (layoutPosition) {
      result.layoutDirection = layoutPosition;
    }

    // Parse sidebar settings
    if (sidebarSettingsStr) {
      const sidebarSettings = JSON.parse(sidebarSettingsStr);
      result.sidebarVariant = sidebarSettings.variant;
      result.sidebarStyle = sidebarSettings.style;
    }

    // Parse theme settings
    if (themeSettingsStr) {
      const themeSettings = JSON.parse(themeSettingsStr);
      result.themeMode = themeSettings.appearance;
      result.themeColor = themeSettings.themeColor;
      result.customColor = themeSettings.customColor;
    }

    // If we have any separate cookie data, return it
    if (Object.keys(result).length > 0) {
      return result;
    }

    // Fallback to old single cookie format
    const oldCookie = getCookie('pos_theme_settings');
    if (oldCookie) {
      return JSON.parse(oldCookie);
    }

    return {};
  } catch (error) {
    return {};
  }
};

/**
 * Migrate from old single cookie to new separate cookies format
 * Only runs in demo mode
 */
export const migrateToCookieSeparation = () => {
  if (!isDemoMode()) return;

  try {
    const oldCookie = getCookie('pos_theme_settings');
    if (!oldCookie) return;

    const oldSettings = JSON.parse(oldCookie);
    
    // Check if separate cookies already exist
    const hasNewCookies = getCookie('themeSettings') || getCookie('sidebarSettings');
    if (hasNewCookies) return; // Already migrated

    // Migrate to separate cookies
    saveSeparateThemeCookies(oldSettings);
  } catch (error) {
  }
};