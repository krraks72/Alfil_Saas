import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/custom-toast';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CreateLanguageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateLanguageModal({ open, onOpenChange, onSuccess }: CreateLanguageModalProps) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        countryCode: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(route('language.create'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success(data.message || t('Language created successfully'));
                setFormData({ code: '', name: '', countryCode: '' });
                onOpenChange(false);
                onSuccess?.();
                window.location.reload();
            } else {
                toast.error(data.message || data.error || t('Failed to create language'));
            }
        } catch (error) {

            toast.error(t('Failed to create language'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] p-0 rounded-lg overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="text-lg font-semibold text-foreground truncate">{t('Create New Language')}</DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[65vh]">
                    <form id="language-create-form" onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
                        <div className="space-y-1.5">
                            <Label required htmlFor="code">{t('Language Code')}</Label>
                            <Input
                                id="code"
                                placeholder="e.g., fr, de, es"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label required htmlFor="name">{t('Language Name')}</Label>
                            <Input
                                id="name"
                                placeholder="e.g., French, German, Spanish"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label required htmlFor="countryCode">{t('Country Code')}</Label>
                            <Input
                                id="countryCode"
                                placeholder="e.g., FR, DE, ES"
                                maxLength={2}
                                value={formData.countryCode}
                                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })}
                                required
                            />
                        </div>
                    </form>
                </ScrollArea>

                <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" form="language-create-form" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                {t('Creating...')}
                            </>
                        ) : (
                            t('Create')
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
