import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Plus, Check, X, Calendar } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

interface PayoutRequestsProps {
  userType: string;
  payoutRequests: any;
  settings: any;
  stats: any;
}

export default function PayoutRequests({ userType, payoutRequests, settings, stats }: PayoutRequestsProps) {
  const { t } = useTranslation();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const getInitials = useInitials();

  const { data, setData, post, processing, errors, reset } = useForm({
    amount: '',
  });

  const { data: rejectData, setData: setRejectData, post: postReject, processing: rejectProcessing } = useForm({
    notes: '',
  });

  const handleCreatePayout = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('referral.payout-request.create'), {
      onSuccess: (page) => {
        setShowCreateDialog(false);
        reset();
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
          toast.error(`Failed to create payout request: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleApprove = (request: any) => {
    post(route('referral.payout-request.approve', request.id), {
      preserveScroll: true,
      onSuccess: (page) => {
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash?.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(`Failed to approve payout request: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRequest) {
      postReject(route('referral.payout-request.reject', selectedRequest.id), {
        preserveScroll: true,
        onSuccess: (page) => {
          setShowRejectDialog(false);
          setSelectedRequest(null);
          setRejectData('notes', '');
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
            toast.error(`Failed to reject payout request: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { className: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20', text: 'Pending' },
      approved: { className: 'bg-green-50 text-green-700 ring-green-600/20', text: 'Approved' },
      rejected: { className: 'bg-red-50 text-red-700 ring-red-600/20', text: 'Rejected' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${config.className}`}>
        {t(config.text)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {userType === 'company' && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>{t('Create Payout Request')}</CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button disabled={stats.availableBalance < settings.threshold_amount} className="w-full sm:w-auto whitespace-nowrap">
                  <Plus className="h-4 w-4 mr-2 shrink-0" />
                  {t('Request Payout')}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md p-0 rounded-lg overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                  <DialogTitle className="text-lg font-semibold">{t('Create Payout Request')}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[65vh] overflow-y-auto px-6 py-4">
                  <form id='payout-request-form' onSubmit={handleCreatePayout} className="space-y-4">
                    <div>
                      <Label required htmlFor="amount">{t('Amount')}</Label>
                      <Input
                        required
                        id="amount"
                        type="number"
                        step="0.01"
                        min={settings.threshold_amount}
                        max={stats.availableBalance}
                        value={data.amount}
                        onChange={(e) => setData('amount', e.target.value)}
                        placeholder={`Min: $${settings.threshold_amount}`}
                        className={`mt-1.5 ${errors.amount ? 'border-red-500' : ''}`}
                      />
                      {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/40 rounded-lg border border-border/50">
                      <p>{t('Available Balance')}: <span className="font-mono font-medium text-foreground">{window.appSettings?.formatCurrency(stats.availableBalance) || `$${stats.availableBalance}`}</span></p>
                      <p>{t('Minimum Amount')}: <span className="font-mono font-medium text-foreground">{window.appSettings?.formatCurrency(settings.threshold_amount) || `$${settings.threshold_amount}`}</span></p>
                    </div>
                  </form>
                </div>
                <DialogFooter className="px-6 py-4 border-t bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="flex justify-end gap-2 w-full sm:w-auto">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      {t('Cancel')}
                    </Button>
                    <Button type="submit" form='payout-request-form' disabled={processing}>
                      {t('Submit Request')}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats.availableBalance < settings.threshold_amount
                ? t('You need at least {{amount}} to request a payout', { amount: window.appSettings?.formatCurrency(settings.threshold_amount) || `$${settings.threshold_amount}` })
                : t('You can request up to {{amount}} for payout', { amount: window.appSettings?.formatCurrency(stats.availableBalance) || `$${stats.availableBalance}` })}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {userType === 'superadmin' ? t('All Payout Requests') : t('Your Payout Requests')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F0F0F1] dark:bg-gray-800 border-b hover:!bg-[#F0F0F1] dark:hover:!bg-gray-800">
                {userType === 'superadmin' && <TableHead>{t('Company')}</TableHead>}
                <TableHead>{t('Amount')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
                <TableHead>{t('Date')}</TableHead>
                {userType === 'superadmin' && <TableHead className="w-24 text-right font-semibold">{t('Actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutRequests.data?.map((request: any) => (
                <TableRow key={request.id} className="dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800">
                  {userType === 'superadmin' && (
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={request.company?.avatar} />
                          <AvatarFallback>{getInitials(request.company?.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{request.company?.name}</div>
                          <div className="text-sm text-muted-foreground">{request.company?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="font-mono">{window.appSettings?.formatCurrency(request.amount) || `$${request.amount}`}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-left gap-2 text-gray-500 min-w-[110px]">
                      <Calendar className="h-4 w-4" />
                      <span>{window.appSettings?.formatDateTime(request.created_at, false) || new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  {userType === 'superadmin' && request.status === 'pending' && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0 text-gray-500"
                                // className="h-8 w-8 text-green-600"
                                onClick={() => handleApprove(request)}
                              >
                                <Check size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('Approve')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0 text-gray-500"
                                // className="h-8 w-8 text-red-600"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowRejectDialog(true);
                                }}
                              >
                                <X size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('Reject')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  )}

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="pl-0 pr-0">
          <DialogHeader className="px-6">
            <DialogTitle>{t('Reject Payout Request')}</DialogTitle>
          </DialogHeader>
          <form id="reject-payout-request" onSubmit={handleReject} className="space-y-4 px-6">
            <div>
              <Label htmlFor="notes">{t('Rejection Reason')}</Label>
              <Textarea
                id="notes"
                value={rejectData.notes}
                onChange={(e) => setRejectData('notes', e.target.value)}
                placeholder={t('Enter reason for rejection...')}
              />
            </div>
          </form>
          <DialogFooter className="px-6">
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowRejectDialog(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit" form='reject-payout-request' variant="destructive" disabled={rejectProcessing}>
                {t('Reject Request')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
