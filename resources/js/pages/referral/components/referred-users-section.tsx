import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { Users, Calendar, DollarSign, CheckCircle, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

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

interface ReferredUsersSectionProps {
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

export default function ReferredUsersSection({ referredUsers, userType, currencySymbol }: ReferredUsersSectionProps) {
  const { t } = useTranslation();
  const getInitials = useInitials();

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getTotalCommission = (user: ReferredUser) => {
    return user.referrals?.reduce((total, referral) => total + (Number(referral.amount) || 0), 0) || 0;
  };

  const getTotalCommissionAll = () => {
    return referredUsers.data.reduce((total, user) => total + getTotalCommission(user), 0) || 0;
  };

  const getPlanDisplayInfo = (user: ReferredUser) => {
    if (!user.plan) return null;
    const latestOrder = user.plan_orders?.[0];
    if (latestOrder) {
      return {
        name: user.plan.name,
        price: latestOrder.final_price,
        cycle: latestOrder.billing_cycle === 'yearly' ? 'year' : 'month'
      };
    }
    return { name: user.plan.name, price: user.plan.price, cycle: 'month' };
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 dark:bg-green-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Referred Users')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{referredUsers.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-green-50 dark:bg-green-700/20 rounded-xl mt-0.5">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 dark:bg-blue-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Users with Plans')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{referredUsers.data.filter(user => user.plan).length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Active subscribers')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 dark:bg-amber-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Commission Earned')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white"><span className="font-mono">{window.appSettings.formatCurrencyWithSuperAdminSettings(getTotalCommissionAll())}</span></p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Commission earned')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-amber-50 dark:bg-amber-700/20 rounded-xl mt-0.5">
                <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>
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
                <div key={user.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 sm:p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-start sm:items-center space-x-3 min-w-0 flex-1">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>
                          {getInitials(user.name || 'Unknown')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">{user.name}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground mt-0.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>{t('Registered')} {formatDate(user.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700/60 shrink-0">
                      <div className="text-left sm:text-right">
                        {(() => {
                          const planInfo = getPlanDisplayInfo(user);
                          return planInfo ? (
                            <div>
                              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 ring-green-600/20">
                                {planInfo.name}
                              </span>
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                {currencySymbol}{planInfo.price}/{t(planInfo.cycle)}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 ring-gray-600/20">
                              {t('No Plan')}
                            </span>
                          );
                        })()}
                      </div>

                      {getTotalCommission(user) > 0 && (
                        <div className="text-right shrink-0 sm:min-w-[80px]">
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400 font-mono">
                            +{currencySymbol}{getTotalCommission(user)}
                          </p>
                          <p className="text-xs text-muted-foreground">
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
          className='rounded-lg'
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
              only: ['referredUsers']
            });
          }}
          hidePerPage={true}
        />
      )}
    </div>
  );
}
