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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Receipt, DollarSign, TrendingUp, AlertCircle, Download, Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { hasPermission } from '@/utils/authorization';

export default function ExpenseReport() {
  const { t } = useTranslation();
  const { filters, summary, expenses, categoryBreakdown, monthlyTrend, statusBreakdown, categories, branches, auth } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  const [dateFrom, setDateFrom] = useState(filters.date_from);
  const [dateTo, setDateTo] = useState(filters.date_to);
  const [categoryId, setCategoryId] = useState(filters.category_id || 'all');
  const [branchId, setBranchId] = useState(filters.branch_id || 'all');
  const [status, setStatus] = useState(filters.status || 'all');
  const [chartView, setChartView] = useState(filters.chart_view || 'daily');

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(window.location.pathname, {
      date_from: dateFrom,
      date_to: dateTo,
      category_id: categoryId === 'all' ? undefined : categoryId,
      branch_id: branchId === 'all' ? undefined : branchId,
      status: status === 'all' ? undefined : status,
      chart_view: chartView,
    });
  };

  const handleChartViewChange = (view: string) => {
    setChartView(view);
    router.get(window.location.pathname, {
      date_from: dateFrom,
      date_to: dateTo,
      category_id: categoryId === 'all' ? undefined : categoryId,
      branch_id: branchId === 'all' ? undefined : branchId,
      status: status === 'all' ? undefined : status,
      chart_view: view,
    });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Reports'), href: '#' },
    { title: t('Expense Report') }
  ];

  const handleExport = () => {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
      ...(categoryId !== 'all' && { category_id: categoryId }),
      ...(branchId !== 'all' && { branch_id: branchId }),
      ...(status !== 'all' && { status: status }),
    });
    window.location.href = `${route('reports.expense.export')}?${params.toString()}`;
  };



  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: t('Pending'), color: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' },
      approved: { label: t('Approved'), color: 'bg-green-50 text-green-700 ring-green-600/20' },
      rejected: { label: t('Rejected'), color: 'bg-red-50 text-red-700 ring-red-600/20' },
    };
    return statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-50 text-gray-700 ring-gray-600/20' };
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <PageTemplate 
      title={t("Expense Report")} 
      breadcrumbs={breadcrumbs} 
      noPadding
      actions={hasPermission(permissions, 'export-reports') ? [
        {
          label: t('Export'),
          icon: <Download className="h-4 w-4" />,
          onClick: handleExport
        }
    ] : []}
    description={t('Track and analyze your expenses.')}
    >

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-blue-50 dark:bg-blue-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Expenses')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.total_expenses}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time expenses')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5">
                <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-red-50 dark:bg-red-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Amount')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summary.total_amount)}</span>
                    : <span className="font-mono">{`$${summary.total_amount.toLocaleString()}`}</span>
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time amount')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-red-50 dark:bg-red-700/20 rounded-xl mt-0.5">
                <DollarSign className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-green-50 dark:bg-green-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Approved Amount')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summary.approved_amount)}</span>
                    : <span className="font-mono">{`$${summary.approved_amount.toLocaleString()}`}</span>
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Approved expenses')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-green-50 dark:bg-green-700/20 rounded-xl mt-0.5">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-yellow-50 dark:bg-yellow-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Pending Amount')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summary.pending_amount)}</span>
                    : <span className="font-mono">{`$${summary.pending_amount.toLocaleString()}`}</span>
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Awaiting approval')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-yellow-50 dark:bg-yellow-700/20 rounded-xl mt-0.5">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="mb-6 p-4">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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
            <Label htmlFor="branch">{t('Branch')}</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger>
                <SelectValue placeholder={t('All Branches')} />
              </SelectTrigger>
              <SelectContent searchable>
                <SelectItem value="all">{t('All Branches')}</SelectItem>
                {branches?.map((branch: any) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">{t('Status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t('All Status')} />
              </SelectTrigger>
              <SelectContent searchable>
                <SelectItem value="all">{t('All Status')}</SelectItem>
                <SelectItem value="pending">{t('Pending')}</SelectItem>
                <SelectItem value="approved">{t('Approved')}</SelectItem>
                <SelectItem value="rejected">{t('Rejected')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={router.processing}>{t('Apply Filters')}</Button>
        </form>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Expense Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-start">{t('Expense Trend')}</h3>
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
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                interval={monthlyTrend?.length > 10 ? Math.ceil(monthlyTrend.length / 8) : 0}
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
                formatter={(value) => [window.appSettings?.formatCurrency(Number(value)) || `$${Number(value).toLocaleString()}`, t('Amount')]}
                labelFormatter={(value) => {
                  if (!value) return '';
                  return value; // Show raw date format
                }}
              />
              <Line type="monotone" dataKey="total_amount" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Expenses by Category */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-start">{t('Expenses by Category')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total_amount"
              >
                {categoryBreakdown.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [window.appSettings?.formatCurrency(Number(value)) || `$${Number(value).toLocaleString()}`, t('Amount')]} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-start">{t('Status Breakdown')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statusBreakdown.map((status: any, index: number) => {
            const statusBadge = getStatusBadge(status.status);
            return (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                  <span className="text-sm text-gray-600">{status.count} items</span>
                </div>
                <p className="text-lg font-mono mt-2 text-start">{window.appSettings?.formatCurrency(status.total) || `$${status.total.toLocaleString()}`}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Expenses Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-start">{t('Expense Details')}</h3>
        <div className="max-h-115 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t('Title')}</TableHead>
                <TableHead className="text-start">{t('Category')}</TableHead>
                <TableHead className="text-start">{t('Branch')}</TableHead>
                <TableHead className="text-start">{t('Amount')}</TableHead>
                <TableHead className="text-start">{t('Date')}</TableHead>
                <TableHead className="text-start">{t('Status')}</TableHead>
                <TableHead className="text-start">{t('Description')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses && expenses.length > 0 ? (
                expenses.map((expense: any, index: number) => {
                  const statusBadge = getStatusBadge(expense.status);
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="text-start text-sm font-medium text-gray-900 dark:text-gray-100">
                        {expense.title}
                      </TableCell>
                      <TableCell className="text-start text-sm text-gray-500">
                        {expense.expense_category?.name || '-'}
                      </TableCell>
                      <TableCell className="text-start text-sm text-gray-500">
                        {expense.branch?.name || '-'}
                      </TableCell>
                      <TableCell className="text-start font-mono text-sm text-gray-500">
                        {window.appSettings?.formatCurrency(expense.amount) || `$${expense.amount.toLocaleString()}`}
                      </TableCell>
                      <TableCell className="text-start text-sm text-gray-500">
                        <div className="flex items-center gap-2 text-gray-500 min-w-[110px]">
                          <Calendar className="h-4 w-4" />
                          <span>{window.appSettings?.formatDateTime(expense.expense_date, false) || new Date(expense.expense_date).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-start">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-start text-sm text-gray-500 max-w-xs truncate">
                        {expense.description || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    {t('No expenses found')}
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