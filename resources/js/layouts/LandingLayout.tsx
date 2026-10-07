import { Head, usePage } from '@inertiajs/react';
import React, { ReactNode } from 'react';
import { useFavicon } from '@/hooks/use-favicon';
import { useBrandTheme } from '@/hooks/use-brand-theme';

interface LandingLayoutProps {
    children: ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
    const { globalSettings, userLanguage } = usePage().props as any;
    
    // Apply all brand settings dynamically
    useFavicon();
    useBrandTheme();
    
    // RTL Support for landing pages
    React.useLayoutEffect(() => {
        const getCookie = (name: string): string | null => {
            if (typeof document === 'undefined') return null;
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) {
                const cookieValue = parts.pop()?.split(';').shift();
                return cookieValue ? decodeURIComponent(cookieValue) : null;
            }
            return null;
        };
        
        const applyDirection = () => {
            const layoutPosition = getCookie('layoutPosition');
            const dir = layoutPosition === 'right' ? 'rtl' : 'ltr';
            
            document.documentElement.dir = dir;
            document.documentElement.setAttribute('dir', dir);
            document.body.dir = dir;
            document.body.style.direction = dir;
        };
        
        applyDirection();
        
        const interval = setInterval(applyDirection, 1000);
        
        return () => {
            clearInterval(interval);
        };
    }, []);
    
    return (
        <div className="min-h-screen bg-white">
            {children}
        </div>
    );
}