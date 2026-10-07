import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, DollarSign, TrendingUp, ShoppingBag, Download, Calendar } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function VendorReport() {
  const { t } = useTranslation();
  const { filters, summary, chartData, topVendors, vendors, auth } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();
  
  const [dateFrom, setDateFrom] = useState(filters.date_from);
  const [dateTo, setDateTo] = useState(filters.date_to);
  const [vendorId, setVendorId] = useState(filters.vendor_id ? filters.vendor_id.toString() : 'all');
  const [chartView, setChartView] = useState(filters.chart_view || 'daily');

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(window.location.pathname, {
      date_from: dateFrom,
      date_to: dateTo,
      vendor_id: vendorId === 'all' ? undefined : vendorId,
      chart_view: chartView,
    });
  };

  const handleChartViewChange = (view: string) => {
    setChartView(view);
    router.get(window.location.pathname, {
      date_from: dateFrom,
      date_to: dateTo,
      vendor_id: vendorId === 'all' ? undefined : vendorId,
      chart_view: view,
    });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Reports'), href: '#' },
    { title: t('Vendor Report') }
  ];

  const handleExport = () => {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
      ...(vendorId !== 'all' && { vendor_id: vendorId }),
    });
    window.location.href = `${route('reports.vendor.export')}?${params.toString()}`;
  };



  return (
    <PageTemplate 
      title={t("Vendor Report")} 
      breadcrumbs={breadcrumbs} 
      noPadding
      actions={hasPermission(permissions, 'export-reports') ? [
        {
          label: t('Export'),
          icon: <Download className="h-4 w-4" />,
          onClick: handleExport
        }
      ] : []}
      description={t('Track vendor performance.')}
    >

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-blue-50 dark:bg-blue-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Vendors')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.total_vendors}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time vendors')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-green-50 dark:bg-green-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Purchase Amount')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summary.total_purchase_amount)}</span>
                    : <span className="font-mono">{`$${summary.total_purchase_amount.toLocaleString()}`}</span>
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time purchase amount')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-green-50 dark:bg-green-700/20 rounded-xl mt-0.5">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-purple-50 dark:bg-purple-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Orders')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.total_orders}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time orders')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-purple-50 dark:bg-purple-700/20 rounded-xl mt-0.5">
                <ShoppingBag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-orange-50 dark:bg-orange-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Avg Order Value')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summary.avg_order_value)}</span>
                    : <span className="font-mono">{`$${summary.avg_order_value.toLocaleString()}`}</span>
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Average per order')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-orange-50 dark:bg-orange-700/20 rounded-xl mt-0.5">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="mb-6 p-4">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="date_from">{t('From Date')}</Label>
            <Input
              id="date_from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="date_to">{t('To Date')}</Label>
            <Input
              id="date_to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="vendor">{t('Vendor')}</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger>
                <SelectValue placeholder={t('All Vendors')} />
              </SelectTrigger>
              <SelectContent searchable>
                <SelectItem value="all">{t('All Vendors')}</SelectItem>
                {vendors?.map((vendor: any) => (
                  <SelectItem key={vendor.id} value={vendor.id.toString()}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">{t('Apply Filters')}</Button>
        </form>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Vendor Purchase Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-start">{t('Vendor Purchase Trend')}</h3>
            <div className="flex gap-2">
              <Button
                variant={chartView === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleChartViewChange('daily')}
              >
                {t('Daily')}
              </Button>
              <Button
                variant={chartView === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleChartViewChange('monthly')}
              >
                {t('Monthly')}
              </Button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                interval={chartData?.length > 10 ? Math.ceil(chartData.length / 8) : 0}
                tickFormatter={(value) => {
                  if (!value) return '';
                  if (chartView === 'monthly') {
                    return value; // Show as 2025-01
                  }
                  return value; // Show as 2025-01-15
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [window.appSettings?.formatCurrency(Number(value)) || `$${Number(value).toLocaleString()}`, t('Purchase Amount')]}
                labelFormatter={(value) => {
                  if (!value) return '';
                  return value; // Show raw date format
                }}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Vendors Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-start">{t('Top Vendors by Purchase Amount')}</h3>
        <div className="max-h-115 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t('Vendor Name')}</TableHead>
                <TableHead className="text-start">{t('Phone')}</TableHead>
                <TableHead className="text-start">{t('Total Orders')}</TableHead>
                <TableHead className="text-start">{t('Total Purchase Amount')}</TableHead>
                <TableHead className="text-start">{t('Avg Order Value')}</TableHead>
                <TableHead className="text-start">{t('Last Order Date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topVendors && topVendors.length > 0 ? (
                topVendors.map((vendor: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="text-start text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback>{getInitials(vendor.name)}</AvatarFallback>
                        </Avatar>
                        <div className="text-start">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{vendor.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{vendor.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-start text-sm text-gray-500">
                      {vendor.phone || '-'}
                    </TableCell>
                    <TableCell className="text-start text-sm text-gray-500">
                      {vendor.total_orders}
                    </TableCell>
                    <TableCell className="text-start font-mono text-sm text-gray-500">
                      {window.appSettings?.formatCurrency(vendor.total_purchase_amount) || `$${vendor.total_purchase_amount.toLocaleString()}`}
                    </TableCell>
                    <TableCell className="text-start font-mono text-sm text-gray-500">
                      {window.appSettings?.formatCurrency(vendor.avg_order_value) || `$${vendor.avg_order_value.toLocaleString()}`}
                    </TableCell>
                    <TableCell className="text-start text-sm text-gray-500">
                      <div className="flex items-center gap-2 text-gray-500 min-w-[110px]">
                        <Calendar className="h-4 w-4" />
                        <span>{vendor.last_order_date ? (window.appSettings?.formatDateTime(vendor.last_order_date, false) || new Date(vendor.last_order_date).toLocaleDateString()) : '-'}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    {t('No vendors found')}
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