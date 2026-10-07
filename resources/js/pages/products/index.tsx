import { useState, useEffect, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Plus, Eye, Edit, Trash2, Lock, Unlock, Download, Package, CheckCircle, XCircle, AlertTriangle, TrendingDown } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';

// Declare JsBarcode for TypeScript
declare global {
  interface Window {
    JsBarcode: any;
  }
}
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export default function Products() {
  const { t } = useTranslation();
  const { auth, products, categories, brands, units, taxes, productStats, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  // State - Initialize activeView from URL params or localStorage, fallback to 'list'
  const [activeView, setActiveView] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewFromUrl = urlParams.get('view');
    if (viewFromUrl && ['list', 'grid'].includes(viewFromUrl)) {
      return viewFromUrl as 'list' | 'grid';
    }
    const savedView = localStorage.getItem('products_view');
    if (savedView && ['list', 'grid'].includes(savedView)) {
      return savedView as 'list' | 'grid';
    }
    return 'list';
  });
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
  const [activeStatusTab, setActiveStatusTab] = useState(pageFilters.status || 'all');
  const [selectedCategory, setSelectedCategory] = useState(pageFilters.category || 'all');
  const [selectedBrand, setSelectedBrand] = useState(pageFilters.brand || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [barcodeField, setBarcodeField] = useState('sku');

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      applyFilters();
    }
  }, [selectedStatus, selectedCategory, selectedBrand]);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return selectedStatus !== 'all' || searchTerm !== '' || selectedCategory !== 'all' || selectedBrand !== 'all';
  };

  // Count active filters
  const activeFilterCount = () => {
    return (selectedStatus !== 'all' ? 1 : 0) +
      (searchTerm ? 1 : 0) +
      (selectedCategory !== 'all' ? 1 : 0) +
      (selectedBrand !== 'all' ? 1 : 0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    const params: any = { page: 1 };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (selectedStatus !== 'all') {
      params.status = selectedStatus;
    }

    if (selectedCategory !== 'all') {
      params.category = selectedCategory;
    }

    if (selectedBrand !== 'all') {
      params.brand = selectedBrand;
    }

    // Add per_page if it exists
    if (pageFilters.per_page) {
      params.per_page = pageFilters.per_page;
    }

    // Preserve current view
    params.view = activeView;

    if (pageFilters.sort_field) {
      params.sort_field = pageFilters.sort_field;
      params.sort_direction = pageFilters.sort_direction;
    }

    router.get(route('products.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    setActiveStatusTab(value);
  };

  const handleStatusTabChange = (status: string) => {
    setActiveStatusTab(status);
    setSelectedStatus(status);
    const params: any = { page: 1, view: activeView };
    if (searchTerm) params.search = searchTerm;
    if (status !== 'all') params.status = status;
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (selectedBrand !== 'all') params.brand = selectedBrand;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (pageFilters.sort_field) { params.sort_field = pageFilters.sort_field; params.sort_direction = pageFilters.sort_direction; }
    router.get(route('products.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleCategoryFilter = (value: string) => {
    setSelectedCategory(value);
  };

  const handleBrandFilter = (value: string) => {
    setSelectedBrand(value);
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

    const params: any = {
      sort_field: field,
      sort_direction: direction,
      page: 1
    };

    // Add search and filters
    if (searchTerm) {
      params.search = searchTerm;
    }

    if (selectedStatus !== 'all') {
      params.status = selectedStatus;
    }

    if (selectedCategory !== 'all') {
      params.category = selectedCategory;
    }

    if (selectedBrand !== 'all') {
      params.brand = selectedBrand;
    }

    // Add per_page if it exists
    if (pageFilters.per_page) {
      params.per_page = pageFilters.per_page;
    }

    // Preserve current view
    params.view = activeView;

    router.get(route('products.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);
    switch (action) {
      case 'view':
        router.visit(route('products.show', item.id));
        break;
      case 'edit':
        router.visit(route('products.edit', item.id));
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
      case 'toggle-status':
        handleToggleStatus(item);
        break;
    }
  };

  const handleAddNew = () => {
    setCurrentItem(null);
    setFormMode('create');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (formData: any) => {
    if (formMode === 'create') {
      toast.loading(t('Creating product...'));
      router.post(route('products.store'), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if (page.props.flash.success) {
            toast.success(t(page.props.flash.success));
          } else if (page.props.flash.error) {
            toast.error(t(page.props.flash.error));
          }
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);
          } else {
            toast.error(t('Failed to create product') + `: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading(t('Updating product...'));
      router.put(route('products.update', currentItem.id), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if (page.props.flash.success) {
            toast.success(t(page.props.flash.success));
          } else if (page.props.flash.error) {
            toast.error(t(page.props.flash.error));
          }
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);
          } else {
            toast.error(t('Failed to update product') + `: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting product...'));
    router.delete(route('products.destroy', currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(t('Failed to delete product') + `: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleToggleStatus = (product: any) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    toast.loading(`${newStatus === 'active' ? t('Activating') : t('Deactivating')} product...`);
    router.put(route('products.toggle-status', product.id), {}, {
      onSuccess: (page) => {
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(t('Failed to update product status') + `: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleResetFilters = () => {
    isInitialMount.current = true;
    setSelectedStatus('all');
    setActiveStatusTab('all');
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setShowFilters(false);

    router.get(route('products.index'), { view: activeView }, { preserveState: true, preserveScroll: true });
  };

  useEffect(() => {
    // Generate barcodes after component mounts and data is available
    if (products?.data && typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
      script.onload = () => {
        setTimeout(() => {
          products.data.forEach((product: any) => {
            const element = document.getElementById(`barcode-${product.id}`);
            let barcodeValue = product[barcodeField] || product.sku;

            // Use original value for barcode generation
            if (barcodeField === 'name') {
              barcodeValue = product.name;
            } else if (barcodeField === 'id') {
              barcodeValue = `PRD${String(product.id).padStart(6, '0')}`;
            }

            if (element && window.JsBarcode && barcodeValue) {
              try {
                window.JsBarcode(element, barcodeValue, {
                  format: "CODE128",
                  width: 2,
                  height: 40,
                  displayValue: false
                });
              } catch (e) {

              }
            }
          });
        }, 100);
      };

      if (!document.querySelector('script[src*="jsbarcode"]')) {
        document.head.appendChild(script);
      } else {
        script.onload();
      }

      return () => {
        const existingScript = document.querySelector('script[src*="jsbarcode"]');
        if (existingScript && existingScript.parentNode) {
          existingScript.parentNode.removeChild(existingScript);
        }
      };
    }
  }, [products?.data, barcodeField]);

  const pageActions = [];

  // Add Export button
  if (hasPermission(permissions, 'export-products')) {
    pageActions.push({
      label: t('Export'),
      icon: <Download className="h-4 w-4" />,
      variant: 'outline',
      onClick: async () => {
        try {
          const params = new URLSearchParams();
          if (searchTerm) params.append('search', searchTerm);
          if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
          if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
          if (selectedBrand && selectedBrand !== 'all') params.append('brand', selectedBrand);
          if (pageFilters.sort_field) {
            params.append('sort_field', pageFilters.sort_field);
            params.append('sort_direction', pageFilters.sort_direction);
          }
          
          const url = route('products.export') + (params.toString() ? '?' + params.toString() : '');
          const response = await fetch(url);
          if (!response.ok) throw new Error('Export failed');
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
          toast.success(t('Export completed successfully'));
        } catch (error) {
          toast.error(t('Export failed'));
        }
      }
    });
  }

  if (hasPermission(permissions, 'create-products')) {
    pageActions.push({
      label: t('Add Product'),
      icon: <Plus className="h-4 w-4" />,
      variant: 'default',
      onClick: () => router.visit(route('products.create'))
    });
  }

  const getStockStatus = (product: any) => {
    if (product.stock_quantity <= 0) return 'out_of_stock';
    if (product.stock_quantity <= product.min_stock_level) return 'low_stock';
    return null;
  };

  const stockStatusBadge = (product: any) => {
    const status = getStockStatus(product);
    if (status === 'out_of_stock') return <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20">{t('Out of Stock')}</span>;
    if (status === 'low_stock') return <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-yellow-50 text-yellow-700 ring-yellow-600/20">{t('Low Stock')}</span>;
    return null;
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Product Management'), href: route('products.index') },
    { title: t('Products') }
  ];

  const statusTabs = [
    { key: 'all', label: t('All Products'), count: productStats?.tabCounts?.total ?? (productStats?.totalProducts || 0), icon: Package },
    { key: 'active', label: t('Active'), count: productStats?.tabCounts?.active ?? (productStats?.activeProducts || 0), icon: CheckCircle },
    { key: 'inactive', label: t('Inactive'), count: productStats?.tabCounts?.inactive ?? (productStats?.inactiveProducts || 0), icon: XCircle },
  ];

  const columns = [
    {
      key: 'name',
      label: t('Product'),
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={row.image || `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`}
            alt={value}
            className="w-9 h-9 sm:w-10 sm:h-10 object-cover rounded shrink-0 cursor-pointer"
            onClick={() => window.open(row.image || `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`, '_blank')}
          />
          <div className="min-w-0">
            <button
              title={value}
              className="font-medium block w-full text-left truncate text-sm text-gray-900 dark:text-white"
            >
              {value}
            </button>
            {row.category && (
              <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 min-w-0" title={`${row.category.name} | ${row.brand?.name}`}>
                <span className="truncate">{row.category.name}</span>
                <span className="shrink-0 text-gray-400">|</span>
                <span className="truncate">{row.brand?.name}</span>
              </p>
            )}
          </div>
        </div>
      )
    },
    { key: 'sku', label: t('SKU'), sortable: true },
    { key: 'selling_price', label: t('Price'), sortable: true, render: (value: number) => <span className="font-mono">{window.appSettings.formatCurrency(value)}</span>},
    {
      key: 'stock_quantity',
      label: t('Stock'),
      sortable: true,
      render: (value: number, row: any) => {
        const isOutOfStock = row.stock_quantity <= 0;
        const isLowStock = !isOutOfStock && row.stock_quantity <= row.min_stock_level;
        const quantityClass = isOutOfStock
          ? 'text-red-600 font-semibold'
          : isLowStock
          ? 'text-yellow-600 font-semibold'
          : 'font-semibold';
        const tooltipLabel = isOutOfStock
          ? { label: t('Out of Stock'), color: '' }
          : isLowStock
          ? { label: t('Low Stock'), color: '' }
          : null;
        const quantity = <span className={`cursor-default ${quantityClass}`}>{value}</span>;
        if (!tooltipLabel) return quantity;
        return (
          <Tooltip>
            <TooltipTrigger asChild>{quantity}</TooltipTrigger>
            <TooltipContent className="">
              <p className={` ${tooltipLabel.color}`}>{tooltipLabel.label}</p>
            </TooltipContent>
          </Tooltip>
        );
      }
    },
    {
      key: 'status',
      label: t('Status'),
      render: (value: string) => (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${value === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
          {value === 'active' ? t('Active') : t('Inactive')}
        </span>
      )
    }
  ];

  const actions = [
    { label: t('Toggle Status'), icon: (item: any) => item.status === 'active' ? 'Lock' : 'Unlock', action: 'toggle-status', className: 'text-amber-500', requiredPermission: 'manage-product-status' },
    { label: t('View'), icon: 'Eye', action: 'view', className: 'text-blue-500', requiredPermission: 'view-products' },
    { label: t('Edit'), icon: 'Edit', action: 'edit', className: 'text-amber-500', requiredPermission: 'edit-products' },
    { label: t('Delete'), icon: 'Trash2', action: 'delete', className: 'text-red-500', requiredPermission: 'delete-products' }
  ];

  return (
    <>
      <style>{`
        body { overflow-x: hidden !important; }
      `}</style>
      <PageTemplate title={t("Products")} url="/products" actions={pageActions} breadcrumbs={breadcrumbs} noPadding description={t('Manage your product inventory and catalog.')}>
      <style>{`
                main {
                    max-width: 100vw;
                    overflow-x: hidden !important;
                }
                body {
                    overflow-x: hidden !important;
                }
            `}</style>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 dark:bg-blue-700/20 rounded-bl-full"></div>
            <div className="p-3.5 sm:p-4 relative">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Products')}</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{productStats?.totalProducts || 0}</p>
                </div>
                <div className="relative z-10 p-2 sm:p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5 shrink-0">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 dark:bg-emerald-700/20 rounded-bl-full"></div>
            <div className="p-3.5 sm:p-4 relative">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Active Products')}</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{productStats?.activeProducts || 0}</p>
                </div>
                <div className="relative z-10 p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-700/20 rounded-xl mt-0.5 shrink-0">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-red-50 dark:bg-red-700/20 rounded-bl-full"></div>
            <div className="p-3.5 sm:p-4 relative">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Inactive Products')}</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{productStats?.inactiveProducts || 0}</p>
                </div>
                <div className="relative z-10 p-2 sm:p-2.5 bg-red-50 dark:bg-red-700/20 rounded-xl mt-0.5 shrink-0">
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-orange-50 dark:bg-orange-700/20 rounded-bl-full"></div>
            <div className="p-3.5 sm:p-4 relative">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Out of Stock')}</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{productStats?.outOfStock || 0}</p>
                </div>
                <div className="relative z-10 p-2 sm:p-2.5 bg-orange-50 dark:bg-orange-700/20 rounded-xl mt-0.5 shrink-0">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-yellow-50 dark:bg-yellow-700/20 rounded-bl-full"></div>
            <div className="p-3.5 sm:p-4 relative">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Low Stock')}</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{productStats?.lowStock || 0}</p>
                </div>
                <div className="relative z-10 p-2 sm:p-2.5 bg-yellow-50 dark:bg-yellow-700/20 rounded-xl mt-0.5 shrink-0">
                  <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 border">
          <SearchAndFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearch={handleSearch}
            filters={[
              {
                name: 'category',
                label: t('Category'),
                type: 'select',
                value: selectedCategory,
                onChange: handleCategoryFilter,
                options: [
                  { value: 'all', label: t('All Categories') },
                  ...categories?.map((category: any) => ({ value: category.id.toString(), label: category.name })) || []
                ]
              },
              {
                name: 'brand',
                label: t('Brand'),
                type: 'select',
                value: selectedBrand,
                onChange: handleBrandFilter,
                options: [
                  { value: 'all', label: t('All Brands') },
                  ...brands?.map((brand: any) => ({ value: brand.id.toString(), label: brand.name })) || []
                ]
              }
            ]}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
            onResetFilters={handleResetFilters}
            showViewToggle={true}
            activeView={activeView}
            onViewChange={(view) => {
              setActiveView(view);

              // Update URL with current view
              const currentUrl = new URL(window.location.href);
              const params = new URLSearchParams(currentUrl.search);
              params.set('view', view);

              // Preserve all current filters and pagination
              if (searchTerm) params.set('search', searchTerm);
              if (selectedStatus !== 'all') params.set('status', selectedStatus);
              if (selectedCategory !== 'all') params.set('category', selectedCategory);
              if (selectedBrand !== 'all') params.set('brand', selectedBrand);
              if (pageFilters.per_page) params.set('per_page', pageFilters.per_page.toString());
              if (pageFilters.page) params.set('page', pageFilters.page.toString());
              if (pageFilters.sort_field) params.set('sort_field', pageFilters.sort_field);
              if (pageFilters.sort_direction) params.set('sort_direction', pageFilters.sort_direction);

              router.get(route('products.index'), Object.fromEntries(params), {
                preserveState: true,
                preserveScroll: true
              });
            }}
          />

        {/* Status Tabs */}
          <div className="border-t border-gray-200 dark:border-gray-700 mb-1"></div>
          <div className="ml-2 mr-2">
            <div className="flex space-x-0 overflow-x-auto">
              {statusTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <div key={tab.key} className="relative">
                    <button
                      onClick={() => handleStatusTabChange(tab.key)}
                      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${activeStatusTab === tab.key
                        ? 'text-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{tab.label}</span>
                      <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${activeStatusTab === tab.key
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600'
                        }`}>
                        {tab.count}
                      </span>
                    </button>
                    {activeStatusTab === tab.key && (
                      <div
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-primary rounded-full transition-all duration-200"
                        style={{ width: 'calc(100% - 2rem)' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        {activeView === 'list' ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto w-full">
              <CrudTable
                columns={columns}
                actions={actions}
                data={products?.data || []}
                from={products?.from || 1}
                onAction={handleAction}
                sortField={pageFilters.sort_field}
                sortDirection={pageFilters.sort_direction}
                onSort={handleSort}
                permissions={permissions}
                entityPermissions={{
                  view: 'view-products',
                  create: 'create-products',
                  edit: 'edit-products',
                  delete: 'delete-products'
                }}
              />
            </div>

            <Pagination
              from={products?.from || 0}
              to={products?.to || 0}
              total={products?.total || 0}
              links={products?.links}
              entityName={t("products")}
              onPageChange={(url) => {
                const urlObj = new URL(url, window.location.origin);
                urlObj.searchParams.set('view', activeView);
                if (searchTerm) urlObj.searchParams.set('search', searchTerm);
                if (selectedStatus !== 'all') urlObj.searchParams.set('status', selectedStatus);
                if (selectedCategory !== 'all') urlObj.searchParams.set('category', selectedCategory);
                if (selectedBrand !== 'all') urlObj.searchParams.set('brand', selectedBrand);
                if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
                if (pageFilters.sort_field) urlObj.searchParams.set('sort_field', pageFilters.sort_field);
                if (pageFilters.sort_direction) urlObj.searchParams.set('sort_direction', pageFilters.sort_direction);
                router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
              }}
              currentPerPage={pageFilters.per_page?.toString() || "10"}
              onPerPageChange={(value) => {
                const params: any = { page: 1, per_page: parseInt(value) };
                if (searchTerm) params.search = searchTerm;
                if (selectedStatus !== 'all') params.status = selectedStatus;
                if (selectedCategory !== 'all') params.category = selectedCategory;
                if (selectedBrand !== 'all') params.brand = selectedBrand;
                params.view = activeView;
                if (pageFilters.sort_field) {
                  params.sort_field = pageFilters.sort_field;
                  params.sort_direction = pageFilters.sort_direction;
                }
                router.get(route('products.index'), params, { preserveState: true, preserveScroll: true });
              }}
            />
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products?.data?.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-full p-6 mb-4">
                    <Package className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('No Products Found')}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">{t('No products are available at the moment.')}</p>
                </div>
              )}
              {products?.data?.map((product: any) => {
                const isOutOfStock = product.stock_quantity <= 0;
                const isLowStock = !isOutOfStock && product.stock_quantity <= product.min_stock_level;
                const stockClass = isOutOfStock ? 'text-red-600 font-semibold' : isLowStock ? 'text-yellow-600 font-semibold' : 'text-gray-800 dark:text-gray-200 font-semibold';
                const taxLabel = product.taxes?.length
                  ? product.taxes.map((tax: any) => `${tax.name}${tax.type === 'percentage' ? ` ${tax.rate}%` : ''}`).join(', ')
                  : null;

                return (
                  <Card
                    key={product.id}
                    className="group flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                  >
                    {/* Image */}
                    <div
                      className="relative w-full bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 cursor-pointer"
                      style={{ paddingTop: '66.66%' }}
                      onClick={() => window.open(product.image || `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`, '_blank')}
                    >
                      <img
                        src={product.image || `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-contain p-3"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`;
                        }}
                      />
                    </div>

                    {/* Body */}
                    <div className="flex flex-col flex-1 p-3.5 gap-2.5">
                      {/* Category + Brand */}
                      {product.category && (
                        <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 min-w-0">
                          <span className="truncate" title={product.category.name}>{product.category.name}</span>
                          {product.brand && (
                            <>
                              <span className="shrink-0 text-gray-400">|</span>
                              <span className="truncate" title={product.brand.name}>{product.brand.name}</span>
                            </>
                          )}
                        </p>
                      )}

                      {/* Product name */}
                      <p title={product.name} className="text-left text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                        {product.name}
                      </p>

                      {/* Info rows */}
                      <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 dark:text-gray-500">{t('SKU')}</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300 truncate ml-2 max-w-[60%] text-right" title={product.sku}>{product.sku || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 dark:text-gray-500">{t('Price')}</span>
                          <span className="font-mono text-gray-900 dark:text-white">{window.appSettings.formatCurrency(product.selling_price)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 dark:text-gray-500">{t('Stock')}</span>
                          {(isOutOfStock || isLowStock) ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`cursor-default ${stockClass}`}>{product.stock_quantity}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{isOutOfStock ? t('Out of Stock') : t('Low Stock')}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className={stockClass}>{product.stock_quantity}</span>
                          )}
                        </div>
                        {taxLabel && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 dark:text-gray-500">{t('Tax')}</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300 truncate ml-2 max-w-[60%] text-right" title={taxLabel}>{taxLabel}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 dark:text-gray-500">{t('Status')}</span>
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${product.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                            {product.status === 'active' ? t('Active') : t('Inactive')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer actions */}
                    <div className="flex items-center border-t border-gray-100 dark:border-gray-700">
                      {hasPermission(permissions, 'manage-product-status') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleAction('toggle-status', product)}
                              className="flex-1 flex items-center justify-center py-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
                            >
                              {product.status === 'active' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent><p>{t('Toggle Status')}</p></TooltipContent>
                        </Tooltip>
                      )}
                      {hasPermission(permissions, 'view-products') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleAction('view', product)}
                              className="flex-1 flex items-center justify-center py-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border-l border-gray-100 dark:border-gray-700 cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent><p>{t('View')}</p></TooltipContent>
                        </Tooltip>
                      )}
                      {hasPermission(permissions, 'edit-products') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleAction('edit', product)}
                              className="flex-1 flex items-center justify-center py-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border-l border-gray-100 dark:border-gray-700 cursor-pointer"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                        </Tooltip>
                      )}
                      {hasPermission(permissions, 'delete-products') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleAction('delete', product)}
                              className="flex-1 flex items-center justify-center py-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border-l border-gray-100 dark:border-gray-700 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
              <Pagination
                from={products?.from || 0}
                to={products?.to || 0}
                total={products?.total || 0}
                links={products?.links}
                entityName={t("products")}
                onPageChange={(url) => {
                  const urlObj = new URL(url, window.location.origin);
                  urlObj.searchParams.set('view', activeView);
                  if (searchTerm) urlObj.searchParams.set('search', searchTerm);
                  if (selectedStatus !== 'all') urlObj.searchParams.set('status', selectedStatus);
                  if (selectedCategory !== 'all') urlObj.searchParams.set('category', selectedCategory);
                  if (selectedBrand !== 'all') urlObj.searchParams.set('brand', selectedBrand);
                  if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
                  if (pageFilters.sort_field) urlObj.searchParams.set('sort_field', pageFilters.sort_field);
                  if (pageFilters.sort_direction) urlObj.searchParams.set('sort_direction', pageFilters.sort_direction);
                  router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
                }}
                currentPerPage={pageFilters.per_page?.toString() || "10"}
                onPerPageChange={(value) => {
                  const params: any = { page: 1, per_page: parseInt(value) };
                  if (searchTerm) params.search = searchTerm;
                  if (selectedStatus !== 'all') params.status = selectedStatus;
                  if (selectedCategory !== 'all') params.category = selectedCategory;
                  if (selectedBrand !== 'all') params.brand = selectedBrand;
                  params.view = activeView;
                  if (pageFilters.sort_field) {
                    params.sort_field = pageFilters.sort_field;
                    params.sort_direction = pageFilters.sort_direction;
                  }
                  router.get(route('products.index'), params, { preserveState: true, preserveScroll: true });
                }}
              />
            </div>
          </div>
        )}

        <CrudFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSubmit={handleFormSubmit}
          formConfig={{
            fields: [
              { name: 'name', label: t('Product Name'), type: 'text', required: true, placeholder: 'Enter product name' },
              {
                name: 'sku',
                label: t('SKU'),
                type: 'custom',
                required: true,
                render: (field: any, formData: any, handleChange: any, mode: string) => {
                  if (mode === 'view') {
                    return <div className="p-2 border rounded-md bg-gray-50">{formData.sku || '-'}</div>;
                  }
                  return (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.sku || ''}
                        onChange={(e) => handleChange('sku', e.target.value)}
                        placeholder={t('Enter SKU')}
                        required
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleChange('sku', `SKU-${Date.now()}`)}
                        className="whitespace-nowrap px-3 py-1 h-9 rounded-md border border-input bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                      >
                        {t('Generate')}
                      </button>
                    </div>
                  );
                }
              },
              { name: 'description', label: t('Description'), type: 'textarea', placeholder: 'Enter description' },
              { name: 'category_id', label: t('Category'), type: 'select', searchable: true , required: true, options: categories?.map((cat: any) => ({ value: cat.id, label: cat.name })) || [] },
              { name: 'brand_id', label: t('Brand'), type: 'select', searchable: true , required: true, options: brands?.map((brand: any) => ({ value: brand.id, label: brand.name })) || [] },
              { name: 'unit_id', label: t('Unit'), type: 'select', searchable: true , required: true, options: units?.map((unit: any) => ({ value: unit.id, label: unit.name })) || [] },
              { name: 'purchase_price', label: t('Purchase Price'), type: 'number', required: true, step: '0.01', min: '0', placeholder: '0.00' },
              {
                name: 'selling_price',
                label: t('Selling Price'),
                type: 'number',
                required: true,
                placeholder: '0.00',
                render: (field: any, formData: any, onChange: any, mode: any) => {
                  if (mode === 'view') {
                    return <div className="p-2 border rounded-md bg-gray-50">{formData.selling_price ?? '-'}</div>;
                  }
                  return (
                    <input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      min={formData.purchase_price || '0'}
                      value={formData.selling_price ?? ''}
                      placeholder={field.placeholder}
                      onChange={(e) => onChange(field.name, e.target.value ? parseFloat(e.target.value) : '')}
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  );
                }
              },
              { name: 'stock_quantity', label: t('Stock Quantity'), type: 'number', required: true, min: '0', placeholder: '0.00' },
              { name: 'min_stock_level', label: t('Min Stock Level'), type: 'number', required: true, min: '0', placeholder: '0.00' },
              { name: 'tax_ids', label: t('Taxes'), type: 'multi-select', options: taxes?.map((tax: any) => ({ value: tax.id, label: `${tax.name} (${tax.type === 'percentage' ? tax.rate + '%' : '$' + tax.rate})` })) || [] },
              { name: 'image', label: t('Image'), type: 'media-picker' },
              { name: 'status', label: t('Status'), type: 'select', options: [{ value: 'active', label: t('Active') }, { value: 'inactive', label: t('Inactive') }], defaultValue: 'active' }
            ],
            modalSize: 'xl'
          }}
          initialData={currentItem ? {
            ...currentItem,
            tax_ids: currentItem.taxes?.map((tax: any) => tax.id) || []
          } : null}
          title={formMode === 'create' ? t('Add New Product') : formMode === 'edit' ? t('Edit Product') : t('View Product')}
          mode={formMode}
        />

        <CrudDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          itemName={currentItem?.name || ''}
          entityName="product"
        />
      </PageTemplate>
    </>
  );
}
