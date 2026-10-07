import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Link2 } from 'lucide-react';
import { SettingsSection } from '@/components/settings-section';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/custom-toast';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import axios from 'axios';
import { Card } from '@/components/ui/card';

interface Webhook {
  id: number;
  module: string;
  method: string;
  url: string;
  created_at: string;
}

interface WebhookSettingsProps {
  webhooks?: Webhook[];
}

export default function WebhookSettings({ webhooks = [] }: WebhookSettingsProps) {
  const { t } = useTranslation();
  const [webhookList, setWebhookList] = useState<Webhook[]>(webhooks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState<Webhook | null>(null);
  const [formData, setFormData] = useState({
    module: '',
    method: '',
    url: ''
  });

  const resetForm = () => {
    setFormData({ module: '', method: '', url: '' });
    setEditingWebhook(null);
  };

  const handleCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (webhook: Webhook) => {
    setFormData({
      module: webhook.module,
      method: webhook.method,
      url: webhook.url
    });
    setEditingWebhook(webhook);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const headers = {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      };

      if (editingWebhook) {
        const response = await axios.put(route('settings.webhooks.update', editingWebhook.id), formData, { headers });
        setWebhookList(prev => prev.map(w => w.id === editingWebhook.id ? response.data.webhook : w));
        toast.success(response.data.message);
      } else {
        const response = await axios.post(route('settings.webhooks.store'), formData, { headers });
        setWebhookList(prev => [...prev, response.data.webhook]);
        toast.success(response.data.message);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message;
      if (errorMessage) {
        toast.error(errorMessage);
      } else {
        // demo_mode
        if(error.response.data.demo_mode){
        toast.error(error.response.data.error);
        }else{
          toast.error(t('Network error occurred'));
        }
      }
    }
  };

  const handleDeleteClick = (webhook: Webhook) => {
    setWebhookToDelete(webhook);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!webhookToDelete) return;

    try {
      const response = await axios.delete(route('settings.webhooks.destroy', webhookToDelete.id), {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        }
      });
      setWebhookList(prev => prev.filter(w => w.id !== webhookToDelete.id));
      toast.success(response.data.message);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message;
      if (errorMessage) {
        toast.error(errorMessage);
      } else {
        // demo_mode
        if(error.response.data.demo_mode){
        toast.error(error.response.data.error);
        }else{
          toast.error(t('Network error occurred'));
        }
      }
    } finally {
      setDeleteModalOpen(false);
      setWebhookToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setWebhookToDelete(null);
  };

  const loadWebhooks = async () => {
    try {
      const response = await axios.get(route('settings.webhooks.index'), {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        }
      });
      setWebhookList(response.data.webhooks?.data || []);
    } catch (error) {

    }
  };

  useEffect(() => {
    loadWebhooks();
  }, []);

  return (
    <SettingsSection
      title={t("Webhook Settings")}
      description={t("Manage webhooks for external integrations")}
      action={
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2 shrink-0" />
          <span className="whitespace-nowrap">{t("Add Webhook")}</span>
        </Button>
      }
    >
      <Card>
      <div className="space-y-4 min-w-0">
        <div className="overflow-x-auto min-w-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 bg-[#F0F0F1] dark:bg-gray-800 border-b dark:border-gray-700">
                <TableHead className="py-2.5 font-semibold whitespace-nowrap">{t("Module")}</TableHead>
                <TableHead className="py-2.5 font-semibold whitespace-nowrap">{t("Method")}</TableHead>
                <TableHead className="py-2.5 font-semibold whitespace-nowrap">{t("URL")}</TableHead>
                <TableHead className="w-24 py-2.5 font-semibold text-right whitespace-nowrap">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhookList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground dark:text-gray-400">
                    {t("No webhooks configured")}
                  </TableCell>
                </TableRow>
              ) : (
                webhookList.map((webhook) => (
                  <TableRow key={webhook.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 dark:bg-gray-900">
                    <TableCell className="py-2.5">
                      <div className="flex items-center whitespace-nowrap">
                        <Link2 className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium">{webhook.module}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        webhook.method === 'GET'
                          ? 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/30'
                          : 'bg-green-50 text-green-700 ring-green-700/10 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-400/30'
                      }`}>
                        {webhook.method}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="max-w-xs truncate text-sm font-mono text-muted-foreground dark:text-gray-400">
                        {webhook.url}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0 text-gray-500"
                                onClick={() => handleEdit(webhook)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("Edit")}</p>
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
                                onClick={() => handleDeleteClick(webhook)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("Delete")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] max-w-lg sm:max-w-md p-0 max-h-[90vh] overflow-y-auto rounded-lg sm:rounded-xl">
            <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-3 border-b">
              <DialogTitle className="text-lg sm:text-xl font-semibold">
                {editingWebhook ? t("Edit Webhook") : t("Add New Webhook")}
              </DialogTitle>
            </DialogHeader>
            <form id="webhook-form" onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
              <div className="grid gap-2 min-w-0">
                <Label required htmlFor="module">{t("Module")}</Label>
                <Select
                  value={formData.module}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, module: value }))}
                  required
                >
                  <SelectTrigger id="module" className="w-full min-w-0 overflow-hidden">
                    <SelectValue placeholder={t("Select module")} className="whitespace-nowrap truncate block" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                    <SelectItem value="New User">{t("New User")}</SelectItem>
                    <SelectItem value="New Customer">{t("New Customer")}</SelectItem>
                    <SelectItem value="New Vendor">{t("New Vendor")}</SelectItem>
                    <SelectItem value="New Quote">{t("New Quote")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 min-w-0">
                <Label required htmlFor="method">{t("Method")}</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, method: value }))}
                  required
                >
                  <SelectTrigger id="method" className="w-full min-w-0 overflow-hidden">
                    <SelectValue placeholder={t("Select method")} className="whitespace-nowrap truncate block" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                    <SelectItem value="GET">{t("GET")}</SelectItem>
                    <SelectItem value="POST">{t("POST")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 min-w-0">
                <Label required htmlFor="url">{t("URL")}</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/webhook"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  required
                  className="min-w-0 w-full"
                />
              </div>
            </form>
            <DialogFooter className="p-4 sm:p-6 pt-3 sm:pt-4 border-t flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                {t("Cancel")}
              </Button>
              <Button type="submit" form="webhook-form" className="w-full sm:w-auto">
                {t("Save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {webhookToDelete && (
          <CrudDeleteModal
            isOpen={deleteModalOpen}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            itemName={webhookToDelete.module}
            entityName={t('Webhook')}
          />
        )}
      </div>
      </Card>
    </SettingsSection>
  );
}
