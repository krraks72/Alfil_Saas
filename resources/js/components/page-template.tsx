import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
import { FloatingChatGpt } from '@/components/FloatingChatGpt';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface PageAction {
  label?: string;
  icon?: ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick?: () => void;
  tooltip?: string;
  disabled?: boolean;
  className?: string;
}

export interface PageTemplateProps {
  title: string;
  description: string;
  url: string;
  actions?: PageAction[];
  children: ReactNode;
  noPadding?: boolean;
  breadcrumbs?: BreadcrumbItem[];
}

export function PageTemplate({
  title,
  description,
  url,
  actions,
  children,
  noPadding = false,
  breadcrumbs
}: PageTemplateProps) {
  // Default breadcrumbs if none provided
  const pageBreadcrumbs: BreadcrumbItem[] = breadcrumbs || [
    {
      title,
      href: url,
    },
  ];

  return (
    <AppLayout breadcrumbs={pageBreadcrumbs}>
      <Head title={title} />

      <div className="flex h-fit flex-1 flex-col gap-4 pt-4 pb-[50px] px-[10px] lg:px-[50px] w-full min-w-0">
        {/* Header with action buttons */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className='text-xs text-muted-foreground'>{description}</p>
          </div>
          {actions && actions.length > 0 && (
            <div className="flex items-center gap-2">
              {actions.map((action, index) => {
                const hasLabel = action.label && action.label.trim() !== '';
                const explicitTooltip = action.tooltip && action.tooltip.trim() !== '';
                const tooltipText = explicitTooltip ? action.tooltip : (hasLabel ? action.label : '');
                
                const buttonElement = (
                  <Button 
                    variant={action.variant || 'outline'} 
                    size={hasLabel ? 'sm' : 'icon'}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`cursor-pointer whitespace-nowrap ${action.className || ''}`}
                  >
                    {action.icon && !hasLabel && action.icon}
                    {action.icon && hasLabel && action.icon}
                    {hasLabel && <span className="hidden md:inline ml-1.5">{action.label}</span>}
                  </Button>
                );

                // Wrap with tooltip if tooltip text exists
                if (tooltipText) {
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        {buttonElement}
                      </TooltipTrigger>
                      <TooltipContent className={explicitTooltip ? '' : 'md:hidden'}>
                        <p>{tooltipText}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                // Return button without tooltip
                return <span key={index}>{buttonElement}</span>;
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`w-full min-w-0 ${noPadding ? "" : "rounded-xl border p-6"}`}>
          {children}
        </div>
      </div>
      <FloatingChatGpt />
    </AppLayout>
  );
}
