import React, { useState, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import { RefreshCw, BarChart3, Users, Activity, DollarSign, TrendingUp, Plus, Bell, X, ShoppingCart, Package, FileText, Monitor, Banknote, ArrowUpRight, Receipt, ChevronRight, Calendar, Tag } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { hasPermission } from '@/utils/authorization';
import { Link, usePage, router } from '@inertiajs/react';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart, Area, CartesianGrid, BarChart, Bar, LabelList, Cell, PieChart, Pie } from 'recharts';
import { toast } from 'sonner';

interface RecentCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

interface RecentVendor {
  id: number;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

interface TopProduct {
  id: number;
  name: string;
  sku: string;
  selling_price: number;
  stock_quantity: number;
  total_sold: number;
  image: string | null;
}

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  min_stock_level: number;
  image: string | null;
}

interface CompanyDashboardData {
  stats: {
    totalViews: number;
    monthlyGrowth: number;
    storageUsedBytes?: number;
    planStorageLimit?: number;
    storageUsagePercentage?: number;
  };
  recentCustomers?: RecentCustomer[];
  recentVendors?: RecentVendor[];
  topProducts?: TopProduct[];
  lowStockProducts?: LowStockProduct[];
  salesChartData?: Array<{ label: string; sales: number }>;
  salesPeriod?: string;
  purchaseChartData?: Array<{ label: string; purchases: number }>;
  purchasePeriod?: string;
  recentSaleReturns?: Array<{
    id: number;
    return_number: string;
    customer: string;
    customer_email: string;
    total_amount: number;
    status: string;
    return_date: string;
  }>;
  recentPurchaseReturns?: Array<{
    id: number;
    return_number: string;
    vendor: string;
    vendor_email: string;
    total_amount: number;
    status: string;
    return_date: string;
  }>;
  categoryWiseSales?: Array<{ name: string; total_sales: number }>;
  planOverview?: {
    plan_name: string;
    customer_limit: number;
    vendor_limit: number;
    user_limit: number;
    storage_limit_gb: number;
    customer_used: number;
    vendor_used: number;
    user_used: number;
    storage_used_bytes: number;
    storage_used_pct: number;
    monthly_price: number;
    yearly_price: number;
    expire_date: string | null;
    expire_days_left: number | null;
    is_expired: boolean;
  };
  salesHeatmap?: Array<{
    day: string;
    day_index: number;
    hour: number;
    transactions: number;
    items_sold: number;
    total_amount: number;
  }>;
  notifications?: Array<{
    id: number;
    title: string;
    description: string;
    color: string;
    to_date: string;
  }>;
}

interface PageAction {
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick: () => void;
}

type HeatmapCell = { day: string; day_index: number; hour: number; transactions: number; items_sold: number; total_amount: number };

