import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useLayout } from '@/contexts/LayoutContext';
import { useSidebarSettings } from '@/contexts/SidebarContext';
import { useBrand } from '@/contexts/BrandContext';
import { type NavItem } from '@/types';
import { Link, usePage, router } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, ShoppingBag, Package, Users, Tag, FileIcon, Settings, BarChart, Barcode, FileText, Briefcase, CheckSquare, Calendar as CalendarIcon, CreditCard, Ticket, Gift, DollarSign, MessageSquare, CalendarDays, Palette, Image, Mail, ChevronDown, Building2, Globe, Calculator, Receipt, Search, X, ChevronRight, LogOut, TicketPercent } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import AppLogo from './app-logo';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { hasPermission } from '@/utils/authorization';
import { toast } from '@/components/custom-toast';


export function AppSidebar() {
    const { t, i18n } = useTranslation();
    const { auth, globalSettings } = usePage().props as any;
    const userRole = auth.user?.type || auth.user?.role;
    const permissions = auth?.permissions || [];

    // Get current direction
    const isRtl = document.documentElement.dir === 'rtl';


    const getSuperAdminNavItems = (): NavItem[] => [
        {
            title: t('Dashboard'),
            href: route('dashboard'),
            icon: LayoutGrid,
            group: t('Overview')
        },

        {
            title: t('Companies'),
            href: route('companies.index'),
            icon: Briefcase,
            group: t('Management')
        },
        {
            title: t('Media Library'),
            href: route('media-library'),
            icon: Image,
            group: t('Management')
        },


        {
            title: t('Plans'),
            icon: CreditCard,
            children: [
                {
                    title: t('Plan'),
                    href: route('plans.index')
                },
                {
                    title: t('Plan Request'),
                    href: route('plan-requests.index')
                },
                {
                    title: t('Plan Orders'),
                    href: route('plan-orders.index')
                }
            ],
            group: t('Management')
        },
        {
            title: t('Coupons'),
            href: route('coupons.index'),
            icon: TicketPercent,
            group: t('Management')
        },

        {
            title: t('Currency'),
            href: route('currencies.index'),
            icon: DollarSign,
            group: t('Management')
        },
        {
            title: t('Referral Program'),
            href: route('referral.index'),
            icon: Gift,
            group: t('Management')
        },
        {
            title: t('Landing Page'),
            icon: Palette,
            children: [
                {
                    title: t('Landing Page'),
                    href: route('landing-page')
                },
                {
                    title: t('Custom Pages'),
                    href: route('landing-page.custom-pages.index')
                },
                {
                    title: t('Contact Inquiries'),
                    href: route('contacts.index'),
                    icon: MessageSquare,
                },
                {
                    title: t('Newsletters'),
                    href: route('newsletter-subscribers.index'),
                    icon: Mail,
                },
            ],
            group: t('Management')
        },

        {
            title: t('Email Templates'),
            href: route('email-templates.index'),
            icon: Mail,
            group: t('System Control')
        },
        {
            title: t('Settings'),
            href: route('settings'),
            icon: Settings,
            group: t('System Control')
        }
    ];

    const getCompanyNavItems = (): NavItem[] => {
        const items: NavItem[] = [];

        // Dashboard
        if (hasPermission(permissions, 'manage-dashboard')) {
            items.push({
                title: t('Dashboard'),
                href: route('dashboard'),
                icon: LayoutGrid,
                group: t('Overview'),
            });
        }

        // Calendar
        items.push({
            title: t('Calendar'),
            href: route('calendar.index'),
            icon: CalendarIcon,
            group: t('Overview'),
        });

        // Notifications
        if (hasPermission(permissions, 'view-notifications')) {
            items.push({
                title: t('Notifications'),
                href: route('notifications.index'),
                icon: MessageSquare,
                group: t('Overview'),
            });
        }

        // POS
        if (hasPermission(permissions, 'view-pos')) {
            items.push({
                title: t('POS'),
                href: route('pos.index'),
                icon: Calculator,
                group: t('Point of Sale'),
            });
        }

        // POS Sales is handled separately above, no need for duplicate Sales entry here

        // Sales Management
        const salesChildren = [];
        if (hasPermission(permissions, 'view-sales')) {
            salesChildren.push({
                title: t('Sales'),
                href: route('sales.index')
            });
        }
        if (hasPermission(permissions, 'view-sale-returns')) {
            salesChildren.push({
                title: t('Sale Returns'),
                href: route('sale-returns.index')
            });
        }
        if (salesChildren.length > 0) {
            items.push({
                title: t('Sales Management'),
                icon: Receipt,
                children: salesChildren,
                group: t('Sales & Revenue'),
            });
        }

        // Quotations
        if (hasPermission(permissions, 'view-quotations')) {
            items.push({
                title: t('Quotations'),
                href: route('quotations.index'),
                icon: BookOpen,
                group: t('Sales & Revenue'),
            });
        }

        // Expense Management
        const expenseChildren = [];
        if (hasPermission(permissions, 'view-expenses')) {
            expenseChildren.push({
                title: t('Expenses'),
                href: route('expenses.index')
            });
        }
        if (hasPermission(permissions, 'view-expense-categories')) {
            expenseChildren.push({
                title: t('Expense Categories'),
                href: route('expense-categories.index')
            });
        }
        if (expenseChildren.length > 0) {
            items.push({
                title: t('Expense Management'),
                icon: Receipt,
                children: expenseChildren,
                group: t('Purchase & Expense'),
            });
        }

        // Purchase Management
        const purchaseChildren = [];
        if (hasPermission(permissions, 'view-purchases')) {
            purchaseChildren.push({
                title: t('Purchases'),
                href: route('purchases.index')
            });
        }
        if (hasPermission(permissions, 'view-purchase-returns')) {
            purchaseChildren.push({
                title: t('Purchase Returns'),
                href: route('purchase-returns.index')
            });
        }
        if (purchaseChildren.length > 0) {
            items.push({
                title: t('Purchase Management'),
                icon: FileText,
                children: purchaseChildren,
                group: t('Purchase & Expense'),
            });
        }

        // Contacts
        const contactChildren = [];
        if (hasPermission(permissions, 'view-customers')) {
            contactChildren.push({
                title: t('Customers'),
                href: route('customers.index')
            });
        }
        if (hasPermission(permissions, 'view-vendors')) {
            contactChildren.push({
                title: t('Vendors'),
                href: route('vendors.index')
            });
        }
        if (contactChildren.length > 0) {
            items.push({
                title: t('Contacts'),
                icon: Users,
                children: contactChildren,
                group: t('Contacts'),
            });
        }

        // Reports
        if (hasPermission(permissions, 'view-reports')) {
            items.push({
                title: t('Reports'),
                icon: BarChart,
                children: [
                    {
                        title: t('Sales Report'),
                        href: route('reports.sales')
                    },
                    {
                        title: t('Financial Report'),
                        href: route('reports.financial')
                    },
                    {
                        title: t('Purchase Report'),
                        href: route('reports.purchase')
                    },
                    {
                        title: t('Expense Report'),
                        href: route('reports.expense')
                    },
                    {
                        title: t('Inventory Report'),
                        href: route('reports.inventory')
                    },
                    {
                        title: t('Customer Report'),
                        href: route('reports.customer-analytics')
                    },
                    {
                        title: t('Tax Report'),
                        href: route('reports.tax')
                    },
                    {
                        title: t('Vendor Report'),
                        href: route('reports.vendor')
                    }
                ],
                group: t('Reports & Analytics'),
            });
        }

        // Product Management
        const productChildren = [];
        if (hasPermission(permissions, 'view-products')) {
            productChildren.push({
                title: t('Products'),
                href: route('products.index')
            });
            productChildren.push({
                title: t('Processed Products'),
                href: route('processed-products.index')
            });
        }
        if (hasPermission(permissions, 'view-products')) {
            productChildren.push({
                title: t('Barcode Print'),
                href: route('barcode-print.index')
            });
        }
        if (hasPermission(permissions, 'view-categories')) {
            productChildren.push({
                title: t('Categories'),
                href: route('categories.index')
            });
        }
        if (hasPermission(permissions, 'view-brands')) {
            productChildren.push({
                title: t('Brands'),
                href: route('brands.index')
            });
        }
        if (hasPermission(permissions, 'view-units')) {
            productChildren.push({
                title: t('Units'),
                href: route('units.index')
            });
        }
        if (hasPermission(permissions, 'view-taxes')) {
            productChildren.push({
                title: t('Taxes'),
                href: route('taxes.index')
            });
        }
        if (productChildren.length > 0) {
            items.push({
                title: t('Product Management'),
                icon: ShoppingBag,
                children: productChildren,
                group: t('Products & Inventory'),
            });
        }

        // Staff Management
        const staffChildren = [];
        if (hasPermission(permissions, 'manage-users')) {
            staffChildren.push({
                title: t('Users'),
                href: route('users.index')
            });
        }
        if (hasPermission(permissions, 'manage-roles')) {
            staffChildren.push({
                title: t('Roles'),
                href: route('roles.index')
            });
        }
        if (staffChildren.length > 0) {
            items.push({
                title: t('Staff Management'),
                icon: Users,
                children: staffChildren,
                group: t('Team & Access'),
            });
        }

        // POS Management
        const posChildren = [];
        if (hasPermission(permissions, 'view-branches')) {
            posChildren.push({
                title: t('Branches'),
                href: route('branches.index')
            });
        }
        if (hasPermission(permissions, 'view-cash-registers')) {
            posChildren.push({
                title: t('Cash Registers'),
                href: route('cash-registers.index')
            });
        }
        if (hasPermission(permissions, 'manage_branch_sales_target')) {
            posChildren.push({
                title: t('Branch Sales Targets'),
                href: route('branch-sales-targets.index')
            });
        }
        if (posChildren.length > 0) {
            items.push({
                title: t('POS Management'),
                icon: Building2,
                children: posChildren,
                group: t('Store Management'),
            });
        }

        // Plans - available to all company users
        const planChildren = [];
        if (hasPermission(permissions, 'manage-plans')) {
            planChildren.push({
                title: t('Plan'),
                href: route('plans.index')
            });
        }
        if (hasPermission(permissions, 'manage-plan-requests')) {
            planChildren.push({
                title: t('My Plan Request'),
                href: route('plan-requests.index')
            });
        }
        if (hasPermission(permissions, 'manage-plan-orders')) {
            planChildren.push({
                title: t('My Plan Order'),
                href: route('plan-orders.index')
            });
        }
        if (planChildren.length > 0) {
            items.push({
                title: t('Plans'),
                icon: CreditCard,
                children: planChildren,
                group: t('Account & Billing'),
            });
        }

        // Referral Program
        if (hasPermission(permissions, 'manage-referral')) {
            items.push({
                title: t('Referral Program'),
                href: route('referral.index'),
                icon: Gift,
                group: t('Account & Billing'),
            });
        }

        // Notification Templates
        if (hasPermission(permissions, 'view-notification-templates')) {
            items.push({
                title: t('Notification Templates'),
                href: route('notification-templates.index'),
                icon: FileText,
                group: t('System')
            });
        }

        // Media Library
        if (hasPermission(permissions, 'manage-media')) {
            items.push({
                title: t('Media Library'),
                href: route('media-library'),
                icon: Image,
                group: t('System')
            });
        }

        // System
        if (hasPermission(permissions, 'manage-settings')) {
            items.push({
                title: t('Settings'),
                href: route('settings'),
                icon: Settings,
                group: t('System')
            });
        }

        return items;
    };

    const mainNavItems = userRole === 'superadmin' ? getSuperAdminNavItems() : getCompanyNavItems();

    const { position, effectivePosition } = useLayout();
    const { variant, collapsible, style } = useSidebarSettings();
    const { logoLight, logoDark, favicon, updateBrandSettings } = useBrand();
    const [sidebarStyle, setSidebarStyle] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {

        // Apply styles based on sidebar style
        if (style === 'colored') {
            setSidebarStyle({ backgroundColor: 'var(--primary)', color: 'white' });
        } else if (style === 'gradient') {
            setSidebarStyle({
                background: 'linear-gradient(to bottom, var(--primary), color-mix(in srgb, var(--primary), transparent 20%))',
                color: 'white'
            });
        } else {
            setSidebarStyle({});
        }
    }, [style]);

    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filterNavItems = (items: NavItem[], query: string): NavItem[] => {
        if (!query.trim()) return items;
        const q = query.toLowerCase();
        const result: NavItem[] = [];
        items.forEach(item => {
            if (item.children) {
                const matchedChildren = item.children.filter(child =>
                    child.title.toLowerCase().includes(q)
                );
                if (item.title.toLowerCase().includes(q)) {
                    result.push(item);
                } else if (matchedChildren.length > 0) {
                    result.push({ ...item, children: matchedChildren, defaultOpen: true });
                }
            } else {
                if (item.title.toLowerCase().includes(q)) {
                    result.push(item);
                }
            }
        });
        return result;
    };

    const filteredNavItems = filterNavItems(mainNavItems, searchQuery);

    // Get the first available menu item's href for logo link
    const getFirstAvailableHref = () => {
        if (filteredNavItems.length === 0) return route('dashboard');

        const firstItem = filteredNavItems[0];
        if (firstItem.href) {
            return firstItem.href;
        } else if (firstItem.children && firstItem.children.length > 0) {
            return firstItem.children[0].href || route('dashboard');
        }
        return route('dashboard');
    };

    return (
        <Sidebar
            side={effectivePosition}
            collapsible={collapsible}
            variant={variant}
            className={style !== 'plain' ? 'sidebar-custom-style' : 'shadow-xl'}
        >
            <SidebarHeader className={style !== 'plain' ? 'sidebar-styled' : ''} style={sidebarStyle}>
                <div className="flex justify-center items-center p-2">
                    <Link href={getFirstAvailableHref()} prefetch className="flex items-center justify-center">
                        {/* Logo for expanded sidebar */}
                        <div className="group-data-[collapsible=icon]:hidden flex items-center">
                            {(() => {
                                const isDark = document.documentElement.classList.contains('dark');
                                const currentLogo = isDark ? logoLight : logoDark;
                                const displayUrl = currentLogo ? (
                                    currentLogo.startsWith('http') ? currentLogo :
                                        currentLogo.startsWith('/storage/') ? `${window.location.origin}${currentLogo}` :
                                            currentLogo.startsWith('/') ? `${window.location.origin}${currentLogo}` : currentLogo
                                ) : '';

                                return displayUrl ? (
                                    <img
                                        key={`${currentLogo}-${Date.now()}`}
                                        src={displayUrl}
                                        alt="Logo"
                                        className="w-auto transition-all duration-200"
                                        onError={() => updateBrandSettings({ [isDark ? 'logoLight' : 'logoDark']: '' })}
                                    />
                                ) : (
                                    <div className="h-12 text-inherit font-semibold flex items-center text-lg tracking-tight">
                                        WorkDo
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Icon for collapsed sidebar */}
                        <div className="h-8 w-8 hidden group-data-[collapsible=icon]:block">
                            {(() => {
                                const displayFavicon = favicon ? (
                                    favicon.startsWith('http') ? favicon :
                                        favicon.startsWith('/storage/') ? `${window.location.origin}${favicon}` :
                                            favicon.startsWith('/') ? `${window.location.origin}${favicon}` : favicon
                                ) : '';

                                return displayFavicon ? (
                                    <img
                                        key={`${favicon}-${Date.now()}`}
                                        src={displayFavicon}
                                        alt="Icon"
                                        className="h-8 w-8 transition-all duration-200"
                                        onError={() => updateBrandSettings({ favicon: '' })}
                                    />
                                ) : (
                                    <div className="h-8 w-8 bg-primary text-white rounded flex items-center justify-center font-bold shadow-sm">
                                        W
                                    </div>
                                );
                            })()}
                        </div>
                    </Link>
                </div>

                {/* Search Input */}
                <div className="group-data-[collapsible=icon]:hidden px-2 pb-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('Search menu...')}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 py-1.5 pl-8 pr-7 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

            </SidebarHeader>

            <SidebarContent style={sidebarStyle} className={`h-full ${style !== 'plain' ? 'sidebar-styled' : 'sidebar-plain'}`}>
                <div>
                    <NavMain items={filteredNavItems} position={effectivePosition} searchQuery={searchQuery} />
                </div>
            </SidebarContent>

            <SidebarFooter className={`${userRole === 'company' && `border-t`}`}>
                {/* Plan Active UI — Company only */}
                {userRole === 'company' && (() => {
                    const user = auth.user;
                    const plan = user?.plan;
                    const isActive = user?.plan_is_active === 1;
                    const isTrial = user?.is_trial == 1;

                    const expireDate = isTrial ? user?.trial_expire_date : (user?.plan_expire_date ||  globalSettings?.planExirationDate);

                    const daysLeft = expireDate
                        ? Math.ceil((new Date(expireDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        : null;
                    const isExpired = daysLeft == null || daysLeft <= 0;

                    let subText = '';
                    if (isExpired) subText = t('Plan expired');
                    else if (!plan) subText = t('No Plan');
                    else if (isTrial) subText = daysLeft !== null ? t('Trial · {{n}} days left', { n: daysLeft }) : t('Trial');
                    else if (daysLeft !== null && daysLeft <= 7) subText = t('Expires in {{n}} days', { n: daysLeft });
                    else subText = plan.name;


                    return <div ref={userMenuRef} className="relative group-data-[collapsible=icon]:hidden">
                        {/* Popup panel — expands above */}
                        {userMenuOpen && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                                {/* User info row */}
                                <Link
                                    href={route('profile')}
                                    onClick={() => setUserMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800"
                                >
                                    <div className="relative shrink-0">
                                        {auth.avatar ? (
                                            <img src={auth.avatar} alt={auth.user.name} className="h-9 w-9 rounded-full object-cover" />
                                        ) : (
                                            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold line-clamp-1">
                                                {auth.user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate line-clamp-1">{auth.user?.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate line-clamp-1">{auth.user?.email}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                                </Link>

                                {/* Actions */}
                                <div className="py-1">
                                    <Link
                                        href={route('referral.index')}
                                        onClick={() => setUserMenuOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <Gift className="h-4 w-4 text-gray-400" />
                                        {t('Referral Program')}
                                    </Link>
                                    <Link
                                        href={route('plans.index')}
                                        onClick={() => setUserMenuOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <CreditCard className="h-4 w-4 text-gray-400" />
                                        {t('Plans')}
                                    </Link>
                                    <Link
                                        href={route('settings')}
                                        onClick={() => setUserMenuOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <Settings className="h-4 w-4 text-gray-400" />
                                        {t('Settings')}
                                    </Link>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        onClick={() => setUserMenuOpen(false)}
                                        className="flex cursor-pointer w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4 text-gray-400" />
                                        {t('Log out')}
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Trigger card */}
                        <button
                            type="button"
                            onClick={() => setUserMenuOpen(v => !v)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-black/10 dark:bg-white/10 transition-colors cursor-pointer"
                        >
                            <div className="shrink-0">
                                {auth.avatar ? (
                                    <img src={auth.avatar} alt={auth.user.name} className="h-8 w-8 rounded-full object-cover" />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                                        {auth.user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-medium text-sidebar-foreground truncate line-clamp-1">{auth.user?.name}</p>
                                <p className={`text-xs truncate line-clamp-1 ${isExpired ? 'text-red-400' : daysLeft !== null && daysLeft <= 7 ? 'text-orange-500' : 'text-sidebar-foreground/60'}`}>{subText}</p>
                            </div>
                            <Link
                                href={route('plans.index')}
                                onClick={e => e.stopPropagation()}
                                className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white text-gray-900 hover:!text-gray-900 hover:bg-gray-100 border border-gray-300 dark:hover:!text-white"
                            >
                                {t('Upgrade')}
                            </Link>
                        </button>
                    </div>
                })()}
            </SidebarFooter>
        </Sidebar>
    );
}
