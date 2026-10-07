import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isUserRegistrationEnabled } from '@/utils/helpers';

interface HeroSectionProps {
  brandColor?: string;
  settings: any;
  sectionData: {
    title?: string;
    subtitle?: string;
    announcement_text?: string;
    primary_button_text?: string;
    secondary_button_text?: string;
    image?: string;
    image_position?: string;
    background_color?: string;
    text_color?: string;
    overlay?: boolean;
    overlay_color?: string;
    layout?: string;
    height?: number;
    stats?: Array<{value: string; label: string}>;
    card?: {
      name: string;
      title: string;
      company: string;
      initials: string;
    };
  };
}

export default function HeroSection({ settings, sectionData, brandColor = '#3b82f6' }: HeroSectionProps) {
  const { t } = useTranslation();
  const { globalSettings, is_demo } = usePage().props as any;
  
  const getThemeMode = () => {
    if (is_demo) {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
          const cookieValue = parts.pop()?.split(';').shift();
          return cookieValue ? decodeURIComponent(cookieValue) : null;
        }
        return null;
      };
      
      const themeSettingsCookie = getCookie('themeSettings');
      if (themeSettingsCookie) {
        try {
          const themeSettings = JSON.parse(themeSettingsCookie);
          if (themeSettings.appearance) {
            return themeSettings.appearance;
          }
        } catch (e) {
          // Silent error handling
        }
      }
    }
    return globalSettings?.themeMode || 'light';
  };

  const [themeMode, setThemeMode] = React.useState(getThemeMode);
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const isDark = themeMode === 'dark';

  React.useEffect(() => {
    if (is_demo) {
      const handleThemeChange = () => {
        const newTheme = getThemeMode();
        if (newTheme !== themeMode) {
          setThemeMode(newTheme);
        }
      };
      const interval = setInterval(handleThemeChange, 100);
      return () => clearInterval(interval);
    }
  }, [is_demo, themeMode]);
  
  // Helper to get full URL for images
  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return `${window.appSettings.imageUrl}${cleanPath}`;
  };

  const heroImage = getImageUrl(sectionData.image);

  const backgroundColor = sectionData.background_color || '#f8fafc';
  const textColor = sectionData.text_color || (isDark ? '#ffffff' : '#1f2937');
  const subtitleColor = sectionData.text_color
    ? sectionData.text_color + 'cc'
    : (isDark ? '#d1d5db' : '#4b5563');
  const layout = sectionData.layout || 'image-right';
  const sectionHeight = sectionData.height ? `${sectionData.height}px` : undefined;
  const imagePosition = sectionData.image_position || 'right';
  const hasOverlay = sectionData.overlay && heroImage && imagePosition === 'background';
  const overlayColor = sectionData.overlay_color || 'rgba(0,0,0,0.5)';

  // Determine grid column order based on layout/image_position
  const isImageLeft = layout === 'image-left' || imagePosition === 'left';
  const isCentered = layout === 'centered';
  const isFullWidth = layout === 'full-width';
  const isBackground = imagePosition === 'background';

  const sectionStyle: React.CSSProperties = {
    backgroundColor: isBackground && heroImage ? undefined : backgroundColor,
    minHeight: sectionHeight || '100vh',
    backgroundImage: isBackground && heroImage ? `url(${heroImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
  };

  const contentBlock = (
    <div className={`space-y-6 sm:space-y-8 ${isCentered || isFullWidth ? 'text-center' : 'text-center lg:text-left'}`}>
      {sectionData.announcement_text && (
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}
          style={{ color: textColor }}>
          {sectionData.announcement_text}
        </div>
      )}

      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight" style={{ color: textColor }} role="banner" aria-label="Main heading">
        {sectionData.title || t('POS Purchase and Sales Management Tool')}
      </h1>

      <p className="text-lg md:text-xl leading-relaxed max-w-2xl font-medium" style={{ color: subtitleColor }}>
        {sectionData.subtitle || t('Transform your retail operations with our comprehensive point-of-sale system.')}
      </p>

      <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 ${isCentered || isFullWidth ? 'justify-center' : 'justify-center lg:justify-start'}`}>
        {isUserRegistrationEnabled() && (
          <Link
            href={route('register')}
            className="px-8 py-4 rounded-lg transition-all font-semibold text-base flex items-center justify-center gap-2 border"
            style={{ backgroundColor: brandColor, color: 'white', borderColor: brandColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = brandColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = brandColor;
              e.currentTarget.style.color = 'white';
            }}
            aria-label="Start free trial - Register for POS System"
          >
            {sectionData.primary_button_text || t('Start Free Trial')}
            <ArrowRight size={18} />
          </Link>
        )}
        <Link
          href={route('login')}
          className={`border px-8 py-4 rounded-lg transition-colors font-semibold text-base flex items-center justify-center gap-2 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
          style={{ borderColor: brandColor, color: brandColor }}
          aria-label="Login to existing POS account"
        >
          <Play size={18} />
          {sectionData.secondary_button_text || t('Login')}
        </Link>
      </div>

      {sectionData.stats && sectionData.stats.length > 0 && (
        <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pt-8 sm:pt-12">
          {sectionData.stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold" style={{ color: textColor }}>
                {stat.value}
              </div>
              <div className="font-medium text-sm" style={{ color: subtitleColor }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const imageBlock = (
    <div className="relative">
      {heroImage ? (
        <div className="relative">
          <img
            src={heroImage}
            alt="Hero"
            className="w-full h-auto rounded-2xl shadow-xl"
          />
        </div>
      ) : (
        <div className={`rounded-2xl shadow-xl p-8 max-w-sm mx-auto border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                <span className="text-white text-2xl font-bold">
                  {sectionData.card?.initials || 'JD'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white">
                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1.5"></div>
              </div>
            </div>

            <div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {sectionData.card?.name || t('John Doe')}
              </h3>
              <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                {sectionData.card?.title || t('Senior Developer')}
              </p>
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                {sectionData.card?.company || t('Tech Solutions Inc.')}
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>📧</span>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>📱</span>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>🔗</span>
              </div>
            </div>

            <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className={`w-24 h-24 rounded-lg mx-auto flex items-center justify-center shadow-sm border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                <div className="w-16 h-16 rounded flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                  <span className="text-white text-xs font-mono">QR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simple Decorative Elements */}
      <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-50 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
      <div className={`absolute -bottom-4 -left-4 w-12 h-12 rounded-full opacity-40 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
    </div>
  );

  return (
    <section id="hero" className="pt-16 flex items-center" style={sectionStyle}>
      {/* Background overlay */}
      {hasOverlay && (
        <div className="absolute inset-0" style={{ backgroundColor: overlayColor, zIndex: 1 }} />
      )}

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 w-full ${isBackground ? 'relative' : ''}`}
        style={{ zIndex: isBackground ? 2 : undefined }}>

        {/* Centered / Full-width layout: single column */}
        {(isCentered || isFullWidth) ? (
          <div className="max-w-4xl mx-auto">
            {contentBlock}
            {!isBackground && heroImage && (
              <div className="mt-12">{imageBlock}</div>
            )}
          </div>
        ) : (
          /* Two-column layout with configurable order */
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {isImageLeft ? (
              <>{imageBlock}{contentBlock}</>
            ) : (
              <>{contentBlock}{imageBlock}</>
            )}
          </div>
        )}
      </div>
    </section>
  );
}