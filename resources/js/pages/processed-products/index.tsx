import { useEffect, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, Download, Grid3X3, List, Package, Plus, TrendingDown, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/components/page-template';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { hasPermission } from '@/utils/authorization';
import { toast } from '@/components/custom-toast';
import { route } from 'ziggy-js';

interface NamedOption {
    id: number;
    name: string;
}

interface ProcessedProductRecord {
    id: number;
    processed_date: string;
    produced_quantity: number;
    notes: string | null;
    output_product: {
        id: number;
        name: string;
        sku: string;
        stock_quantity: number;
        min_stock_level: number;
        status: 'active' | 'inactive';
        category?: NamedOption | null;
        brand?: NamedOption | null;
    };
    items: Array<{ id: number; quantity: number; product: { name: string; sku: string } }>;
}

interface PaginatedRecords {
    data: ProcessedProductRecord[];
    from: number | null;
    to: number | null;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface ProductStats {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    outOfStock: number;
    lowStock: number;
}

interface PageFilters {
    search: string;
    status: string;
    category: string;
    brand: string;
    per_page: number;
    view: string;
}

export default function ProcessedProductsIndex() {
    const { t } = useTranslation();
    const { auth, processedProducts, productStats, statusCounts, categories, brands, filters: pageFilters } =
        usePage().props as unknown as {
            auth: { permissions?: string[] };
            processedProducts: PaginatedRecords;
            productStats: ProductStats;
            statusCounts: { all: number; active: number; inactive: number };
            categories: NamedOption[];
            brands: NamedOption[];
            filters: PageFilters;
        };
    const permissions = auth?.permissions || [];
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedCategory, setSelectedCategory] = useState(pageFilters.category || 'all');
    const [selectedBrand, setSelectedBrand] = useState(pageFilters.brand || 'all');
    const [activeView, setActiveView] = useState<'list' | 'grid'>(() => {
        const urlView = new URLSearchParams(window.location.search).get('view');
        const savedView = localStorage.getItem('processed_products_view');
        const view = urlView || savedView || pageFilters.view;
        return view === 'grid' ? 'grid' : 'list';
    });
    const isInitialFilterMount = useRef(true);

    const buildParams = (overrides: Record<string, string | number> = {}) => {
        const params: Record<string, string | number> = {
            page: 1,
            per_page: pageFilters.per_page || 15,
            view: activeView,
        };
        if (searchTerm) params.search = searchTerm;
        if (selectedStatus !== 'all') params.status = selectedStatus;
        if (selectedCategory !== 'all') params.category = selectedCategory;
        if (selectedBrand !== 'all') params.brand = selectedBrand;
        return { ...params, ...overrides };
    };

    const applyFilters = () => {
        router.get(route('processed-products.index'), buildParams(), { preserveState: true, preserveScroll: true });
    };

    useEffect(() => {
        if (isInitialFilterMount.current) {
            isInitialFilterMount.current = false;
            return;
        }
        applyFilters();
    }, [selectedStatus, selectedCategory, selectedBrand]);

    const hasActiveFilters = () =>
        Boolean(searchTerm) || selectedStatus !== 'all' || selectedCategory !== 'all' || selectedBrand !== 'all';
    const activeFilterCount = () =>
        Number(Boolean(searchTerm)) +
        Number(selectedStatus !== 'all') +
        Number(selectedCategory !== 'all') +
        Number(selectedBrand !== 'all');

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setSelectedCategory('all');
        setSelectedBrand('all');
    };

    const statusTabs = [
        { key: 'all', label: t('All Processed Products'), count: statusCounts.all, icon: Package },
        { key: 'active', label: t('Active'), count: statusCounts.active, icon: CheckCircle },
        { key: 'inactive', label: t('Inactive'), count: statusCounts.inactive, icon: XCircle },
    ];

    const actions = [];
    if (hasPermission(permissions, 'export-products')) {
        actions.push({
            label: t('Export'),
            icon: <Download className="h-4 w-4" />,
            variant: 'outline' as const,
            onClick: async () => {
                try {
                    const response = await fetch(route('processed-products.export'));
                    if (!response.ok) throw new Error('Export failed');
                    const blob = await response.blob();
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = `processed_products_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
                    document.body.appendChild(link);
                    link.click();
                    window.URL.revokeObjectURL(downloadUrl);
                    document.body.removeChild(link);
                    toast.success(t('Export completed successfully'));
                } catch {
                    toast.error(t('Export failed'));
                }
            },
        });
    }
    if (hasPermission(permissions, 'create-products')) {
        actions.push({
            label: t('Create Processed Product'),
            icon: <Plus className="h-4 w-4" />,
            variant: 'default' as const,
            onClick: () => router.visit(route('processed-products.create')),
        });
    }

    const summaryCards = [
        {
            label: t('Total Products'),
            value: productStats.totalProducts,
            icon: Package,
            cardColor: 'bg-blue-50 dark:bg-blue-700/20',
            iconColor: 'bg-blue-50 text-blue-600 dark:bg-blue-700/20 dark:text-blue-400',
        },
        {
            label: t('Active Products'),
            value: productStats.activeProducts,
            icon: CheckCircle,
            cardColor: 'bg-emerald-50 dark:bg-emerald-700/20',
            iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-700/20 dark:text-emerald-400',
        },
        {
            label: t('Inactive Products'),
            value: productStats.inactiveProducts,
            icon: XCircle,
            cardColor: 'bg-red-50 dark:bg-red-700/20',
            iconColor: 'bg-red-50 text-red-600 dark:bg-red-700/20 dark:text-red-400',
        },
        {
            label: t('Out of Stock'),
            value: productStats.outOfStock,
            icon: AlertTriangle,
            cardColor: 'bg-orange-50 dark:bg-orange-700/20',
            iconColor: 'bg-orange-50 text-orange-600 dark:bg-orange-700/20 dark:text-orange-400',
        },
        {
            label: t('Low Stock'),
            value: productStats.lowStock,
            icon: TrendingDown,
            cardColor: 'bg-yellow-50 dark:bg-yellow-700/20',
            iconColor: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-700/20 dark:text-yellow-400',
        },
    ];

    const changeView = (view: 'list' | 'grid') => {
        setActiveView(view);
        localStorage.setItem('processed_products_view', view);
        router.get(route('processed-products.index'), buildParams({ view }), { preserveState: true, preserveScroll: true });
    };

    const handlePageChange = (url: string) => {
        const nextUrl = new URL(url, window.location.origin);
        nextUrl.searchParams.set('view', activeView);
        nextUrl.searchParams.set('per_page', String(pageFilters.per_page || 15));
        const filters = {
            search: searchTerm,
            status: selectedStatus,
            category: selectedCategory,
            brand: selectedBrand,
        };
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'all') nextUrl.searchParams.set(key, value);
            else nextUrl.searchParams.delete(key);
        });
        router.get(nextUrl.pathname, Object.fromEntries(nextUrl.searchParams), { preserveState: true, preserveScroll: true });
    };

    return (
        <PageTemplate
            title={t('Processed Products')}
            description={t('Manage processed products and the inventory used to create them.')}
            url={route('processed-products.index')}
            actions={actions}
        >
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5">
                {summaryCards.map(({ label, value, icon: Icon, cardColor, iconColor }) => (
                    <div key={label} className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                        <div className={`absolute right-0 top-0 h-16 w-16 rounded-bl-full sm:h-20 sm:w-20 ${cardColor}`} />
                        <div className="relative p-3.5 sm:p-4">
                            <div className="mb-2 flex items-start justify-between sm:mb-3">
                                <div className="text-left">
                                    <p className="mb-1 text-xs font-medium capitalize tracking-wide text-gray-600 dark:text-gray-400">{label}</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">{value}</p>
                                </div>
                                <div className={`relative z-10 mt-0.5 shrink-0 rounded-xl p-2 sm:p-2.5 ${iconColor}`}>
                                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={(event) => {
                        event.preventDefault();
                        applyFilters();
                    }}
                    searchPlaceholder={t('Search processed products or inventory items...')}
                    filters={[
                        {
                            name: 'category',
                            label: t('Category'),
                            type: 'select',
                            value: selectedCategory,
                            onChange: setSelectedCategory,
                            options: [
                                { value: 'all', label: t('All Categories') },
                                ...categories.map((category) => ({ value: String(category.id), label: category.name })),
                            ],
                        },
                        {
                            name: 'brand',
                            label: t('Brand'),
                            type: 'select',
                            value: selectedBrand,
                            onChange: setSelectedBrand,
                            options: [
                                { value: 'all', label: t('All Brands') },
                                ...brands.map((brand) => ({ value: String(brand.id), label: brand.name })),
                            ],
                        },
                    ]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={resetFilters}
                    showViewToggle
                    activeView={activeView}
                    onViewChange={(view) => changeView(view === 'grid' ? 'grid' : 'list')}
                    viewOptions={[
                        { value: 'list', label: t('List View'), icon: 'List' },
                        { value: 'grid', label: t('Grid View'), icon: 'Grid3X3' },
                    ]}
                />
                <div className="mb-1 border-t border-gray-200 dark:border-gray-700" />
                <div className="mx-2">
                    <div className="flex space-x-0 overflow-x-auto">
                        {statusTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = selectedStatus === tab.key;
                            return (
                                <div key={tab.key} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedStatus(tab.key)}
                                        className={`flex items-center space-x-2 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{tab.label}</span>
                                        <span className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-bold ${isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>{tab.count}</span>
                                    </button>
                                    {isActive && <div className="absolute bottom-0 left-1/2 h-0.5 w-[calc(100%-2rem)] -translate-x-1/2 rounded-full bg-primary transition-all duration-200" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {activeView === 'list' ? (
                <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('Processed product')}</TableHead>
                                    <TableHead>{t('Produced quantity')}</TableHead>
                                    <TableHead>{t('Inventory items used')}</TableHead>
                                    <TableHead>{t('Processing date')}</TableHead>
                                    <TableHead>{t('Current stock')}</TableHead>
                                    <TableHead>{t('Status')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {processedProducts.data.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{t('No processed products have been created yet.')}</TableCell></TableRow>
                                ) : processedProducts.data.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>
                                            <div className="font-medium">{record.output_product.name}</div>
                                            <div className="text-xs text-muted-foreground">{record.output_product.sku}</div>
                                            {(record.output_product.category || record.output_product.brand) && (
                                                <div className="mt-0.5 text-xs text-muted-foreground">
                                                    {[record.output_product.category?.name, record.output_product.brand?.name].filter(Boolean).join(' | ')}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>{record.produced_quantity}</TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {record.items.map((item) => <div key={item.id} className="text-sm">{item.product.name} <span className="text-muted-foreground">× {item.quantity}</span></div>)}
                                            </div>
                                        </TableCell>
                                        <TableCell>{record.processed_date.slice(0, 10)}</TableCell>
                                        <TableCell>{record.output_product.stock_quantity}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${record.output_product.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                                                {record.output_product.status === 'active' ? t('Active') : t('Inactive')}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <Pagination
                        from={processedProducts.from || 0}
                        to={processedProducts.to || 0}
                        total={processedProducts.total}
                        links={processedProducts.links}
                        entityName={t('processed products')}
                        onPageChange={handlePageChange}
                        currentPerPage={String(pageFilters.per_page || 15)}
                        onPerPageChange={(value) => router.get(route('processed-products.index'), buildParams({ per_page: Number(value) }), { preserveState: true, preserveScroll: true })}
                    />
                </div>
            ) : (
                <>
                    {processedProducts.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border bg-white py-20 dark:bg-gray-900">
                            <div className="mb-4 rounded-full bg-gray-50 p-6 dark:bg-gray-800"><Package className="h-12 w-12 text-gray-300 dark:text-gray-600" /></div>
                            <p className="mb-1 text-base font-semibold text-gray-700 dark:text-gray-300">{t('No processed products have been created yet.')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                            {processedProducts.data.map((record) => (
                                <article key={record.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                    <div className="flex items-start justify-between border-b bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                                        <div className="min-w-0">
                                            <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-white">{record.output_product.name}</h2>
                                            <p className="text-xs text-muted-foreground">{record.output_product.sku}</p>
                                        </div>
                                        <span className={`ml-2 inline-flex shrink-0 items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${record.output_product.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                                            {record.output_product.status === 'active' ? t('Active') : t('Inactive')}
                                        </span>
                                    </div>
                                    <div className="space-y-3 p-4 text-sm">
                                        <div className="flex justify-between"><span className="text-muted-foreground">{t('Produced quantity')}</span><span className="font-semibold">{record.produced_quantity}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">{t('Current stock')}</span><span className="font-semibold">{record.output_product.stock_quantity}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">{t('Processing date')}</span><span>{record.processed_date.slice(0, 10)}</span></div>
                                        <div className="border-t pt-3 dark:border-gray-700">
                                            <p className="mb-1 text-xs font-medium text-muted-foreground">{t('Inventory items used')}</p>
                                            <ul className="space-y-1">
                                                {record.items.map((item) => <li key={item.id} className="flex justify-between gap-2"><span className="truncate">{item.product.name}</span><span className="shrink-0 text-muted-foreground">× {item.quantity}</span></li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                    <Pagination
                        from={processedProducts.from || 0}
                        to={processedProducts.to || 0}
                        total={processedProducts.total}
                        links={processedProducts.links}
                        entityName={t('processed products')}
                        onPageChange={handlePageChange}
                        currentPerPage={String(pageFilters.per_page || 15)}
                        onPerPageChange={(value) => router.get(route('processed-products.index'), buildParams({ per_page: Number(value) }), { preserveState: true, preserveScroll: true })}
                    />
                </>
            )}
        </PageTemplate>
    );
}
