import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Percent, Download } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';

export default function FinancialReport() {
  const { t } = useTranslation();
  const { filters, summary, monthlyData, expensesByCategory, auth } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  const [dateFrom, setDateFrom] = useState(filters.date_from);
  const [dateTo, setDateTo] = useState(filters.date_to);
  const [chartView, setChartView] = useState(filters.chart_view || 'daily');

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(window.location.pathname, {
      date_from: dateFrom,
      date_to: dateTo,
      chart_view: chartView,
    });
  };

  const handleChartViewChange = (view: string) => {
    setChartView(view);
    router.get(window.location.pathname, {
      date_from: dateFrom,
      date_to: dateTo,
      chart_view: view,
    });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Reports'), href: '#' },
    { title: t('Financial Report') }
  ];

  const handleExport = () => {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
    });
    window.location.href = `${route('reports.financial.export')}?${params.toString()}`;
  };



  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <PageTemplate 
      title={t("Financial Report")} 
      url="/reports/financial" 
      breadcrumbs={breadcrumbs} 
      noPadding
      actions={hasPermission(permissions, 'export-reports') ? [
        {
          label: t('Export'),
          icon: <Download className="h-4 w-4" />,
          onClick: handleExport
        }
      ] : []}
      description={t('View financial performance and reports.')}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 dark:bg-green-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Revenue')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summary.total_revenue)}</span>
                    : <span className="font-mono">{`$${summary.total_revenue.toLocaleString()}`}</span>
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time revenue')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-green-50 dark:bg-green-700/20 rounded-xl mt-0.5">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 dark:bg-red-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Expenses')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summary.total_expenses)}</span>
                    : <span className="font-mono">{`$${summary.total_expenses.toLocaleString()}`}</span>
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time expenses')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-red-50 dark:bg-red-700/20 rounded-xl mt-0.5">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className={`absolute top-0 right-0 w-20 h-20 ${summary.net_profit >= 0 ? 'bg-green-50 dark:bg-green-700/20' : 'bg-red-50 dark:bg-red-700/20'} rounded-bl-full`}></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Net Profit')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summary.net_profit)}</span>
                    : <span className="font-mono">{`$${summary.net_profit.toLocaleString()}`}</span>
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Profit after expenses')}</p>
              </div>
              <div className={`relative z-10 p-2.5 ${summary.net_profit >= 0 ? 'bg-green-50 dark:bg-green-700/20' : 'bg-red-50 dark:bg-red-700/20'} rounded-xl mt-0.5`}>
                <TrendingUp className={`h-5 w-5 ${summary.net_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 dark:bg-blue-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Profit Margin')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.profit_margin.toFixed(2)}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Profitability ratio')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5">
                <Percent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="mb-6 p-4">
        <form onSubmit={handleFilterSubmit} className="flex items-end gap-4">
          <div className="flex-1">
            <Label htmlFor="date_from">{t('From Date')}</Label>
            <Input
              id="date_from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="date_to">{t('To Date')}</Label>
            <Input
              id="date_to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={router.processing}>{t('Apply Filters')}</Button>
        </form>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('Revenue Trend')}</h3>
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
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                interval={monthlyData?.length > 10 ? Math.ceil(monthlyData.length / 8) : 0}
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
                formatter={(value) => [window.appSettings?.formatCurrency(Number(value)) || `$${Number(value).toLocaleString()}`, t('Revenue')]}
                labelFormatter={(value) => {
                  if (!value) return '';
                  return value; // Show raw date format
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Expenses by Category */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('Expenses by Category')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expensesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total"
              >
                {expensesByCategory.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [window.appSettings?.formatCurrency(Number(value)) || `$${Number(value).toLocaleString()}`, t('Amount')]} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Financial Summary Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t('Financial Summary')}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {t('Total Revenue')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-mono">
                  {window.appSettings?.formatCurrency(summary.total_revenue) || `$${summary.total_revenue.toLocaleString()}`}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {t('Purchase Costs')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-mono">
                  -{window.appSettings?.formatCurrency(summary.purchase_costs) || `$${summary.purchase_costs.toLocaleString()}`}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {t('Gross Profit')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-mono">
                  {window.appSettings?.formatCurrency(summary.gross_profit) || `$${summary.gross_profit.toLocaleString()}`}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {t('Operating Expenses')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-mono">
                  -{window.appSettings?.formatCurrency(summary.total_expenses) || `$${summary.total_expenses.toLocaleString()}`}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {t('Net Profit')}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${summary.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {window.appSettings?.formatCurrency(summary.net_profit) || `$${summary.net_profit.toLocaleString()}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </PageTemplate>
  );
}