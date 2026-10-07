import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Webhook } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';
import axios from 'axios';

interface Webhook {
    id: number;
    module: string;
    method: string;
    url: string;
    created_at: string;
}

interface Props {
    webhooks: {
        data: Webhook[];
    };
    modules: string[];
    methods: string[];
}

export default function WebhooksIndex({ webhooks, modules, methods }: Props) {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
    const [formData, setFormData] = useState({
        module: '',
        method: 'POST',
        url: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingWebhook) {
                const response = await axios.put(route('settings.webhooks.update', editingWebhook.id), formData);
                toast.success(response.data.message);
                setIsModalOpen(false);
                resetForm();
                window.location.reload();
            } else {
                const response = await axios.post(route('settings.webhooks.store'), formData);
                toast.success(response.data.message);
                setIsModalOpen(false);
                resetForm();
                window.location.reload();
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || t('An error occurred');
            toast.error(errorMessage);
        }
    };

    const handleEdit = (webhook: Webhook) => {
        setEditingWebhook(webhook);
        setFormData({
            module: webhook.module,
            method: webhook.method,
            url: webhook.url
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (webhook: Webhook) => {
        if (confirm(t('Are you sure you want to delete this webhook?'))) {
            try {
                const response = await axios.delete(route('settings.webhooks.destroy', webhook.id));
                toast.success(response.data.message);
                window.location.reload();
            } catch (error: any) {
                const errorMessage = error.response?.data?.message || t('An error occurred');
                toast.error(errorMessage);
            }
        }
    };

    const resetForm = () => {
        setFormData({ module: '', method: 'POST', url: '' });
        setEditingWebhook(null);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    return (
        <>
            <Head title={t('Webhooks')} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{t('Webhooks')}</h1>
                        <p className="text-muted-foreground">
                            {t('Configure external integrations that get notified when events occur')}
                        </p>
                    </div>

                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreateModal}>
                                <Plus className="h-4 w-4 mr-2" />
                                {t('Add Webhook')}
                            </Button>
                        </DialogTrigger>

                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingWebhook ? t('Edit Webhook') : t('Create Webhook')}
                                </DialogTitle>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="module">{t('Module')}</Label>
                                    <Select
                                        value={formData.module}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, module: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Select module')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {modules.map(module => (
                                                <SelectItem key={module} value={module}>
                                                    {t(module)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="method">{t('Method')}</Label>
                                    <Select
                                        value={formData.method}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, method: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {methods.map(method => (
                                                <SelectItem key={method} value={method}>
                                                    {method}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="url">{t('Webhook URL')}</Label>
                                    <Input
                                        id="url"
                                        type="url"
                                        value={formData.url}
                                        onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                                        placeholder="https://example.com/webhook"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        {t('Cancel')}
                                    </Button>
                                    <Button type="submit">
                                        {editingWebhook ? t('Update') : t('Create')}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Webhook className="h-5 w-5" />
                            {t('Configured Webhooks')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {webhooks.data.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('Module')}</TableHead>
                                        <TableHead>{t('Method')}</TableHead>
                                        <TableHead>{t('URL')}</TableHead>
                                        <TableHead>{t('Created')}</TableHead>
                                        <TableHead className="text-right">{t('Actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {webhooks.data.map((webhook) => (
                                        <TableRow key={webhook.id}>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {t(webhook.module)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={webhook.method === 'POST' ? 'default' : 'outline'}>
                                                    {webhook.method}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {webhook.url}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(webhook.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(webhook)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(webhook)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8">
                                <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">{t('No webhooks configured')}</h3>
                                <p className="text-muted-foreground mb-4">
                                    {t('Create your first webhook to start receiving notifications')}
                                </p>
                                <Button onClick={openCreateModal}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t('Add Webhook')}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
