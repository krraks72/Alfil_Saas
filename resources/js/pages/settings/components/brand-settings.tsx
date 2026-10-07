import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ThemePreview } from '@/components/theme-preview';
import { useAppearance, type Appearance, type ThemeColor } from '@/hooks/use-appearance';
import { useLayout, type LayoutPosition } from '@/contexts/LayoutContext';
import { useSidebarSettings } from '@/contexts/SidebarContext';
import { useBrand } from '@/contexts/BrandContext';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Palette, Save, Upload, Check, Layout, Moon, FileText, Sidebar as SidebarIcon } from 'lucide-react';
import { SettingsSection } from '@/components/settings-section';
import { SidebarPreview } from '@/components/sidebar-preview';
import MediaPicker from '@/components/MediaPicker';
import { useTranslation } from 'react-i18next';
import { usePage, router } from '@inertiajs/react';
import { isDemoMode, getCookie, setCookie, getSeparateThemeCookies, saveSeparateThemeCookies } from '@/utils/cookie-utils';
import { Card } from '@/components/ui/card';

// Define the brand settings interface
export interface BrandSettings {
  logoDark: string;
  logoLight: string;
  favicon: string;
  titleText: string;
  footerText: string;
  themeColor: ThemeColor;
  customColor: string;
  sidebarVariant: string;
  sidebarStyle: string;
  layoutDirection: LayoutPosition;
  themeMode: Appearance;
}

// Default brand settings
export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  logoDark: '/images/logos/logo-dark.png',
  logoLight: '/images/logos/logo-light.png',
  favicon: '/images/logos/favicon.png',
  titleText: 'WorkDo',
  footerText: '© 2024 WorkDo. All rights reserved.',
  themeColor: 'green',
  customColor: '#10b77f',
  sidebarVariant: 'inset',
  sidebarStyle: 'plain',
  layoutDirection: 'left',
  themeMode: 'light',
};

// Get theme settings from cookies (demo mode)
export const getThemeSettingsFromCookies = (): Partial<BrandSettings> => {
  try {
    if (isDemoMode()) {
      // Use separate cookies in demo mode
      return getSeparateThemeCookies();
    }
    // Fallback to old single cookie format
    const cookieData = getCookie('pos_theme_settings');
    return cookieData ? JSON.parse(cookieData) : {};
  } catch (error) {
    return {};
  }
};

// Save theme settings to cookies (demo mode)
export const saveThemeSettingsToCookies = (themeSettings: Partial<BrandSettings>) => {
  try {
    if (isDemoMode()) {
      // Use separate cookies in demo mode
      saveSeparateThemeCookies(themeSettings);
    }
  } catch (error) {

  }
};

