import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  CreditCard,
  BarChart3,
  MessageSquare,
  CalendarDays,
  Eye,
  TrendingUp,
  ArrowRight,
  Sparkles,
  DollarSign,
  Tag
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, router } from '@inertiajs/react';

interface DashboardOverviewProps {
  userType: 'superadmin' | 'company';
  stats: any;
}

export function DashboardOverview({ userType, stats }: DashboardOverviewProps) {
  const { t } = useTranslation();

  const superAdminFeatures = [
    {
      title: t('Company Management'),
      description: t('Manage all registered companies and their subscriptions'),
      icon: Building2,
      color: 'blue',
      href: route('companies.index'),
      count: stats?.totalCompanies || 0
    },
    {
      title: t('Plan Management'),
      description: t('Create and manage subscription plans'),
      icon: CreditCard,
      color: 'purple',
      href: route('plans.index'),
      count: stats?.activePlans || 0
    },

    {
      title: t('Revenue Tracking'),
      description: t('Track and manage plan orders and revenue'),
      icon: DollarSign,
      color: 'green',
      href: route('plan-orders.index'),
      count: stats?.totalRevenue ? window.appSettings.formatCurrency(stats.totalRevenue) : 0
    },
    {
      title: t('Coupon Management'),
      description: t('Create and manage discount coupons'),
      icon: Tag,
      color: 'orange',
      href: route('coupons.index'),
      count: stats?.activeCoupons || 0
    }
  ];

  const features = userType === 'superadmin' ? superAdminFeatures : null;

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
      green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
      purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
      orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <Card className="border-2 border-dashed border-primary/20">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">
            {t('Features')}
          </CardTitle>
        </div>
        <p className="text-muted-foreground">
          {userType === 'superadmin'
            ? t('Comprehensive system management and oversight tools')
            : t('Everything you need to manage your digital business presence')
          }
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div key={feature.title} className="group relative cursor-pointer" onClick={() => router.visit(feature.href)}>
                <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`rounded-full p-3 ${getColorClasses(feature.color)}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20`}>
                        {feature.count}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {feature.description}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between group-hover:bg-primary/10"
                    >
                        {t('Explore')}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">
              {userType === 'superadmin'
                ? t('System growing at {{growth}}% monthly', { growth: stats?.monthlyGrowth || 0 })
                : t('Your business views increased by {{growth}}%', { growth: stats?.monthlyGrowth || 0 })
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}