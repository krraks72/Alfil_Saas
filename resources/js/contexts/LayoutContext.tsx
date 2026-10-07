import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type LayoutPosition = 'left' | 'right';

type LayoutContextType = {
    position: LayoutPosition;
    effectivePosition: LayoutPosition;
    updatePosition: (val: LayoutPosition) => void;
    isRtl: boolean;
    saveLayoutPosition: (position: LayoutPosition) => void;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
    const [position, setPosition] = useState<LayoutPosition>('left');
    const [isRtl, setIsRtl] = useState<boolean>(false);

    useEffect(() => {
        const isDemo = (window as any).page?.props?.globalSettings?.is_demo || false;
        let storedPosition: LayoutPosition | null = null;

        if (isDemo) {
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
            storedPosition = getCookie('layoutPosition') as LayoutPosition;
        } else {
            const globalSettings = (window as any).page?.props?.globalSettings;
            storedPosition = globalSettings?.layoutDirection as LayoutPosition;
        }

        if (storedPosition === 'left' || storedPosition === 'right') {
            setPosition(storedPosition);
        }

        document.documentElement.dir = 'ltr';
        document.documentElement.setAttribute('dir', 'ltr');
        setIsRtl(false);

        const handleLanguageChange = (event: CustomEvent) => {
            const { direction } = event.detail;
            if (direction) {
                setPosition(direction);
            }
        };

        window.addEventListener('languageChanged', handleLanguageChange as EventListener);

        return () => {
            window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
        };
    }, [(window as any).page?.props?.globalSettings]);

    const updatePosition = (val: LayoutPosition) => {
        setPosition(val);
    };

    const saveLayoutPosition = () => {
        const isDemo = (window as any).page?.props?.globalSettings?.is_demo || false;

        if (isDemo) {
            const setCookie = (name: string, value: string, days = 365) => {
                if (typeof document === 'undefined') return;
                const maxAge = days * 24 * 60 * 60;
                document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
            };
            setCookie('layoutPosition', position);
        }
    };

    const effectivePosition: LayoutPosition = position;

    return <LayoutContext.Provider value={{ position, effectivePosition, updatePosition, saveLayoutPosition, isRtl }}>{children}</LayoutContext.Provider>;
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) throw new Error('useLayout must be used within LayoutProvider');
    return context;
};