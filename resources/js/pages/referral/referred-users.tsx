import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { useTranslation } from 'react-i18next';
import { usePage, Link, router } from '@inertiajs/react';
import { ArrowLeft, Users, Calendar, DollarSign, CheckCircle, XCircle, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ReferredUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
  plan?: {
    id: number;
    name: string;
    price: number;
    yearly_price?: number;
  };
  plan_orders?: Array<{
    id: number;
    billing_cycle: string;
    final_price: number;
  }>;
  referrals?: Array<{
    id: number;
    amount: number;
    commission_percentage: number;
    created_at: string;
  }>;
}

interface ReferredUsersProps {
  referredUsers: {
    data: ReferredUser[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: any[];
  };
  userType: string;
  currencySymbol: string;
}

export default function ReferredUsers() {
  const { t } = useTranslation();
  const { props } = usePage<{ props: ReferredUsersProps }>();
  const { referredUsers, userType, currencySymbol } = props;

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getTotalCommission = (user: ReferredUser) => {
    return user.referrals?.reduce((total, referral) => total + (Number(referral.amount) || 0), 0) || 0;
  };

  const getPlanDisplayInfo = (user: ReferredUser) => {
    if (!user.plan) return null;
    
    const latestOrder = user.plan_orders?.[0];
    
    if (latestOrder) {
      const isYearly = latestOrder.billing_cycle === 'yearly';
      return {
        name: user.plan.name,
        price: latestOrder.final_price,
        cycle: isYearly ? 'year' : 'month'
      };
    }
    
    return {
      name: user.plan.name,
      price: user.plan.price,
      cycle: 'month'
    };
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Referral Program'), href: route('referral.index') },
    { title: t('Referred Users') }
  ];

  return (
    <PageTemplate
      title={t('Referred Users')}
      url="/referral/referred-users"
      breadcrumbs={breadcrumbs}
      actions={[
        {
          label: t('Back'),
          icon: <ArrowLeft className="h-4 w-4" />,
          variant: 'outline',
          onClick: () => window.location.href = route('referral.index')
        }
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-muted-foreground">
                {userType === 'superadmin'
                  ? t('All users who registered using referral codes')
                  : t('Users who registered using your referral code')
                }
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('Total Referred Users')}</p>
                  <h3 className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{referredUsers.total}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t('All time')}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('Users with Plans')}</p>
                  <h3 className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{referredUsers.data.filter(user => user.plan).length}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t('Active subscribers')}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('Total Commission Earned')}</p>
                  <h3 className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">{currencySymbol}{(referredUsers.data.reduce((total, user) => total + getTotalCommission(user), 0) || 0).toFixed(2)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t('Commission earned')}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">{t('Referred Users List')}</CardTitle>
                <CardDescription className="text-xs">{t('All users who registered using your referral code')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {referredUsers.data.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-base font-semibold text-muted-foreground mb-2">{t('No referred users yet')}</p>
                <p className="text-sm text-muted-foreground">
                  {userType === 'superadmin'
                    ? t('No users have registered using referral codes yet.')
                    : t('Share your referral link to start earning commissions.')
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {referredUsers.data.map((user) => (
                  <div key={user.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{user.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{t('Registered')} {formatDate(user.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4 flex-shrink-0">
                        <div className="text-right">
                          {(() => {
                            const planInfo = getPlanDisplayInfo(user);
                            return planInfo ? (
                              <div>
                                <Badge variant="default" className="mb-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  {planInfo.name}
                                </Badge>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {currencySymbol}{planInfo.price}/{t(planInfo.cycle)}
                                </p>
                              </div>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                {t('No Plan')}
                              </Badge>
                            );
                          })()}
                        </div>

                        {getTotalCommission(user) > 0 && (
                          <div className="text-right min-w-[80px]">
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400 font-mono">
                              +{currencySymbol}{getTotalCommission(user)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {t('Commission')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {user.referrals && user.referrals.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('Commission History')}</p>
                        <div className="space-y-1.5">
                          {user.referrals.map((referral) => (
                            <div key={referral.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                              <span className="text-xs text-muted-foreground">
                                {referral.commission_percentage}% {t('commission')}
                              </span>
                              <span className="text-xs font-semibold text-green-600 dark:text-green-400 font-mono">
                                +{currencySymbol}{referral.amount}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {referredUsers.last_page > 1 && (
          <Pagination
            from={referredUsers.from}
            to={referredUsers.to}
            total={referredUsers.total}
            links={referredUsers.links}
            currentPage={referredUsers.current_page}
            lastPage={referredUsers.last_page}
            entityName={t('users')}
            onPageChange={(url) => {
              router.visit(url, {
                preserveState: true,
                preserveScroll: true,
              });
            }}
          />
        )}
      </div>
    </PageTemplate>
  );
}