function SalesHeatmap({ data, t }: { data: HeatmapCell[]; t: (k: string) => string }) {
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const [tooltip, setTooltip] = useState<{ day: string; hour: number; x: number; y: number } | null>(null);

  const lookup: Record<string, Record<number, HeatmapCell>> = {};
  DAYS.forEach(d => { lookup[d] = {}; });
  data.forEach(cell => { if (!lookup[cell.day]) lookup[cell.day] = {}; lookup[cell.day][cell.hour] = cell; });

  const dayTotals: Record<string, { transactions: number; items_sold: number; total_amount: number }> = {};
  DAYS.forEach(d => {
    dayTotals[d] = { transactions: 0, items_sold: 0, total_amount: 0 };
    HOURS.forEach(h => {
      const c = lookup[d]?.[h];
      if (c) { dayTotals[d].transactions += c.transactions; dayTotals[d].items_sold += c.items_sold; dayTotals[d].total_amount += c.total_amount; }
    });
  });
  const weekTotal = Object.values(dayTotals).reduce((s, d) => s + d.transactions, 0);
  const maxVal = Math.max(...data.map(c => c.transactions), 1);

  const getColor = (val: number) => {
    if (val === 0) return 'bg-primary/5';
    const pct = val / maxVal;
    if (pct < 0.2) return 'bg-primary/20';
    if (pct < 0.4) return 'bg-primary/40';
    if (pct < 0.6) return 'bg-primary/60';
    if (pct < 0.8) return 'bg-primary/80';
    return 'bg-primary';
  };

  return (
    <Card className="h-full border border-border shadow-sm dark:bg-slate-900 overflow-hidden flex flex-col">
      <CardHeader className="pb-3 pt-5 px-5 border-b shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base font-semibold">{t('Sales by hour & day')}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{t('Last 7 days')} &middot; {t('darker = busier')}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{t('Low')}</span>
            {['bg-primary/20','bg-primary/40','bg-primary/60','bg-primary/80','bg-primary'].map((c, i) => (
              <div key={i} className={`w-4 h-4 rounded-sm ${c}`} />
            ))}
            <span>{t('High')}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 overflow-x-auto flex-1 flex flex-col">
        <div className="min-w-[640px]">
          <p className="text-xs text-muted-foreground mb-2">00:00 — 23:59</p>
          <div className="flex items-center mb-2 gap-1.5">
            <div className="w-10 shrink-0" />
            {HOURS.map(h => (
              <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground">
                {String(h).padStart(2, '0')}
              </div>
            ))}
          </div>
          {DAYS.map(day => (
            <div key={day} className="flex items-center mb-2 gap-1.5">
              <div className="w-10 shrink-0 text-xs text-muted-foreground text-right pr-2">{day}</div>
              {HOURS.map(h => {
                const val = lookup[day]?.[h]?.transactions ?? 0;
                return (
                  <div
                    key={h}
                    className={`flex-1 aspect-square rounded-sm cursor-pointer transition-transform hover:scale-125 hover:z-10 ${getColor(val)}`}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({ day, hour: h, x: rect.left + rect.width / 2, y: rect.top });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {tooltip && (() => {
          const cell = lookup[tooltip.day]?.[tooltip.hour];
          const dt = dayTotals[tooltip.day];
          const pctWeek = weekTotal > 0 ? ((dt.transactions / weekTotal) * 100).toFixed(1) : '0.0';
          const avgSale = dt.transactions > 0 ? dt.total_amount / dt.transactions : 0;
          return (
            <div
              className="fixed z-50 pointer-events-none bg-popover border border-border rounded-xl shadow-xl p-3 text-xs min-w-[190px]"
              style={{ left: tooltip.x, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }}
            >
              <p className="font-bold text-foreground mb-2">{tooltip.day} &middot; {String(tooltip.hour).padStart(2,'0')}:00</p>
              <div className="space-y-1">
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>{t('Transactions')}:</span>
                  <span className="font-semibold text-foreground">{cell?.transactions ?? 0}</span>
                </div>
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>{t('Items sold')}:</span>
                  <span className="font-semibold text-foreground">{cell?.items_sold ?? 0}</span>
                </div>
                <div className="border-t border-border my-1.5" />
                <p className="font-semibold text-foreground text-[11px]">{tooltip.day} — {t('Day total')}:</p>
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>{t('Total transactions')}:</span>
                  <span className="font-semibold text-foreground">{dt.transactions}</span>
                </div>
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>{t('Items sold')}:</span>
                  <span className="font-semibold text-foreground">{dt.items_sold}</span>
                </div>
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>{t('Avg sale')}:</span>
                  <span className="font-mono text-foreground">{window.appSettings?.formatCurrency ? window.appSettings.formatCurrency(avgSale) : `$${avgSale.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>{t('% of this week')}:</span>
                  <span className="font-semibold text-foreground">{pctWeek}%</span>
                </div>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}

export default function Dashboard({ dashboardData }: { dashboardData: CompanyDashboardData }) {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;
  const getInitials = useInitials();
  const permissions: string[] = auth?.permissions || [];
  const canViewPos = hasPermission(permissions, 'view-pos');
  const canViewSales = hasPermission(permissions, 'view-sales');
  const canViewPurchases = hasPermission(permissions, 'view-purchases');
  const canViewCustomers = hasPermission(permissions, 'view-customers');
  const canViewVendors = hasPermission(permissions, 'view-vendors');
  const canViewProducts = hasPermission(permissions, 'view-products');
  const canViewReports = hasPermission(permissions, 'view-reports');
  const canViewSaleReturns = hasPermission(permissions, 'view-sale-returns');
  const canViewPurchaseReturns = hasPermission(permissions, 'view-purchase-returns');
  const canCreatePurchases = hasPermission(permissions, 'create-purchases');
  const canViewCategories = hasPermission(permissions, 'view-categories');
  const canViewExpenses = hasPermission(permissions, 'view-expenses');
  const [dismissedNotifications, setDismissedNotifications] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('dismissedNotifications') || '[]'); } catch { return []; }
  });
  const [dismissingIds, setDismissingIds] = useState<number[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifModalId = 'dashboard-notifications';
  const [mounted, setMounted] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [selectedSalesPeriod, setSelectedSalesPeriod] = useState<string>(
    () => dashboardData?.salesPeriod ?? 'today'
  );
  const [selectedPurchasePeriod, setSelectedPurchasePeriod] = useState<string>(
    () => dashboardData?.purchasePeriod ?? 'today'
  );

  useEffect(() => {
    setMounted(true);
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
    if (raw) setPrimaryColor(raw);
  }, []);



  const handleSalesPeriodChange = (period: string) => {
    setSelectedSalesPeriod(period);
    router.reload({ data: { salesPeriod: period, purchasePeriod: selectedPurchasePeriod }, only: ['dashboardData'], preserveState: true });
  };

  const handlePurchasePeriodChange = (period: string) => {
    setSelectedPurchasePeriod(period);
    router.reload({ data: { salesPeriod: selectedSalesPeriod, purchasePeriod: period }, only: ['dashboardData'], preserveState: true });
  };

  const notifications = dashboardData?.notifications || [];
  const activeNotifications = notifications.filter((n: any) => !dismissedNotifications.includes(n.id));

  const dismissNotification = (id: number) => {
    setDismissingIds(prev => [...prev, id]);
    setTimeout(() => {
      setDismissedNotifications(prev => {
        const next = [...prev, id];
        localStorage.setItem('dismissedNotifications', JSON.stringify(next));
        return next;
      });
      setDismissingIds(prev => prev.filter(i => i !== id));
    }, 300);
  };

  const dismissAll = () => {
    const ids = activeNotifications.map((n: any) => n.id);
    setDismissingIds(ids);
    setTimeout(() => {
      setDismissedNotifications(prev => {
        const next = [...prev, ...ids];
        localStorage.setItem('dismissedNotifications', JSON.stringify(next));
        return next;
      });
      setDismissingIds([]);
    }, 300);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('Good morning');
    if (h < 17) return t('Good afternoon');
    return t('Good evening');
  };

  const fadeUp = (delay = 0) =>
    `transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}` +
    (delay ? ` delay-[${delay}ms]` : '');

  const formatCurrency = (val: number) =>
    window.appSettings?.formatCurrency(val) ?? `$${val.toLocaleString()}`;

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      sale: 'bg-green-50 text-green-700 ring-green-600/20',
      purchase: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    };
    return colors[type] || 'bg-gray-50 text-gray-700 ring-gray-600/20';
  };

  const pageActions: PageAction[] = [
    {
      label: t('Refresh'),
      icon: <RefreshCw className="h-4 w-4" />,
      variant: 'outline',
      onClick: () => window.location.reload()
    },

  ];

  const stats = dashboardData?.stats || {
    totalViews: 1234,
    monthlyGrowth: 8.5
  };




  // ShareModal state variables removed



  return (
    <PageTemplate
      title={t('Dashboard')}
      description={t('Welcome to your company dashboard.')}
      url="/dashboard"
      actions={pageActions}
    >
      <div className="space-y-6">
        <style>{`
          @keyframes waterWave {
            0%   { transform: translateX(0); }
            50%  { transform: translateX(-25%); }
            100% { transform: translateX(0); }
          }
          .animate-water-wave-1 { animation: waterWave 4s ease-in-out infinite; will-change: transform; }
          .animate-water-wave-2 { animation: waterWave 6s ease-in-out infinite reverse; will-change: transform; }
          .animate-water-wave-3 { animation: waterWave 8s ease-in-out infinite; will-change: transform; }
          @keyframes handWave {
            0%,100% { transform: rotate(0deg); }
            10%  { transform: rotate(18deg); }
            20%  { transform: rotate(-8deg); }
            30%  { transform: rotate(18deg); }
            40%  { transform: rotate(-4deg); }
            50%  { transform: rotate(12deg); }
            60%  { transform: rotate(0deg); }
          }
          .animate-hand-wave { animation: handWave 2.2s ease-in-out infinite; transform-origin: 70% 70%; display: inline-block; }
          .scrollbar-none { scrollbar-width: none; -ms-overflow-style: none; }
          .scrollbar-none::-webkit-scrollbar { display: none; }
        `}</style>

        {/* ── Greeting Banner ── */}
        <div className={`group relative overflow-hidden rounded-2xl bg-slate-800 dark:bg-slate-900 px-4 sm:px-6 py-5 ${fadeUp(0)}`}>
          {/* gradient orbs */}
          <span className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />
          <span className="pointer-events-none absolute -bottom-10 right-0 w-56 h-56 rounded-full bg-blue-500/10 blur-2xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1.5s' }} />
          <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-violet-500/5 blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '0.8s' }} />
          {/* glowing dots */}
          <span className="pointer-events-none absolute top-4 left-1/3 w-1.5 h-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)] animate-ping" style={{ animationDuration: '3s' }} />
          <span className="pointer-events-none absolute bottom-4 left-1/4 w-1 h-1 rounded-full bg-blue-400/70 shadow-[0_0_4px_2px_rgba(96,165,250,0.5)] animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
          <span className="pointer-events-none absolute top-3 right-1/4 w-1.5 h-1.5 rounded-full bg-violet-400/70 shadow-[0_0_6px_2px_rgba(167,139,250,0.5)] animate-ping" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
          <span className="pointer-events-none absolute bottom-3 right-1/3 w-1 h-1 rounded-full bg-emerald-300/80 shadow-[0_0_4px_2px_rgba(110,231,183,0.5)] animate-ping" style={{ animationDuration: '2.8s', animationDelay: '1.8s' }} />
          {/* water wave layers */}
          <div className="pointer-events-none absolute bottom-0 left-0 w-full overflow-hidden" style={{ height: '40px' }}>
            <div className="absolute bottom-0 left-0 w-[200%] animate-water-wave-1">
              <svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="w-full h-[40px]"><path fill="rgba(52,211,153,0.12)" d="M0,20 C150,38 350,0 600,20 C850,38 1050,0 1200,20 C1350,38 1550,0 1800,20 C2050,38 2250,0 2400,20 L2400,40 L0,40 Z" /></svg>
            </div>
            <div className="absolute bottom-0 left-0 w-[200%] animate-water-wave-2">
              <svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="w-full h-[40px]"><path fill="rgba(96,165,250,0.09)" d="M0,26 C200,10 400,38 600,22 C800,8 1000,36 1200,24 C1400,10 1600,38 1800,22 C2000,8 2200,36 2400,24 L2400,40 L0,40 Z" /></svg>
            </div>
            <div className="absolute bottom-0 left-0 w-[200%] animate-water-wave-3">
              <svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="w-full h-[40px]"><path fill="rgba(167,139,250,0.07)" d="M0,30 C300,14 500,38 700,28 C900,16 1100,38 1200,28 C1400,14 1600,38 1900,28 C2100,16 2300,38 2400,28 L2400,40 L0,40 Z" /></svg>
            </div>
          </div>

          {/* top row */}
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* left: greeting */}
            <div className="group-hover:translate-x-1 transition-transform duration-300 min-w-0">
              <p className="text-slate-400 text-sm mb-0.5">{greeting()},</p>
              <div className="flex items-center gap-2">
                <h2 className="text-white text-xl sm:text-2xl font-bold truncate group-hover:text-primary transition-colors duration-300">
                  {auth?.user?.name ?? 'Admin'}
                </h2>
                <span className="animate-hand-wave text-2xl sm:text-3xl select-none">👋</span>
              </div>
              <p className="text-slate-400 text-xs mt-1 group-hover:text-slate-300 transition-colors duration-300">
                {t("Here's what's happening in your store today.")}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.2s' }} />
                  <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1.2s' }} />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1.2s' }} />
                </div>
                <span className="text-primary font-semibold text-sm font-mono">
                  {formatCurrency(stats.todaySales || 0)} {t("today's sales")}
                </span>
              </div>
            </div>

            {/* right: stat pills + quick links */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-xl bg-white/10 px-4 py-2.5 text-center min-w-[80px] hover:bg-white/15 hover:scale-105 transition-all duration-300">
                <p className="text-white text-lg font-mono leading-tight">{formatCurrency(stats.todaySales || 0)}</p>
                <p className="text-slate-400 text-[11px]">{t('Today Sales')}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-2.5 text-center min-w-[80px] hover:bg-white/15 hover:scale-105 transition-all duration-300">
                <p className="text-emerald-400 text-lg font-bold leading-tight">{stats.monthlyGrowth ?? 0}%</p>
                <p className="text-slate-400 text-[11px]">{t('Growth')}</p>
              </div>
              {/* Notification bell button */}
              <button
                onClick={() => setNotifOpen(true)}
                className="relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 hover:bg-white/10 transition-all duration-200"
              >
                <div className="relative">
                  <Bell className="h-5 w-5 text-amber-300" />
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                    {activeNotifications.length}
                  </span>
                </div>
                <span className="text-slate-400 text-[10px] whitespace-nowrap">{t('Notifications')}</span>
              </button>
              <div className="w-px h-10 bg-white/10 hidden sm:block" />
              {[
                { icon: Monitor, label: t('POS'), href: route('pos.index'), color: 'text-emerald-300 hover:text-emerald-200', bg: 'hover:bg-emerald-400/10', show: canViewPos },
                { icon: Package, label: t('Products'), href: route('products.index'), color: 'text-blue-300 hover:text-blue-200', bg: 'hover:bg-blue-400/10', show: canViewProducts },
                { icon: Users, label: t('Customers'), href: route('customers.index'), color: 'text-violet-300 hover:text-violet-200', bg: 'hover:bg-violet-400/10', show: canViewCustomers },
                { icon: FileText, label: t('Reports'), href: route('reports.sales'), color: 'text-slate-300 hover:text-slate-200', bg: 'hover:bg-white/10', show: canViewReports },
              ].filter(item => item.show).map(({ icon: Icon, label, href, color, bg }) => (
                <Link key={label} href={href} className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 ${bg} group/qa`}>
                  <Icon className={`h-5 w-5 transition-all duration-200 ${color} group-hover/qa:-translate-y-0.5`} />
                  <span className="text-slate-400 text-[10px] whitespace-nowrap group-hover/qa:text-slate-300 transition-colors duration-200">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications Dialog */}
        <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
          <DialogContent modalId={notifModalId} className="max-w-lg p-0 gap-0 overflow-hidden">
            <DialogHeader className="px-5 py-4 border-b bg-muted/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-sm font-semibold">{t('Notifications')}</DialogTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {activeNotifications.length} {t('active')}
                    </p>
                  </div>
                </div>
                {/* {activeNotifications.length > 0 && (
                  <button
                    onClick={dismissAll}
                    className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors mr-6"
                  >
                    {t('Clear all')}
                  </button>
                )} */}
              </div>
            </DialogHeader>

            {/* Notification list */}
            <div className="overflow-y-auto max-h-[60vh]">
              {activeNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <Bell className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('No notifications available')}</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activeNotifications.map((n: any) => (
                    <div
                      key={n.id}
                      className="px-5 py-4 transition-all duration-300"
                      style={{
                        opacity: dismissingIds.includes(n.id) ? 0 : 1,
                        transform: dismissingIds.includes(n.id) ? 'translateX(12px)' : 'translateX(0)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: n.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap">{n.description}</p>
                            <div className="flex items-center gap-1.5 mt-2.5">
                              <Calendar className="h-3 w-3 text-muted-foreground/60" />
                              <span className="text-[11px] text-muted-foreground/70">
                                {t('Valid until')} {new Date(n.to_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => dismissNotification(n.id)}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors mt-0.5"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        {/* ── KPI Cards ── */}
        <div className={`grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 ${fadeUp(100)}`}>

          {/* Total Sales */}
          {canViewSales ? (
            <Link href={route('sales.index')} className="group">
              <Card className="h-full border border-emerald-300 dark:border-emerald-800 shadow-sm bg-emerald-50 dark:bg-emerald-950/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <CardContent className="relative overflow-hidden p-3 sm:p-5">
                  <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-emerald-300/40 dark:bg-emerald-500/10 animate-ping" style={{ animationDuration: '6s' }} />
                  <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-emerald-200/30 dark:bg-emerald-600/10 animate-pulse" style={{ animationDuration: '7s' }} />
                  <span className="pointer-events-none absolute bottom-1 right-8 w-7 h-7 rounded-full bg-emerald-400/30 dark:bg-emerald-400/10 animate-ping" style={{ animationDuration: '5s', animationDelay: '2s' }} />
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/60 p-2 sm:p-2.5">
                      <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-emerald-300 group-hover:text-emerald-600 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-400 text-xs mb-1 truncate">{t('Total Sales')}</p>
                  <p className="text-emerald-900 dark:text-emerald-100 text-lg xl:text-2xl font-mono tracking-tight truncate">{formatCurrency(stats.totalSales || 0)}</p>
                  <p className="text-emerald-600 dark:text-emerald-500 text-[11px] mt-1.5 truncate">{t('all time sales')}</p>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <div className="group">
              <Card className="h-full border border-emerald-300 dark:border-emerald-800 shadow-sm bg-emerald-50 dark:bg-emerald-950/40">
                <CardContent className="relative overflow-hidden p-3 sm:p-5">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/60 p-2 sm:p-2.5">
                      <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-400 text-xs mb-1 truncate">{t('Total Sales')}</p>
                  <p className="text-emerald-900 dark:text-emerald-100 text-lg xl:text-2xl font-mono tracking-tight truncate">{formatCurrency(stats.totalSales || 0)}</p>
                  <p className="text-emerald-600 dark:text-emerald-500 text-[11px] mt-1.5 truncate">{t('all time sales')}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Total Purchase */}
          {canViewPurchases ? (
            <Link href={route('purchases.index')} className="group">
              <Card className="h-full border border-blue-200 dark:border-blue-900/50 shadow-sm bg-blue-50 dark:bg-blue-950/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <CardContent className="relative overflow-hidden p-3 sm:p-5">
                  <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-blue-300/40 dark:bg-blue-500/10 animate-ping" style={{ animationDuration: '7s' }} />
                  <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-blue-200/30 dark:bg-blue-600/10 animate-pulse" style={{ animationDuration: '8s' }} />
                  <span className="pointer-events-none absolute bottom-1 right-8 w-7 h-7 rounded-full bg-blue-400/30 dark:bg-blue-400/10 animate-ping" style={{ animationDuration: '6s', animationDelay: '1.5s' }} />
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="rounded-xl bg-blue-100 dark:bg-blue-900/50 p-2 sm:p-2.5">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-blue-200 group-hover:text-blue-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <p className="text-blue-700 dark:text-blue-400 text-xs mb-1 truncate">{t('Total Purchase')}</p>
                  <p className="text-blue-900 dark:text-blue-100 text-lg xl:text-2xl font-mono tracking-tight truncate">{formatCurrency(stats.totalPurchases || 0)}</p>
                  <p className="text-blue-600 dark:text-blue-500 text-[11px] mt-1.5 truncate">{t('all time purchases')}</p>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <div className="group">
              <Card className="h-full border border-blue-200 dark:border-blue-900/50 shadow-sm bg-blue-50 dark:bg-blue-950/30">
                <CardContent className="relative overflow-hidden p-3 sm:p-5">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="rounded-xl bg-blue-100 dark:bg-blue-900/50 p-2 sm:p-2.5">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-blue-700 dark:text-blue-400 text-xs mb-1 truncate">{t('Total Purchase')}</p>
                  <p className="text-blue-900 dark:text-blue-100 text-lg xl:text-2xl font-mono tracking-tight truncate">{formatCurrency(stats.totalPurchases || 0)}</p>
                  <p className="text-blue-600 dark:text-blue-500 text-[11px] mt-1.5 truncate">{t('all time purchases')}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Total Expenses */}
          {canViewExpenses ? (
            <Link href={route('expenses.index')} className="group">
              <div className="group">
                <Card className="h-full border border-rose-200 dark:border-rose-900/50 shadow-sm bg-rose-50 dark:bg-rose-950/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <CardContent className="relative overflow-hidden p-3 sm:p-5">
                    <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-rose-300/40 dark:bg-rose-500/10 animate-ping" style={{ animationDuration: '8s' }} />
                    <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-rose-200/30 dark:bg-rose-600/10 animate-pulse" style={{ animationDuration: '6s' }} />
                    <span className="pointer-events-none absolute bottom-1 right-8 w-7 h-7 rounded-full bg-rose-400/30 dark:bg-rose-400/10 animate-ping" style={{ animationDuration: '5s', animationDelay: '2.5s' }} />
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="rounded-xl bg-rose-100 dark:bg-rose-900/50 p-2 sm:p-2.5">
                        <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-rose-200 group-hover:text-rose-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                    </div>
                    <p className="text-rose-700 dark:text-rose-400 text-xs mb-1 truncate">{t('Total Expenses')}</p>
                    <p className="text-rose-900 dark:text-rose-100 text-lg xl:text-2xl font-mono tracking-tight truncate">{formatCurrency(stats.totalExpenses || 0)}</p>
                    <p className="text-rose-600 dark:text-rose-500 text-[11px] mt-1.5 truncate">{t('approved expenses')}</p>
                  </CardContent>
                </Card>
              </div>
            </Link>
          ) : (
            <div className="group">
              <Card className="h-full border border-rose-200 dark:border-rose-900/50 shadow-sm bg-rose-50 dark:bg-rose-950/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <CardContent className="relative overflow-hidden p-3 sm:p-5">
                  <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-rose-300/40 dark:bg-rose-500/10 animate-ping" style={{ animationDuration: '8s' }} />
                  <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-rose-200/30 dark:bg-rose-600/10 animate-pulse" style={{ animationDuration: '6s' }} />
                  <span className="pointer-events-none absolute bottom-1 right-8 w-7 h-7 rounded-full bg-rose-400/30 dark:bg-rose-400/10 animate-ping" style={{ animationDuration: '5s', animationDelay: '2.5s' }} />
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="rounded-xl bg-rose-100 dark:bg-rose-900/50 p-2 sm:p-2.5">
                      <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 dark:text-rose-400" />
                    </div>
                  </div>
                  <p className="text-rose-700 dark:text-rose-400 text-xs mb-1 truncate">{t('Total Expenses')}</p>
                  <p className="text-rose-900 dark:text-rose-100 text-lg xl:text-2xl font-mono tracking-tight truncate">{formatCurrency(stats.totalExpenses || 0)}</p>
                  <p className="text-rose-600 dark:text-rose-500 text-[11px] mt-1.5 truncate">{t('approved expenses')}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Monthly Sales */}
          <div className="group">
            <Card className="h-full border border-violet-200 dark:border-violet-900/50 shadow-sm bg-violet-50 dark:bg-violet-950/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardContent className="relative overflow-hidden p-3 sm:p-5">
                <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-violet-300/40 dark:bg-violet-500/10 animate-ping" style={{ animationDuration: '7s' }} />
                <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-violet-200/30 dark:bg-violet-600/10 animate-pulse" style={{ animationDuration: '8s' }} />
                <span className="pointer-events-none absolute bottom-1 right-8 w-7 h-7 rounded-full bg-violet-400/30 dark:bg-violet-400/10 animate-ping" style={{ animationDuration: '6s', animationDelay: '1s' }} />
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="rounded-xl bg-violet-100 dark:bg-violet-900/50 p-2 sm:p-2.5">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                </div>
                <p className="text-violet-700 dark:text-violet-400 text-xs mb-1 truncate">{t('Monthly Sales')}</p>
                <p className="text-violet-900 dark:text-violet-100 text-lg xl:text-2xl font-mono tracking-tight truncate">{formatCurrency(stats.monthlySales || 0)}</p>
                <p className="text-violet-500 dark:text-violet-400 text-[11px] mt-1.5 flex items-center gap-0.5 truncate">
                  <TrendingUp className="h-3 w-3 shrink-0" /> +{stats.monthlyGrowth ?? 0}% {t('vs last month')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Purchases */}
          <div className="group">
            <Card className="h-full border border-indigo-200 dark:border-indigo-900/50 shadow-sm bg-indigo-50 dark:bg-indigo-950/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardContent className="relative overflow-hidden p-3 sm:p-5">
                <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-indigo-300/40 dark:bg-indigo-500/10 animate-ping" style={{ animationDuration: '7s' }} />
                <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-indigo-200/30 dark:bg-indigo-600/10 animate-pulse" style={{ animationDuration: '9s' }} />
                <span className="pointer-events-none absolute bottom-1 right-8 w-7 h-7 rounded-full bg-indigo-400/30 dark:bg-indigo-400/10 animate-ping" style={{ animationDuration: '6s', animationDelay: '3s' }} />
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="rounded-xl bg-indigo-100 dark:bg-indigo-900/50 p-2 sm:p-2.5">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <p className="text-indigo-700 dark:text-indigo-400 text-xs mb-1 truncate">{t('Monthly Purchases')}</p>
                <p className="text-indigo-900 dark:text-indigo-100 text-lg xl:text-2xl font-mono tracking-tight truncate">{formatCurrency(stats.monthlyPurchases || 0)}</p>
                <p className="text-indigo-500 dark:text-indigo-400 text-[11px] mt-1.5 truncate">{t('this month')}</p>
              </CardContent>
            </Card>
          </div>

        </div>

        <div className="space-y-6">
          {/* Recent Returns — Dual Split-Panel */}
          {(canViewSaleReturns || canViewPurchaseReturns) && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* ── Sale Returns Panel ── */}
              {canViewSaleReturns && (
                <Card className="border border-border shadow-sm dark:bg-slate-900 overflow-hidden flex flex-col">
                  {/* Header */}
                  <CardHeader className="pb-3 pt-5 px-5 border-b shrink-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                          <TrendingUp className="h-4.5 w-4.5 text-primary" style={{ width: '18px', height: '18px' }} />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold">{t('Sale Returns')}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">{t('Recent customer returns')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={route('sale-returns.index')} className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 hover:gap-1.5 transition-all duration-150">
                          {t('View all')} <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Entries */}
                  <CardContent className="p-0 flex-1">
                    {dashboardData.recentSaleReturns && dashboardData.recentSaleReturns.length > 0 ? (
                      <div className="divide-y divide-border/60 overflow-y-auto max-h-[320px]">
                        {dashboardData.recentSaleReturns.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors duration-150 group"
                          >
                            {/* Avatar */}
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback>
                                {getInitials(r.customer)}
                              </AvatarFallback>
                            </Avatar>

                            {/* Name + Return # */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{r.customer}</p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {canViewSaleReturns
                                  ? <Link href={route('sale-returns.show', r.id)} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-150">{r.return_number}</Link>
                                  : r.return_number}
                                {r.return_date && (
                                  <span className="ml-1.5 text-muted-foreground/60">· {window.appSettings?.formatDateTime ? window.appSettings.formatDateTime(r.return_date, false) : new Date(r.return_date).toLocaleDateString()}</span>
                                )}
                              </p>
                            </div>

                            {/* Amount + Status */}
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              <span className="text-xs font-mono text-foreground whitespace-nowrap">
                                {window.appSettings?.formatCurrency ? window.appSettings.formatCurrency(r.total_amount) : `$${r.total_amount}`}
                              </span>
                              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap ${
                                r.status === 'approved'
                                  ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/30'
                                  : r.status === 'pending'
                                    ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/30'
                                    : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-500/30'
                              }`}>
                                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 gap-3">
                        <div className="rounded-full bg-violet-50 dark:bg-violet-900/20 p-4">
                          <TrendingUp className="h-6 w-6 text-violet-400 dark:text-violet-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">{t('No sale returns found')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ── Purchase Returns Panel ── */}
              {canViewPurchaseReturns && (
                <Card className="border border-border shadow-sm dark:bg-slate-900 overflow-hidden flex flex-col">
                  {/* Header */}
                  <CardHeader className="pb-3 pt-5 px-5 border-b shrink-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                          <ShoppingCart className="h-4.5 w-4.5 text-primary" style={{ width: '18px', height: '18px' }} />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold">{t('Purchase Returns')}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">{t('Recent vendor returns')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={route('purchase-returns.index')} className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 hover:gap-1.5 transition-all duration-150">
                          {t('View all')} <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Entries */}
                  <CardContent className="p-0 flex-1">
                    {dashboardData.recentPurchaseReturns && dashboardData.recentPurchaseReturns.length > 0 ? (
                      <div className="divide-y divide-border/60 overflow-y-auto max-h-[320px]">
                        {dashboardData.recentPurchaseReturns.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors duration-150 group"
                          >
                            {/* Avatar */}
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback>
                                {getInitials(r.vendor)}
                              </AvatarFallback>
                            </Avatar>

                            {/* Name + Return # */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{r.vendor}</p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {canViewPurchaseReturns
                                  ? <Link href={route('purchase-returns.show', r.id)} className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-150">{r.return_number}</Link>
                                  : r.return_number}
                                {r.return_date && (
                                  <span className="ml-1.5 text-muted-foreground/60">· {window.appSettings?.formatDateTime ? window.appSettings.formatDateTime(r.return_date, false) : new Date(r.return_date).toLocaleDateString()}</span>
                                )}
                              </p>
                            </div>

                            {/* Amount + Status */}
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              <span className="text-xs font-mono text-foreground whitespace-nowrap">
                                {window.appSettings?.formatCurrency ? window.appSettings.formatCurrency(r.total_amount) : `$${r.total_amount}`}
                              </span>
                              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap ${
                                r.status === 'approved'
                                  ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/30'
                                  : r.status === 'pending'
                                    ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/30'
                                    : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-500/30'
                              }`}>
                                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 gap-3">
                        <div className="rounded-full bg-orange-50 dark:bg-orange-900/20 p-4">
                          <ShoppingCart className="h-6 w-6 text-orange-400 dark:text-orange-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">{t('No purchase returns found')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            </div>
          )}

          {/* Heatmap & Plan Overview Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

            {/* Sales by Hour & Day Heatmap (60% Width) */}
            <div className="lg:col-span-3 h-full">
              {dashboardData.salesHeatmap && dashboardData.salesHeatmap.length > 0 ? (
                <SalesHeatmap data={dashboardData.salesHeatmap} t={t} />
              ) : (
                <Card className="border border-border shadow-sm dark:bg-slate-900 overflow-hidden h-full flex flex-col items-center justify-center p-6 min-h-[300px]">
                  <p className="text-muted-foreground text-sm">{t('No heatmap data available')}</p>
                </Card>
              )}
            </div>

            {/* Plan Overview (40% Width) */}
            <div className="lg:col-span-2 h-full">
              {(() => {
                const po = dashboardData.planOverview;
                if (!po) return null;
                const formatGB = (bytes: number) => (bytes / (1024 * 1024 * 1024)).toFixed(1);
                const storageUsed = parseFloat(formatGB(po.storage_used_bytes));

                const items = [
                  { label: t('Customers'), used: po.customer_used, limit: po.customer_limit, color: '#93c5fd', suffix: '' },
                  { label: t('Vendors'),   used: po.vendor_used,   limit: po.vendor_limit,   color: '#fdba74', suffix: '' },
                  { label: t('Users'),     used: po.user_used,     limit: po.user_limit,     color: '#c4b5fd', suffix: '' },
                  { label: t('Storage'),   used: storageUsed,      limit: po.storage_limit_gb, color: '#6ee7b7', suffix: ' GB' },
                ];

                const totalUsed = po.customer_used + po.vendor_used + po.user_used + storageUsed;
                const totalLimit = po.customer_limit + po.vendor_limit + po.user_limit + po.storage_limit_gb;
                const overallPct = totalLimit > 0 ? Math.min(Math.round((totalUsed / totalLimit) * 100), 100) : 0;

                const pieData = items.map(({ label, used, limit, color }) => ({
                  name: label,
                  value: limit > 0 ? Math.max(Math.min((used / limit) * 100, 100), 0.5) : 0.5,
                  color,
                }));

                return (
                  <Card className="border border-border shadow-sm dark:bg-slate-900 overflow-hidden h-full flex flex-col">
                    {/* Header */}
                    <CardHeader className="pb-3 pt-5 px-5 border-b shrink-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold">{t('Plan Overview')}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">{t('Your current plan usage')}</p>
                        </div>
                        <span className="inline-flex items-center rounded-md border border-primary/30 px-2 py-1 ring-1 ring-inset ring-primary/20 text-xs font-medium text-primary">
                          {po.plan_name}
                        </span>
                      </div>
                    </CardHeader>

                    {/* Pricing Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border-b shrink-0">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                          <Tag className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground truncate">{t('Monthly')}</p>
                          <p className="text-sm font-bold text-foreground font-mono truncate">{window.appSettings?.formatCurrency ? window.appSettings.formatCurrency(po.monthly_price) : `$${po.monthly_price}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                          <Tag className="h-4 w-4 text-orange-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground truncate">{t('Yearly')}</p>
                          <p className="text-sm font-bold text-foreground font-mono truncate">{window.appSettings?.formatCurrency ? window.appSettings.formatCurrency(po.yearly_price) : `$${po.yearly_price}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                          <Calendar className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground truncate">{t('Expires on')}</p>
                          <p className={`text-sm font-bold truncate ${po.is_expired ? 'text-red-500' : (po.expire_days_left !== null && po.expire_days_left <= 7) ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {window.appSettings?.formatDateTime ? window.appSettings.formatDateTime(po.expire_date || '-', false) : (po.expire_date || '-')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-center">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-2">
                        {/* Donut Chart - center */}
                        <div className="relative flex items-center justify-center w-full min-h-[180px] sm:min-h-[220px] flex-1">
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={75}
                                paddingAngle={3}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                                isAnimationActive={true}
                                label={false}
                                labelLine={false}
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={index} fill={entry.color} stroke="none" />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>

                          {/* Center label */}
                          <div className="absolute flex flex-col items-center pointer-events-none text-center">
                            <span className="text-2xl sm:text-3xl font-extrabold text-foreground">{overallPct}%</span>
                            <span className="text-xs sm:text-sm font-semibold text-foreground mt-0.5">{t('Total Usage')}</span>
                          </div>
                        </div>

                        {/* Legends */}
                        <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2.5 sm:gap-3 w-full sm:w-32 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                          {items.map(({ label, color }) => (
                            <div key={label} className="flex items-center gap-1.5 min-w-0">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <p className="text-xs text-muted-foreground truncate">{label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          </div>

          {/* Sales chart */}
          {canViewSales && <Card className="border border-border shadow-sm dark:bg-slate-900 overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-4 sm:px-5 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">{t('Sales Overview')}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedSalesPeriod === 'today' ? t('Hourly sales for today') :
                      selectedSalesPeriod === '7d' ? t('Daily sales for last 7 days') :
                        selectedSalesPeriod === '14d' ? t('Daily sales for last 14 days') :
                          t('Daily sales for last 30 days')}
                  </p>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {(['today', '7d', '14d', '30d'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSalesPeriodChange(p)}
                      className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium shrink-0 transition-all duration-150 ${selectedSalesPeriod === p
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                      {p === 'today' ? t('Today') : p}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 pt-4 sm:pt-5">
              {dashboardData.salesChartData && dashboardData.salesChartData.length > 0 ? (
                <div className="w-full h-[260px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={dashboardData.salesChartData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      accessibilityLayer={false}
                    >
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={primaryColor} stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={primaryColor} strokeOpacity={0.2} vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: 'currentColor' }}
                        className="text-muted-foreground"
                        axisLine={{ stroke: primaryColor, strokeOpacity: 0.4 }}
                        tickLine={false}
                        interval={selectedSalesPeriod === '30d' ? 'preserveStartEnd' : selectedSalesPeriod === '14d' ? 1 : selectedSalesPeriod === 'today' ? 3 : 0}
                        minTickGap={12}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'currentColor' }}
                        className="text-muted-foreground"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => {
                          if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                          if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
                          return window.appSettings?.formatCurrency ? window.appSettings.formatCurrency(v) : `$${v}`;
                        }}
                        width={50}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: `1px solid ${primaryColor}30`,
                          background: 'hsl(var(--popover))',
                          color: 'hsl(var(--popover-foreground))',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                        formatter={(value: number) => [
                          window.appSettings?.formatCurrency ? window.appSettings.formatCurrency(value) : `$${value}`,
                          t('Sales'),
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke={primaryColor}
                        strokeWidth={2}
                        fill="url(#salesGrad)"
                        dot={{ r: 2.5, fill: primaryColor, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: primaryColor, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <div className="rounded-full bg-muted p-4 animate-pulse">
                    <TrendingUp className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('No sales data available')}</p>
                </div>
              )}
            </CardContent>
          </Card>}

          {/* Purchase chart */}
          {canViewPurchases && <Card className="border border-border shadow-sm dark:bg-slate-900 overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-4 sm:px-5 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">{t('Purchase Overview')}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedPurchasePeriod === 'today' ? t('Hourly purchases for today') :
                      selectedPurchasePeriod === '7d' ? t('Daily purchases for last 7 days') :
                        selectedPurchasePeriod === '14d' ? t('Daily purchases for last 14 days') :
                          t('Daily purchases for last 30 days')}
                  </p>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {(['today', '7d', '14d', '30d'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePurchasePeriodChange(p)}
                      className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium shrink-0 transition-all duration-150 ${selectedPurchasePeriod === p
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                      {p === 'today' ? t('Today') : p}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 pt-4 sm:pt-5">
              {dashboardData.purchaseChartData && dashboardData.purchaseChartData.length > 0 ? (
                <div className="w-full h-[260px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dashboardData.purchaseChartData}
                      margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
                      accessibilityLayer={false}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={primaryColor} strokeOpacity={0.2} vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: 'currentColor' }}
                        className="text-muted-foreground"
                        axisLine={{ stroke: primaryColor, strokeOpacity: 0.4 }}
                        tickLine={false}
                        interval={selectedPurchasePeriod === '30d' ? 'preserveStartEnd' : selectedPurchasePeriod === '14d' ? 1 : selectedPurchasePeriod === 'today' ? 3 : 0}
                        minTickGap={12}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'currentColor' }}
                        className="text-muted-foreground"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => {
                          if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                          if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
                          return window.appSettings?.formatCurrency ? window.appSettings.formatCurrency(v) : `$${v}`;
                        }}
                        width={50}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: `1px solid ${primaryColor}30`,
                          background: 'hsl(var(--popover))',
                          color: 'hsl(var(--popover-foreground))',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                        formatter={(value: number) => [
                          window.appSettings?.formatCurrency ? window.appSettings.formatCurrency(value) : `$${value}`,
                          t('Purchases'),
                        ]}
                      />
                      <Bar dataKey="purchases" radius={[4, 4, 0, 0]} maxBarSize={30} isAnimationActive={false}>
                        <LabelList
                          dataKey="purchases"
                          position="top"
                          className="hidden xl:block"
                          style={{ fontSize: 10, fill: primaryColor, fontWeight: 600 }}
                          formatter={(v: number) => (v > 0 ? (v >= 1000 ? `${(v/1000).toFixed(1)}k` : (window.appSettings?.formatCurrency ? window.appSettings.formatCurrency(v) : `$${v}`)) : '')}
                        />
                        {dashboardData.purchaseChartData.map((_, i) => (
                          <Cell key={i} fill={primaryColor} fillOpacity={0.7} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <div className="rounded-full bg-muted p-4 animate-pulse">
                    <ShoppingCart className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('No purchase data available')}</p>
                </div>
              )}
            </CardContent>
          </Card>}


          {/* Top products & Low stock Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Top Products */}
            {canViewProducts && <Card className="border border-border shadow-sm dark:bg-slate-900 overflow-hidden">
              <CardHeader className="pb-3 pt-5 px-5 border-b">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">{t('Most Sellable Products')}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('Best selling products by quantity')}</p>
                  </div>
                  <Link href={route('products.index')} className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 hover:gap-1.5 transition-all duration-150">
                    {t('View all')} <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {dashboardData.topProducts && dashboardData.topProducts.length > 0 ? (
                  <div className="overflow-y-auto max-h-[390px]">
                    {dashboardData.topProducts.map((product, i) => {
                      const isLast = i === (dashboardData.topProducts?.length ?? 0) - 1;
                      return (
                        <div key={product.id} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 dark:hover:bg-slate-800/60 transition-colors duration-150 ${!isLast ? 'border-b border-border/60' : ''}`}>
                          <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                            {product.image
                              ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              : <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">#{i + 1}</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{product.sku || '-'}</p>
                          </div>
                          <div className="shrink-0 text-right space-y-1">
                            <p className="text-xs font-mono text-foreground whitespace-nowrap">
                              {window.appSettings?.formatCurrency ? window.appSettings.formatCurrency(product.selling_price) : `$${product.selling_price}`}
                            </p>
                            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-500/30">
                              {product.total_sold} {t('sold')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <div className="rounded-full bg-muted p-4">
                      <Package className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('No sales data found')}</p>
                  </div>
                )}
              </CardContent>
            </Card>}

            {/* Low Stock Products */}
            <Card className="border border-border shadow-sm dark:bg-slate-900 overflow-hidden">
              <CardHeader className="pb-3 pt-5 px-5 border-b">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">{t('Low Stock')}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('Products below minimum stock level')}</p>
                  </div>
                  {canCreatePurchases && <Link href={route('purchases.create')} className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 hover:gap-1.5 transition-all duration-150">
                    {t('Reorder')} <ChevronRight className="h-3.5 w-3.5" />
                  </Link>}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {dashboardData.lowStockProducts && dashboardData.lowStockProducts.length > 0 ? (
                  <div className="overflow-y-auto max-h-[390px]">
                    {dashboardData.lowStockProducts.map((product, i) => {
                      const isLast = i === (dashboardData.lowStockProducts?.length ?? 0) - 1;
                      return (
                        <div key={product.id} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 dark:hover:bg-slate-800/60 transition-colors duration-150 ${!isLast ? 'border-b border-border/60' : ''}`}>
                          <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                            {product.image
                              ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              : <Package className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{product.sku || '-'}</p>
                          </div>
                          <div className="shrink-0 text-right space-y-1">
                            <p className="text-xs font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
                              {product.stock_quantity} {t('in stock')}
                            </p>
                            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-500/30">
                              {t('Min')}: {product.min_stock_level}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <div className="rounded-full bg-muted p-4">
                      <Package className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('All products are well stocked')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Customers & Vendors Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Recent Customers */}
            {canViewCustomers && <Card className="border border-border shadow-sm dark:bg-slate-900 overflow-hidden">
              <CardHeader className="pb-3 pt-5 px-5 border-b">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">{t('Recent Customers')}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('Latest added customers')}</p>
                  </div>
                  <Link href={route('customers.index')} className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 hover:gap-1.5 transition-all duration-150">
                    {t('View all')} <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {dashboardData.recentCustomers && dashboardData.recentCustomers.length > 0 ? (
                  <div className="overflow-y-auto max-h-[390px]">
                    {dashboardData.recentCustomers.map((customer, i) => {
                      const isLast = i === (dashboardData.recentCustomers?.length ?? 0) - 1;
                      return (
                        <div key={customer.id} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 dark:hover:bg-slate-800/60 transition-colors duration-150 ${!isLast ? 'border-b border-border/60' : ''}`}>
                          <Avatar className="shrink-0 h-8 w-8">
                            <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{customer.name}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{customer.email || customer.phone || '-'}</p>
                          </div>
                          <div className="shrink-0 text-right space-y-1">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${customer.status === 'active'
                                ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/30'
                                : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-500/30'
                              }`}>
                              {customer.status === 'active' ? t('Active') : t('Inactive')}
                            </span>
                            <p className="text-[11px] text-muted-foreground whitespace-nowrap">{customer.created_at}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <div className="rounded-full bg-muted p-4">
                      <Users className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('No customers found')}</p>
                  </div>
                )}
              </CardContent>
            </Card>}

            {/* Recent Vendors */}
            {canViewVendors && <Card className="border border-border shadow-sm dark:bg-slate-900 overflow-hidden">
              <CardHeader className="pb-3 pt-5 px-5 border-b">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">{t('Recent Vendors')}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('Latest added vendors')}</p>
                  </div>
                  {canViewVendors && <Link href={route('vendors.index')} className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 hover:gap-1.5 transition-all duration-150">
                    {t('View all')} <ChevronRight className="h-3.5 w-3.5" />
                  </Link>}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {dashboardData.recentVendors && dashboardData.recentVendors.length > 0 ? (
                  <div className="overflow-y-auto max-h-[390px]">
                    {dashboardData.recentVendors.map((vendor, i) => {
                      const isLast = i === (dashboardData.recentVendors?.length ?? 0) - 1;
                      return (
                        <div key={vendor.id} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 dark:hover:bg-slate-800/60 transition-colors duration-150 ${!isLast ? 'border-b border-border/60' : ''}`}>
                          <Avatar className="shrink-0 h-8 w-8">
                            <AvatarFallback>{getInitials(vendor.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{vendor.name}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{vendor.email || '-'}</p>
                          </div>
                          <div className="shrink-0 text-right space-y-1">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${vendor.status === 'active'
                                ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/30'
                                : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-500/30'
                              }`}>
                              {vendor.status === 'active' ? t('Active') : t('Inactive')}
                            </span>
                            <p className="text-[11px] text-muted-foreground whitespace-nowrap">{vendor.created_at}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <div className="rounded-full bg-muted p-4">
                      <Users className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('No vendors found')}</p>
                  </div>
                )}
              </CardContent>
            </Card>}
          </div>

        </div>
      </div>
    </PageTemplate>
  );
}