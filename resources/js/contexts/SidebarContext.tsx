import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getSidebarSettings, SidebarSettings } from '@/components/sidebar-style-settings';
import { setCookie, getCookie, isDemoMode, getSeparateThemeCookies, saveSeparateThemeCookies } from '@/utils/cookie-utils';

type SidebarContextType = {
  variant: SidebarSettings['variant'];
  collapsible: SidebarSettings['collapsible'];
  style: string;
  updateVariant: (variant: SidebarSettings['variant']) => void;
  updateCollapsible: (collapsible: SidebarSettings['collapsible']) => void;
  updateStyle: (style: string) => void;
  saveSidebarSettings: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Extended sidebar settings with style
interface ExtendedSidebarSettings extends SidebarSettings {
  style: string;
}

// Default sidebar settings with style
const DEFAULT_EXTENDED_SETTINGS: ExtendedSidebarSettings = {
  variant: 'inset',
  collapsible: 'icon',
  style: 'plain'
};

// Get extended sidebar settings from cookies (demo mode) or database (non-demo mode)
const getExtendedSidebarSettings = (): ExtendedSidebarSettings => {
  // In non-demo mode, get from database via global settings
  const globalSettings = (window as any).page?.props?.globalSettings;
  let baseSettings = DEFAULT_EXTENDED_SETTINGS;
  
  if (globalSettings) {
    baseSettings = {
      variant: globalSettings.sidebarVariant || DEFAULT_EXTENDED_SETTINGS.variant,
      collapsible: DEFAULT_EXTENDED_SETTINGS.collapsible,
      style: globalSettings.sidebarStyle || DEFAULT_EXTENDED_SETTINGS.style
    };
  }

  // Override with cookie settings in demo mode
  if (isDemoMode()) {
    try {
      const separateSettings = getSeparateThemeCookies();
      if (Object.keys(separateSettings).length > 0) {
        return {
          variant: separateSettings.sidebarVariant || baseSettings.variant,
          collapsible: baseSettings.collapsible,
          style: separateSettings.sidebarStyle || baseSettings.style
        };
      }
    } catch (error) {
      // Fall through to base settings
    }
  }

  return baseSettings;
};

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<ExtendedSidebarSettings>(() => getExtendedSidebarSettings());

  // Update variant
  const updateVariant = (variant: SidebarSettings['variant']) => {
    setSettings(prev => ({ ...prev, variant }));
  };

  // Update collapsible
  const updateCollapsible = (collapsible: SidebarSettings['collapsible']) => {
    setSettings(prev => ({ ...prev, collapsible }));
  };

  // Update style
  const updateStyle = (style: string) => {
    setSettings(prev => ({ ...prev, style }));
  };

  // Save sidebar settings to cookies (demo mode only)
  const saveSidebarSettings = () => {
    if (isDemoMode()) {
      saveSeparateThemeCookies({
        sidebarVariant: settings.variant,
        sidebarStyle: settings.style
      });
    }
  };

  useEffect(() => {
    // Reload settings when global settings change
    const newSettings = getExtendedSidebarSettings();
    const settingsChanged = JSON.stringify(settings) !== JSON.stringify(newSettings);
    if (settingsChanged) {
      setSettings(newSettings);
    }
  }, [(window as any).page?.props?.globalSettings]);

  // Initialize from cookies on mount
  useEffect(() => {
    const initialSettings = getExtendedSidebarSettings();
    setSettings(initialSettings);
  }, []);

  return (
    <SidebarContext.Provider value={{ 
      variant: settings.variant, 
      collapsible: settings.collapsible,
      style: settings.style,
      updateVariant,
      updateCollapsible,
      updateStyle,
      saveSidebarSettings
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarSettings = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebarSettings must be used within SidebarProvider');
  return context;
};