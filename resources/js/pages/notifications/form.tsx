import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Bell, Calendar, CheckCircle, Clock, Eye, Palette, X } from 'lucide-react';

interface NotificationFormProps {
  notification?: any;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
}

const COLOR_PRESETS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10b77f', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#F97316', label: 'Orange' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#EC4899', label: 'Pink' },
];

export function NotificationForm({ notification, mode, onSuccess }: NotificationFormProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, setData, errors, reset } = useForm({
    title: notification?.title || '',
    description: notification?.description || '',
    from_date: notification?.from_date ? new Date(notification.from_date).toISOString().split('T')[0] : '',
    to_date: notification?.to_date ? new Date(notification.to_date).toISOString().split('T')[0] : '',
    color: notification?.color || '#10b77f',
    status: notification?.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const callbacks = {
      onSuccess: (page: any) => {
        setIsSubmitting(false);
        if (page.props.flash?.success) toast.success(page.props.flash.success);
        if (mode === 'create') reset();
        onSuccess?.();
      },
      onError: (errs: any) => {
        setIsSubmitting(false);
        if (typeof errs === 'string') {
          toast.error(errs);
        } else {
          const first = Object.values(errs)[0];
          toast.error(Array.isArray(first) ? first[0] : (typeof first === 'string' ? first : t('Please check the form for errors')));
        }
      },
    };

    if (mode === 'create') {
      router.post(route('notifications.store'), data, callbacks);
    } else {
      router.put(route('notifications.update', notification.id), data, callbacks);
    }
  };

  const hasPreviewContent = data.title || data.description || data.to_date;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

      {/* ── Form ── */}
      <div className="xl:col-span-2">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Section: Notification */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/50 flex items-center justify-center shrink-0">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                  {t('Notification')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('Title')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="title"
                      type="text"
                      value={data.title}
                      onChange={(e) => setData('title', e.target.value)}
                      placeholder={t('Enter notification title')}
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">{t('Status')} <span className="text-red-500">*</span></Label>
                    <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                      <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                        <SelectValue placeholder={t('Select status')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t('Active')}</SelectItem>
                        <SelectItem value="inactive">{t('Inactive')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('Description')} <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder={t('Enter notification description')}
                    className={errors.description ? 'border-red-500' : ''}
                    rows={4}
                  />
                  {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Section: Schedule */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/50 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  {t('Schedule')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from_date">{t('Start Date')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="from_date"
                      type="date"
                      value={data.from_date}
                      onChange={(e) => setData('from_date', e.target.value)}
                      className={errors.from_date ? 'border-red-500' : ''}
                    />
                    {errors.from_date && <p className="text-sm text-red-500">{errors.from_date}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="to_date">{t('End Date')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="to_date"
                      type="date"
                      value={data.to_date}
                      onChange={(e) => setData('to_date', e.target.value)}
                      className={errors.to_date ? 'border-red-500' : ''}
                    />
                    {errors.to_date && <p className="text-sm text-red-500">{errors.to_date}</p>}
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Section: Appearance */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/50 flex items-center justify-center shrink-0">
                    <Palette className="h-4 w-4 text-primary" />
                  </div>
                  {t('Appearance')}
                </h3>
                <div className="space-y-2">
                  <Label>{t('Color')} <span className="text-red-500">*</span></Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        title={t(preset.label)}
                        onClick={() => setData('color', preset.value)}
                        className="relative w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
                        style={{ backgroundColor: preset.value }}
                      >
                        {data.color === preset.value && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-white drop-shadow" />
                          </span>
                        )}
                      </button>
                    ))}

                    <label
                      className="relative w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors overflow-hidden"
                      title={t('Custom color')}
                      style={!COLOR_PRESETS.find(p => p.value === data.color) ? { backgroundColor: data.color, borderStyle: 'solid', borderColor: data.color } : {}}
                    >
                      {!COLOR_PRESETS.find(p => p.value === data.color)
                        ? <CheckCircle className="h-4 w-4 text-white drop-shadow" />
                        : <Palette className="h-3.5 w-3.5 text-gray-400" />
                      }
                      <input
                        type="color"
                        value={data.color}
                        onChange={(e) => setData('color', e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
                  </div>
                  {errors.color && <p className="text-sm text-red-500">{errors.color}</p>}
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                  {t('Cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('Saving...') : t('Save')}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>

      {/* ── Live Preview ── */}
      <div className="xl:col-span-1">
        <div className="sticky top-6 space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Eye className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('Live Preview')}</span>
          </div>

          {/* Dashboard notification dialog mockup */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">

            {/* Dialog header */}
            <div className="px-4 py-3 border-b bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                    <Bell className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{t('Notifications')}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">1 {t('active')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification item */}
            <div className="px-4 py-3">
              {hasPreviewContent ? (
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0 transition-colors duration-200"
                      style={{ backgroundColor: data.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white leading-snug">
                        {data.title || <span className="text-gray-300 dark:text-gray-600 italic font-normal">{t('Notification title...')}</span>}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed whitespace-pre-wrap">
                        {data.description || <span className="italic text-gray-300 dark:text-gray-600">{t('Description will appear here...')}</span>}
                      </p>
                      {data.to_date && (
                        <div className="flex items-center gap-1 mt-2">
                          <Calendar className="h-2.5 w-2.5 text-gray-400" />
                          <span className="text-[10px] text-gray-400">
                            {t('Valid until')} {new Date(data.to_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">{t('Start filling the form to see a live preview')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
