import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useSaasMode } from '@/hooks/useSaasMode';
import { useTranslation } from 'react-i18next';
import { useBrand } from '@/contexts/BrandContext';
import { useAppearance } from '@/hooks/use-appearance';

interface CustomPage {
  id: number;
  title: string;
  slug: string;
}

interface HeaderProps {
  brandColor?: string;
  settings: {
    company_name: string;
  };
  sectionData?: any;
  customPages?: CustomPage[];
}

export default function Header({ settings, sectionData, customPages = [], brandColor = '#10b77f' }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { props } = usePage();
  const {t} = useTranslation();
  const globalSettings = (props as any).globalSettings || {};
  const auth = (props as any).auth;
  const { logoLight, logoDark } = useBrand();
  const { appearance } = useAppearance();
  const currentLogo = appearance === 'dark' ? logoLight : logoDark;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = customPages.map(page => ({
    name: page.title,
    href: route('custom-page.show', page.slug)
  }));

  const isTransparent = sectionData?.transparent;
  const backgroundColor = sectionData?.background_color || '#ffffff';
  const textColor = sectionData?.text_color || '#1f2937';
  const buttonStyle = sectionData?.button_style || 'solid';

  const getButtonStyle = (isFilled: boolean) => {
    if (!isFilled) return {};
    if (buttonStyle === 'outline') {
      return { backgroundColor: 'transparent', color: brandColor, borderColor: brandColor };
    }
    if (buttonStyle === 'gradient') {
      return { background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)`, color: 'white', borderColor: 'transparent' };
    }
    return { backgroundColor: brandColor, color: 'white', borderColor: brandColor };
  };

  const getButtonHoverStyle = (isFilled: boolean, isHover: boolean) => {
    if (!isFilled) return {};
    if (buttonStyle === 'outline') {
      return isHover
        ? { backgroundColor: brandColor, color: 'white', borderColor: brandColor }
        : { backgroundColor: 'transparent', color: brandColor, borderColor: brandColor };
    }
    return isHover
      ? { backgroundColor: 'white', color: 'white', borderColor: brandColor }
      : { backgroundColor: brandColor, color: 'white', borderColor: brandColor };
  };

  const getHeaderClasses = () => {
    if (isTransparent) {
      return isScrolled
        ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50'
        : 'bg-transparent';
    }
    return isScrolled
      ? 'shadow-lg border-b border-gray-200/50'
      : '';
  };

  const getHeaderStyle = () => {
    if (isTransparent) return {};
    return { backgroundColor };
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${getHeaderClasses()}`}
      style={getHeaderStyle()}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href={route("home")}>
              <img
                src={currentLogo}
                alt={globalSettings.titleText || settings.company_name}
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
            <Link
              href={route('home')}
              className="text-sm font-medium transition-colors relative group"
              style={{ color: textColor }}
              onMouseEnter={(e) => e.currentTarget.style.color = brandColor}
              onMouseLeave={(e) => e.currentTarget.style.color = textColor}
            >
              {t('Home')}
              <span
                className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full"
                style={{ backgroundColor: brandColor }}
                aria-hidden="true"
              ></span>
            </Link>
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium transition-colors relative group"
                style={{ color: textColor }}
                onMouseEnter={(e) => e.currentTarget.style.color = brandColor}
                onMouseLeave={(e) => e.currentTarget.style.color = textColor}
              >
                {item.name}
                <span
                  className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full"
                  style={{ backgroundColor: brandColor }}
                  aria-hidden="true"
                ></span>
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {auth?.user ? (
              <Link
                href={route('dashboard')}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors border"
                style={getButtonStyle(true)}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, getButtonHoverStyle(true, true))}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, getButtonHoverStyle(true, false))}
              >
                {t('Dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href={route('login')}
                  className="text-sm font-medium transition-colors"
                  style={{ color: textColor }}
                  onMouseEnter={(e) => e.currentTarget.style.color = brandColor}
                  onMouseLeave={(e) => e.currentTarget.style.color = textColor}
                >
                  {t('Login')}
                </Link>
                {globalSettings.registrationEnabled === '1' && (
                  <Link
                    href={route('register')}
                    className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors border"
                    style={getButtonStyle(true)}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, getButtonHoverStyle(true, true))}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, getButtonHoverStyle(true, false))}
                  >
                    {t('Get Started')}
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              style={{ color: textColor }}
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200" id="mobile-menu">
            <div
              className="px-4 py-6 space-y-4"
              style={isTransparent ? { backgroundColor: 'white' } : { backgroundColor }}
            >
              <Link
                href={route('home')}
                className="block text-base font-medium transition-colors"
                style={{ color: textColor }}
                onMouseEnter={(e) => e.currentTarget.style.color = brandColor}
                onMouseLeave={(e) => e.currentTarget.style.color = textColor}
                onClick={() => setIsMenuOpen(false)}
              >
                {t('Home')}
              </Link>
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-base font-medium transition-colors"
                  style={{ color: textColor }}
                  onMouseEnter={(e) => e.currentTarget.style.color = brandColor}
                  onMouseLeave={(e) => e.currentTarget.style.color = textColor}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 space-y-3 border-t border-gray-200">
                {auth?.user ? (
                  <Link
                    href={route('dashboard')}
                    className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-colors border"
                    style={getButtonStyle(true)}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, getButtonHoverStyle(true, true))}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, getButtonHoverStyle(true, false))}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('Dashboard')}
                  </Link>
                ) : (
                  <>
                    <Link
                      href={route('login')}
                      className="block w-full text-center py-2.5 text-sm font-medium transition-colors"
                      style={{ color: textColor }}
                      onMouseEnter={(e) => e.currentTarget.style.color = brandColor}
                      onMouseLeave={(e) => e.currentTarget.style.color = textColor}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('Login')}
                    </Link>
                    {globalSettings.registrationEnabled === '1' && (
                      <Link
                        href={route('register')}
                        className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-colors border"
                        style={getButtonStyle(true)}
                        onMouseEnter={(e) => Object.assign(e.currentTarget.style, getButtonHoverStyle(true, true))}
                        onMouseLeave={(e) => Object.assign(e.currentTarget.style, getButtonHoverStyle(true, false))}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {t('Get Started')}
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
