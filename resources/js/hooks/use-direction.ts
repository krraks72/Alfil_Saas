import { useEffect } from 'react';
import { useLayout } from '@/contexts/LayoutContext';

/**
 * Custom hook to handle RTL/LTR direction dynamically
 */
export function useDirection(globalSettings?: any) {
  const { updatePosition } = useLayout();
  
  useEffect(() => {
    // Get current language from i18n or cookies
    const currentLang = document.documentElement.lang || 
                       document.cookie.split('; ').find(row => row.startsWith('app_language='))?.split('=')[1] || 
                       'en';
    
    // RTL languages
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    const isRtl = rtlLanguages.includes(currentLang);
    
    // Get layout direction from settings or determine from language
    const layoutDirection = globalSettings?.layoutDirection || 
                           document.cookie.split('; ').find(row => row.startsWith('layoutDirection='))?.split('=')[1];
    
    const shouldBeRight = layoutDirection === 'right' || (isRtl && !layoutDirection);
    
    // Update position through LayoutContext
    updatePosition(shouldBeRight ? 'right' : 'left');
    
    // Listen for language changes
    const handleLanguageChange = (event: CustomEvent) => {
      const { language, direction } = event.detail;
      const newIsRtl = direction === 'right' || rtlLanguages.includes(language);
      updatePosition(newIsRtl ? 'right' : 'left');
    };
    
    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, [globalSettings, updatePosition]);
}