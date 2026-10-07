import { SidebarProvider } from '@/components/ui/sidebar';
import { useLayout } from '@/contexts/LayoutContext';
import { FloatingChatGpt } from '@/components/FloatingChatGpt';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import CookieConsentBanner from '@/components/CookieConsentBanner';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const isPosPage = route().current('pos.index');

    const [isOpen, setIsOpen] = useState(() => {
        if (isPosPage) return false;
        return typeof window !== 'undefined' ? localStorage.getItem('sidebar') !== 'false' : true;
    });

    useEffect(() => {
        if (isPosPage) {
            setIsOpen(false);
        } else {
            setIsOpen(typeof window !== 'undefined' ? localStorage.getItem('sidebar') !== 'false' : true);
        }
    }, [isPosPage]);

    const handleSidebarChange = (open: boolean) => {
        setIsOpen(open);
        if (!isPosPage && typeof window !== 'undefined') {
            localStorage.setItem('sidebar', String(open));
        }
    };

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">
                {children}
                <FloatingChatGpt />
                <CookieConsentBanner />
            </div>
        );
    }

    const { position } = useLayout();

    return (
        <SidebarProvider defaultOpen={isOpen} open={isOpen} onOpenChange={handleSidebarChange}>
            <div className={cn('flex w-full', position === 'right' ? 'flex-row-reverse' : 'flex-row')}>
                {children}
                <FloatingChatGpt />
                <CookieConsentBanner />
            </div>
        </SidebarProvider>
    );
}