// Get brand settings from props or localStorage as fallback
export const getBrandSettings = (userSettings?: Record<string, string>, isDemo?: boolean): BrandSettings => {
  // If we have settings from the backend, use those
  if (userSettings) {
    const getFullUrl = (path: string, defaultPath: string) => {
      if (!path) return window.appSettings?.baseUrl + defaultPath;
      if (path.startsWith('http')) return path;
      return window.appSettings?.baseUrl + path;
    };

    const baseSettings = {
      logoDark: getFullUrl(userSettings.logoDark, DEFAULT_BRAND_SETTINGS.logoDark),
      logoLight: getFullUrl(userSettings.logoLight, DEFAULT_BRAND_SETTINGS.logoLight),
      favicon: getFullUrl(userSettings.favicon, DEFAULT_BRAND_SETTINGS.favicon),
      titleText: userSettings.titleText || DEFAULT_BRAND_SETTINGS.titleText,
      footerText: userSettings.footerText || DEFAULT_BRAND_SETTINGS.footerText,
      themeColor: (userSettings.themeColor as ThemeColor) || DEFAULT_BRAND_SETTINGS.themeColor,
      customColor: userSettings.customColor || DEFAULT_BRAND_SETTINGS.customColor,
      sidebarVariant: userSettings.sidebarVariant || DEFAULT_BRAND_SETTINGS.sidebarVariant,
      sidebarStyle: userSettings.sidebarStyle || DEFAULT_BRAND_SETTINGS.sidebarStyle,
      layoutDirection: (userSettings.layoutDirection as LayoutPosition) || DEFAULT_BRAND_SETTINGS.layoutDirection,
      themeMode: (userSettings.themeMode as Appearance) || DEFAULT_BRAND_SETTINGS.themeMode,
    };

    // In demo mode, override theme settings with cookie values
    if (isDemo) {
      const cookieThemeSettings = getThemeSettingsFromCookies();
      const finalSettings = {
        ...baseSettings,
        ...cookieThemeSettings
      };
      return finalSettings;
    }

    return baseSettings;
  }

  // Fallback to localStorage if no backend settings
  if (typeof localStorage === 'undefined') {
    return DEFAULT_BRAND_SETTINGS;
  }

  try {
    const savedSettings = localStorage.getItem('brandSettings');
    return savedSettings ? JSON.parse(savedSettings) : DEFAULT_BRAND_SETTINGS;
  } catch (error) {
    return DEFAULT_BRAND_SETTINGS;
  }
};

interface BrandSettingsProps {
  userSettings?: Record<string, string>;
}

