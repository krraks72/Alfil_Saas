import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, AlertTriangle, TrendingUp, DollarSign, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { hasPermission } from '@/utils/authorization';

export default function InventoryReport() {
  const { t } = useTranslation();
  const { filters, summary, products, topSellingProducts, categories, brands, auth } = usePage().props as any;
  const permissions = auth?.permissions || [];

  const [categoryId, setCategoryId] = useState(filters.category_id || 'all');
  const [brandId, setBrandId] = useState(filters.brand_id || 'all');
  const [stockFilter, setStockFilter] = useState(filters.stock_filter || 'all');


  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(window.location.pathname, {
      category_id: categoryId === 'all' ? undefined : categoryId,
      brand_id: brandId === 'all' ? undefined : brandId,
      stock_filter: stockFilter === 'all' ? undefined : stockFilter,
    });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Reports'), href: '#' },
    { title: t('Inventory Report') }
  ];

  const handleExport = () => {
    const params = new URLSearchParams({
      ...(categoryId !== 'all' && { category_id: categoryId }),
      ...(brandId !== 'all' && { brand_id: brandId }),
      ...(stockFilter !== 'all' && { stock_filter: stockFilter }),
    });
    window.location.href = `${route('reports.inventory.export')}?${params.toString()}`;
  };



  const getStockStatus = (product: any) => {
    if (product.stock_quantity === 0) {
      return { label: t('Out of Stock'), color: 'bg-red-50 text-red-700 ring-red-600/20' };
    } else if (product.stock_quantity <= product.min_stock_level) {
      return { label: t('Low Stock'), color: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' };
    }
    return { label: t('In Stock'), color: 'bg-green-50 text-green-700 ring-green-600/20' };
  };

  return (
    <PageTemplate
      title={t("Inventory Report")}
      breadcrumbs={breadcrumbs}
      noPadding
      actions={hasPermission(permissions, 'export-reports') ? [
        {
          label: t('Export'),
          icon: <Download className="h-4 w-4" />,
          onClick: handleExport
        }
      ] : []}
      description={t('Track and analyze your inventory.')}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-blue-50 dark:bg-blue-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Products')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.total_products}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All products in inventory')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-green-50 dark:bg-green-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Stock Value')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summary.total_stock_value)}</span>
                    : <span className="font-mono">{`$${summary.total_stock_value.toLocaleString()}`}</span>
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Total inventory value')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-green-50 dark:bg-green-700/20 rounded-xl mt-0.5">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-yellow-50 dark:bg-yellow-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Low Stock Items')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.low_stock_items}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Need restocking soon')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-yellow-50 dark:bg-yellow-700/20 rounded-xl mt-0.5">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-red-50 dark:bg-red-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Out of Stock')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.out_of_stock_items}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Currently unavailable')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-red-50 dark:bg-red-700/20 rounded-xl mt-0.5">
                <Package className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="mb-6 p-4">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="category">{t('Category')}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder={t('All Categories')} />
              </SelectTrigger>
              <SelectContent searchable>
                <SelectItem value="all">{t('All Categories')}</SelectItem>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="brand">{t('Brand')}</Label>
            <Select value={brandId} onValueChange={setBrandId}>
              <SelectTrigger>
                <SelectValue placeholder={t('All Brands')} />
              </SelectTrigger>
              <SelectContent searchable>
                <SelectItem value="all">{t('All Brands')}</SelectItem>
                {brands?.map((brand: any) => (
                  <SelectItem key={brand.id} value={brand.id.toString()}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="low_stock">{t('Stock Filter')}</Label>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent searchable>
                <SelectItem value="all">{t('All Products')}</SelectItem>
                <SelectItem value="low_stock">{t('Low Stock Only')}</SelectItem>
                <SelectItem value="out_of_stock">{t('Out of Stock Only')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">{t('Apply Filters')}</Button>
        </form>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Top Selling Products Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-start">{t('Top Selling Products (Last 30 Days)')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSellingProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_sold" fill="#8884d8" name="Total Sold" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-start">{t('Product Inventory')}</h3>
        <div className="max-h-115 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t('Product')}</TableHead>
                <TableHead className="text-start">{t('Category')}</TableHead>
                <TableHead className="text-start">{t('Brand')}</TableHead>
                <TableHead className="text-start">{t('Stock Quantity')}</TableHead>
                <TableHead className="text-start">{t('Min Level')}</TableHead>
                <TableHead className="text-start">{t('Purchase Price')}</TableHead>
                <TableHead className="text-start">{t('Stock Value')}</TableHead>
                <TableHead className="text-start">{t('Status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products && products.length > 0 ? (
                products.map((product: any, index: number) => {
                  const status = getStockStatus(product);
                  const stockValue = product.stock_quantity * product.purchase_price;

                  return (
                    <TableRow key={index}>
                      <TableCell className="text-start">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image || `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`}
                            alt={product.name}
                            className="w-9 h-9 object-cover rounded shrink-0 cursor-pointer"
                            onClick={() => window.open(product.image || `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`, '_blank')}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`; }}
                          />
                          <div className="min-w-0 text-start">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{product.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-start text-sm text-gray-500">
                        {product.category?.name || '-'}
                      </TableCell>
                      <TableCell className="text-start text-sm text-gray-500">
                        {product.brand?.name || '-'}
                      </TableCell>
                      <TableCell className="text-start text-sm text-gray-500">
                        {product.stock_quantity} {product.unit?.name || ''}
                      </TableCell>
                      <TableCell className="text-start text-sm text-gray-500">
                        {product.min_stock_level}
                      </TableCell>
                      <TableCell className="text-start font-mono text-sm text-gray-500">
                        {window.appSettings?.formatCurrency(product.purchase_price) || `$${product.purchase_price.toLocaleString()}`}
                      </TableCell>
                      <TableCell className="text-start font-mono text-sm text-gray-500">
                        {window.appSettings?.formatCurrency(stockValue) || `$${stockValue.toLocaleString()}`}
                      </TableCell>
                      <TableCell className="text-start">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${status.color}`}>
                          {status.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    {t('No products found')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </PageTemplate>
  );
}