export default function BrandSettings({ userSettings }: BrandSettingsProps) {
  const { t } = useTranslation();
  const { props } = usePage();
  const currentGlobalSettings = (props as any).globalSettings;
  const isDemo = (props as any).globalSettings?.is_demo || false;
  const [settings, setSettings] = useState<BrandSettings>(() => getBrandSettings(currentGlobalSettings || userSettings, isDemo));
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'logos' | 'text' | 'theme'>('logos');
  const [lastSaveTime, setLastSaveTime] = useState(0);

  // Get theme hooks
  const {
    updateAppearance,
    updateThemeColor,
    updateCustomColor,
    saveThemeSettings
  } = useAppearance();

  const { updatePosition, saveLayoutPosition, position } = useLayout();
  const { updateVariant, updateStyle, saveSidebarSettings } = useSidebarSettings();

  // Sync settings with current layout position
  useEffect(() => {
    setSettings(prev => ({ ...prev, layoutDirection: position }));
  }, [position]);

  // Load settings when globalSettings change (but not while saving)
  useEffect(() => {
    if (isSaving) return; // Don't reset form while saving

    const brandSettings = getBrandSettings(currentGlobalSettings || userSettings, isDemo);

    // Always update and apply settings to ensure UI sync
    setSettings(brandSettings);

    // Apply all theme settings to UI when loaded
    updateThemeColor(brandSettings.themeColor);
    if (brandSettings.themeColor === 'custom') {
      updateCustomColor(brandSettings.customColor);
    }
    updateAppearance(brandSettings.themeMode);
    updatePosition(brandSettings.layoutDirection);
    updateVariant(brandSettings.sidebarVariant as any);
    updateStyle(brandSettings.sidebarStyle);
    
    // Only update brand context with logos if they exist
    if (brandSettings.logoLight || brandSettings.logoDark || brandSettings.favicon) {
      updateBrandSettings({
        logoLight: brandSettings.logoLight,
        logoDark: brandSettings.logoDark,
        favicon: brandSettings.favicon
      });
    }
  }, [currentGlobalSettings, userSettings, isSaving, isDemo]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));

    // Update brand context if the input is for a logo
    if (['logoLight', 'logoDark', 'favicon'].includes(name)) {
      updateBrandSettings({ [name]: value });
    }
  };

  // Convert full URL to relative path for storage
  const convertToRelativePath = (url: string): string => {
    if (!url) return url;

    // If it's already a relative path, return as is
    if (!url.startsWith('http')) return url;

    // Extract the path after /storage/
    const storageIndex = url.indexOf('/storage/');
    if (storageIndex !== -1) {
      return url.substring(storageIndex);
    }

    return url;
  };

  // Convert relative path to full URL for display
  const getDisplayUrl = (path: string): string => {
    if (!path) return path;

    // If it's already a full URL, return as is
    if (path.startsWith('http')) return path;

    // Always use window.appSettings.baseUrl for relative paths
    const baseUrl = window.appSettings?.baseUrl || window.location.origin;
    
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    return `${baseUrl}/${cleanPath}`;
  };

  // Handle media picker selection
  const handleMediaSelect = (name: string, url: string) => {
    setSettings(prev => ({ ...prev, [name]: url }));
    updateBrandSettings({ [name]: url });
  };

  // Import useBrand hook
  const { updateBrandSettings } = useBrand();

  // State to track logo errors
  const [logoErrors, setLogoErrors] = useState({
    logoDark: false,
    logoLight: false,
    favicon: false
  });



  // Handle theme color change
  const handleThemeColorChange = (color: ThemeColor) => {
    setSettings(prev => ({ ...prev, themeColor: color }));
    updateThemeColor(color);
  };

  // Handle custom color change
  const handleCustomColorChange = (color: string) => {
    setSettings(prev => ({ ...prev, customColor: color }));
    updateCustomColor(color, true);
  };

  // Handle sidebar variant change
  const handleSidebarVariantChange = (variant: string) => {
    setSettings(prev => ({ ...prev, sidebarVariant: variant }));
    updateVariant(variant as any);
  };

  // Handle sidebar style change
  const handleSidebarStyleChange = (style: string) => {
    setSettings(prev => ({ ...prev, sidebarStyle: style }));
    updateStyle(style);
  };

  // Handle layout direction change
  const handleLayoutDirectionChange = (direction: LayoutPosition) => {
    setSettings(prev => ({ ...prev, layoutDirection: direction }));
    updatePosition(direction);
    
    // Trigger event for LayoutContext to listen
    window.dispatchEvent(new CustomEvent('layoutDirectionChanged', {
      detail: { direction }
    }));
  };

  // Handle theme mode change
  const handleThemeModeChange = (mode: Appearance) => {
    setSettings(prev => ({ ...prev, themeMode: mode }));
    updateAppearance(mode);
  };

  // Save settings
  const saveSettings = () => {
    // Prevent rapid successive saves (debounce)
    const now = Date.now();
    if (now - lastSaveTime < 1000) {
      return;
    }
    setLastSaveTime(now);

    setIsLoading(true);
    setIsSaving(true);

    // Update theme settings
    updateThemeColor(settings.themeColor);
    if (settings.themeColor === 'custom') {
      updateCustomColor(settings.customColor);
    }
    updateAppearance(settings.themeMode);
    updatePosition(settings.layoutDirection);

    // Update sidebar settings
    updateVariant(settings.sidebarVariant as any);
    updateStyle(settings.sidebarStyle);

    // Update brand context
    updateBrandSettings({
      logoLight: settings.logoLight,
      logoDark: settings.logoDark,
      favicon: settings.favicon
    });

    if (isDemoMode()) {
      // Demo mode: Save all theme settings to separate cookies
      const themeSettingsToSave = {
        themeColor: settings.themeColor,
        customColor: settings.customColor,
        sidebarVariant: settings.sidebarVariant,
        sidebarStyle: settings.sidebarStyle,
        layoutDirection: settings.layoutDirection,
        themeMode: settings.themeMode
      };

      saveThemeSettingsToCookies(themeSettingsToSave);
      saveThemeSettings();
      saveSidebarSettings();
      saveLayoutPosition();

      setIsLoading(false);
      setIsSaving(false);
      toast.error(t('This action is disabled in demo mode. You can only create new data, not modify existing demo data.'));
      return;
    }

    // Normal mode: Save all settings to database
    router.post(route('settings.brand.update'), {
      settings: settings
    }, {
      preserveScroll: true,
      onSuccess: (page) => {
        setIsLoading(false);
        const successMessage = page.props.flash?.success;
        const errorMessage = page.props.flash?.error;

        if (successMessage) {
          toast.success(successMessage);
          setTimeout(() => setIsSaving(false), 500);
        } else if (errorMessage) {
          toast.error(errorMessage);
        }
      },
      onError: (errors) => {
        setIsLoading(false);
        setIsSaving(false);
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to save brand settings');
        toast.error(errorMessage);
      }
    });
  };

  return (
    <SettingsSection
      title={t("Brand Settings")}
      description={t("Customize your application's branding and appearance")}
      action={
        <Button onClick={saveSettings} disabled={isLoading} size="sm">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? t('Saving...') : t('Save Changes')}
        </Button>
      }
    >
      <Card>
      <div className='p-4 sm:p-6 pt-4 sm:pt-6'>
      <div className="flex flex-col 2xl:grid 2xl:grid-cols-3 gap-6">
        <div className="w-full 2xl:col-span-2 order-1 min-w-0">
          <div className="grid grid-cols-3 sm:flex sm:flex-row gap-2 mb-6">
            <Button
              variant={activeSection === 'logos' ? "default" : "outline"}
              onClick={() => setActiveSection('logos')}
              className="flex-1 justify-center h-10 sm:h-9 whitespace-nowrap text-xs sm:text-sm"
            >
              <Upload className="h-4 w-4 mr-1.5 sm:mr-2 shrink-0" />
              <span>{t("Logos")}</span>
            </Button>
            <Button
              variant={activeSection === 'text' ? "default" : "outline"}
              onClick={() => setActiveSection('text')}
              className="flex-1 justify-center h-10 sm:h-9 whitespace-nowrap text-xs sm:text-sm"
            >
              <FileText className="h-4 w-4 mr-1.5 sm:mr-2 shrink-0" />
              <span>{t("Text")}</span>
            </Button>
            <Button
              variant={activeSection === 'theme' ? "default" : "outline"}
              onClick={() => setActiveSection('theme')}
              className="flex-1 justify-center h-10 sm:h-9 whitespace-nowrap text-xs sm:text-sm"
            >
              <Palette className="h-4 w-4 mr-1.5 sm:mr-2 shrink-0" />
              <span>{t("Theme")}</span>
            </Button>
          </div>

          {/* Logos Section */}
          {activeSection === 'logos' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 min-w-0">
                  <Label>{t("Logo (Dark)")}</Label>
                  <div className="flex flex-col gap-3">
                    <div className="border rounded-md p-4 flex items-center justify-center dark:bg-white bg-muted/30 h-32">
                      {settings.logoDark && !logoErrors.logoDark ? (
                        <img
                          key={`preview-dark-${Date.now()}`}
                          src={settings.logoDark}
                          alt="Dark Logo"
                          className="max-h-full max-w-full object-contain"
                          onError={() => setLogoErrors(prev => ({ ...prev, logoDark: true }))}
                        />
                      ) : (
                        <div className="text-muted-foreground flex flex-col items-center gap-2">
                          <div className="h-12 w-24 bg-muted flex items-center justify-center rounded border border-dashed">
                            <span className="font-semibold text-muted-foreground">{t("Logo")}</span>
                          </div>
                          <span className="text-xs">
                            {logoErrors.logoDark ? "Failed to load image" : "No logo selected"}
                          </span>
                        </div>
                      )}
                    </div>
                    <MediaPicker
                      label=""
                      value={settings.logoDark}
                      onChange={(url) => handleMediaSelect('logoDark', url)}
                      placeholder="Select dark mode logo..."
                      showPreview={false}
                    />
                  </div>
                </div>

                <div className="space-y-3 min-w-0">
                  <Label>{t("Logo (Light)")}</Label>
                  <div className="flex flex-col gap-3">
                    <div className="border rounded-md p-4 flex items-center justify-center bg-black h-32">
                      {settings.logoLight && !logoErrors.logoLight ? (
                        <img
                          key={`preview-light-${Date.now()}`}
                          src={settings.logoLight}
                          alt="Light Logo"
                          className="max-h-full max-w-full object-contain"
                          onError={() => setLogoErrors(prev => ({ ...prev, logoLight: true }))}
                        />
                      ) : (
                        <div className="text-muted-foreground flex flex-col items-center gap-2">
                          <div className="h-12 w-24 bg-muted flex items-center justify-center rounded border border-dashed">
                            <span className="font-semibold text-muted-foreground">{t("Logo")}</span>
                          </div>
                          <span className="text-xs">
                            {logoErrors.logoLight ? "Failed to load image" : "No logo selected"}
                          </span>
                        </div>
                      )}
                    </div>
                    <MediaPicker
                      label=""
                      value={settings.logoLight}
                      onChange={(url) => handleMediaSelect('logoLight', url)}
                      placeholder="Select light mode logo..."
                      showPreview={false}
                    />
                  </div>
                </div>

                <div className="space-y-3 min-w-0 sm:col-span-2">
                  <Label>{t("Favicon")}</Label>
                  <div className="flex flex-col gap-3">
                    <div className="border rounded-md p-4 flex items-center justify-center h-20">
                      {settings.favicon && !logoErrors.favicon ? (
                        <img
                          key={`preview-favicon-${Date.now()}`}
                          src={settings.favicon}
                          alt="Favicon"
                          className="h-16 w-16 object-contain"
                          onError={() => setLogoErrors(prev => ({ ...prev, favicon: true }))}
                        />
                      ) : (
                        <div className="text-muted-foreground flex flex-col items-center gap-1">
                          <div className="h-10 w-10 bg-muted flex items-center justify-center rounded border border-dashed">
                            <span className="font-semibold text-xs text-muted-foreground">{t("Icon")}</span>
                          </div>
                          <span className="text-xs">
                            {logoErrors.favicon ? "Failed to load image" : "No favicon selected"}
                          </span>
                        </div>
                      )}
                    </div>
                    <MediaPicker
                      label=""
                      value={settings.favicon}
                      onChange={(url) => handleMediaSelect('favicon', url)}
                      placeholder="Select favicon..."
                      showPreview={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Text Section */}
          {activeSection === 'text' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3 min-w-0">
                  <Label required htmlFor="titleText">{t("Title Text")}</Label>
                  <Input
                    required
                    id="titleText"
                    name="titleText"
                    value={settings.titleText}
                    onChange={handleInputChange}
                    placeholder="WorkDo"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("Application title displayed in the browser tab")}
                  </p>
                </div>

                <div className="space-y-3 min-w-0">
                  <Label required htmlFor="footerText">{t("Footer Text")}</Label>
                  <Input
                    id="footerText"
                    name="footerText"
                    value={settings.footerText}
                    onChange={handleInputChange}
                    placeholder="© 2024 WorkDo. All rights reserved."
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("Text displayed in the footer")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Theme Section */}
          {activeSection === 'theme' && (
            <div className="space-y-6 min-w-0">
              <div className="flex flex-col space-y-8">
                {/* Theme Color Section */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Palette className="h-5 w-5 mr-2 text-muted-foreground shrink-0" />
                    <h3 className="text-base font-medium">{t("Theme Color")}</h3>
                  </div>
                  <Separator className="my-2" />

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {Object.entries({ blue: '#3b82f6', green: '#10b77f', purple: '#8b5cf6', orange: '#f97316', red: '#ef4444' }).map(([color, hex]) => (
                      <Button
                        key={color}
                        type="button"
                        variant={settings.themeColor === color ? "default" : "outline"}
                        className="h-8 w-full p-0 relative"
                        style={{ backgroundColor: settings.themeColor === color ? hex : 'transparent' }}
                        onClick={() => handleThemeColorChange(color as ThemeColor)}
                      >
                        <span
                          className="absolute inset-1 rounded-sm"
                          style={{ backgroundColor: hex }}
                        />
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant={settings.themeColor === 'custom' ? "default" : "outline"}
                      className="h-8 w-full p-0 relative"
                      style={{ backgroundColor: settings.themeColor === 'custom' ? settings.customColor : 'transparent' }}
                      onClick={() => handleThemeColorChange('custom')}
                    >
                      <span
                        className="absolute inset-1 rounded-sm"
                        style={{ backgroundColor: settings.customColor }}
                      />
                    </Button>
                  </div>

                  {settings.themeColor === 'custom' && (
                    <div className="space-y-2 mt-4 min-w-0">
                      <Label htmlFor="customColor">{t("Custom Color")}</Label>
                      <div className="flex gap-2">
                        <div className="relative shrink-0">
                          <Input
                            id="colorPicker"
                            type="color"
                            value={settings.customColor}
                            onChange={(e) => handleCustomColorChange(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <div
                            className="w-10 h-10 rounded border cursor-pointer"
                            style={{ backgroundColor: settings.customColor }}
                          />
                        </div>
                        <Input
                          id="customColor"
                          name="customColor"
                          type="text"
                          value={settings.customColor}
                          onChange={(e) => handleCustomColorChange(e.target.value)}
                          placeholder="#10b77f"
                          className="min-w-0 flex-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Section */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <SidebarIcon className="h-5 w-5 mr-2 text-muted-foreground shrink-0" />
                    <h3 className="text-base font-medium">{t("Sidebar")}</h3>
                  </div>
                  <Separator className="my-2" />

                  <div className="space-y-6">
                    <div>
                      <Label className="mb-2 block">{t("Sidebar Variant")}</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {['inset', 'floating', 'minimal'].map((variant) => (
                          <Button
                            key={variant}
                            type="button"
                            variant={settings.sidebarVariant === variant ? "default" : "outline"}
                            className="h-10 justify-between whitespace-nowrap min-w-0"
                            style={{
                              backgroundColor: settings.sidebarVariant === variant ?
                                (settings.themeColor === 'custom' ? settings.customColor : null) :
                                'transparent'
                            }}
                            onClick={() => handleSidebarVariantChange(variant)}
                          >
                            <span className="truncate">{variant.charAt(0).toUpperCase() + variant.slice(1)}</span>
                            {settings.sidebarVariant === variant && (
                              <Check className="h-4 w-4 ml-2 shrink-0" />
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block">{t("Sidebar Style")}</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'plain', name: 'Plain' },
                          { id: 'colored', name: 'Colored' },
                          { id: 'gradient', name: 'Gradient' }
                        ].map((style) => (
                          <Button
                            key={style.id}
                            type="button"
                            variant={settings.sidebarStyle === style.id ? "default" : "outline"}
                            className="h-10 justify-between whitespace-nowrap min-w-0"
                            style={{
                              backgroundColor: settings.sidebarStyle === style.id ?
                                (settings.themeColor === 'custom' ? settings.customColor : null) :
                                'transparent'
                            }}
                            onClick={() => handleSidebarStyleChange(style.id)}
                          >
                            <span className="truncate">{style.name}</span>
                            {settings.sidebarStyle === style.id && (
                              <Check className="h-4 w-4 ml-2 shrink-0" />
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Layout Section */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Layout className="h-5 w-5 mr-2 text-muted-foreground shrink-0" />
                    <h3 className="text-base font-medium">{t("Layout")}</h3>
                  </div>
                  <Separator className="my-2" />

                  <div className="space-y-2">
                    <Label className="mb-2 block">{t("Layout Direction")}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={settings.layoutDirection === "left" ? "default" : "outline"}
                        className="h-10 justify-between whitespace-nowrap min-w-0"
                        style={{
                          backgroundColor: settings.layoutDirection === "left" ?
                            (settings.themeColor === 'custom' ? settings.customColor : null) :
                            'transparent'
                        }}
                        onClick={() => handleLayoutDirectionChange("left")}
                      >
                        <span className="truncate">{t("Left-to-Right")}</span>
                        {settings.layoutDirection === "left" && (
                          <Check className="h-4 w-4 ml-2 shrink-0" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant={settings.layoutDirection === "right" ? "default" : "outline"}
                        className="h-10 justify-between whitespace-nowrap min-w-0"
                        style={{
                          backgroundColor: settings.layoutDirection === "right" ?
                            (settings.themeColor === 'custom' ? settings.customColor : null) :
                            'transparent'
                        }}
                        onClick={() => handleLayoutDirectionChange("right")}
                      >
                        <span className="truncate">{t("Right-to-Left")}</span>
                        {settings.layoutDirection === "right" && (
                          <Check className="h-4 w-4 ml-2 shrink-0" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Mode Section */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Moon className="h-5 w-5 mr-2 text-muted-foreground shrink-0" />
                    <h3 className="text-base font-medium">{t("Theme Mode")}</h3>
                  </div>
                  <Separator className="my-2" />

                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={settings.themeMode === "light" ? "default" : "outline"}
                        className="h-10 justify-between whitespace-nowrap min-w-0"
                        style={{
                          backgroundColor: settings.themeMode === "light" ?
                            (settings.themeColor === 'custom' ? settings.customColor : null) :
                            'transparent'
                        }}
                        onClick={() => handleThemeModeChange("light")}
                      >
                        <span className="truncate">{t("Light")}</span>
                        {settings.themeMode === "light" && (
                          <Check className="h-4 w-4 ml-2 shrink-0" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant={settings.themeMode === "dark" ? "default" : "outline"}
                        className="h-10 justify-between whitespace-nowrap min-w-0"
                        style={{
                          backgroundColor: settings.themeMode === "dark" ?
                            (settings.themeColor === 'custom' ? settings.customColor : null) :
                            'transparent'
                        }}
                        onClick={() => handleThemeModeChange("dark")}
                      >
                        <span className="truncate">{t("Dark")}</span>
                        {settings.themeMode === "dark" && (
                          <Check className="h-4 w-4 ml-2 shrink-0" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant={settings.themeMode === "system" ? "default" : "outline"}
                        className="h-10 justify-between whitespace-nowrap min-w-0"
                        style={{
                          backgroundColor: settings.themeMode === "system" ?
                            (settings.themeColor === 'custom' ? settings.customColor : null) :
                            'transparent'
                        }}
                        onClick={() => handleThemeModeChange("system")}
                      >
                        <span className="truncate">{t("System")}</span>
                        {settings.themeMode === "system" && (
                          <Check className="h-4 w-4 ml-2 shrink-0" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview Column */}
        <div className="w-full 2xl:col-span-1 order-2 min-w-0">
          <div className="sticky top-20 space-y-6">
            <div className="border rounded-md p-4">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="h-4 w-4 shrink-0" />
                <h3 className="font-medium">{t("Live Preview")}</h3>
              </div>

              {/* Comprehensive Theme Preview */}
              <ThemePreview />

              {/* Text Preview */}
              <div className="mt-4 pt-4 border-t">
                <div className="text-xs mb-2 text-muted-foreground">{t("Title:")} <span className="font-medium text-foreground break-all">{settings.titleText}</span></div>
                <div className="text-xs text-muted-foreground">{t("Footer:")} <span className="font-medium text-foreground break-all">{settings.footerText}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      </Card>
    </SettingsSection>
  );
}
