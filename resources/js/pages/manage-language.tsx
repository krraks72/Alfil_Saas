import { useEffect, useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { usePage, router } from '@inertiajs/react';
import ReactCountryFlag from 'react-country-flag';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Lock, Power, RefreshCw, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Language {
  code: string;
  name: string;
  countryCode?: string;
  enabled?: boolean;
}

interface PageProps {
  languages: Language[];
  defaultLang: string;
  defaultData: Record<string, string>;
  auth: any;
  [key: string]: any; // Fix for Inertia PageProps constraint
}

export default function ManageLanguagePage() {
  const { t } = useTranslation();
  const { languages, defaultLang, defaultData, auth } = usePage<PageProps>().props;

  // Initialize selectedLang from props
  const [selectedLang, setSelectedLang] = useState(defaultLang);
  const [labels, setLabels] = useState<{ [key: string]: string }>(defaultData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [languageToDelete, setLanguageToDelete] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  // Update selectedLang when defaultLang changes (from Inertia navigation)
  useEffect(() => {
    setSelectedLang(defaultLang);
  }, [defaultLang]);

  // Load language data from backend when component mounts or language changes
  useEffect(() => {
    // If defaultData is already available for the current language, use it
    if (selectedLang === defaultLang && Object.keys(defaultData).length > 0) {
      setLabels(defaultData);
      return;
    }

    setLoading(true);
    fetch(`${route('language.load')}?lang=${selectedLang}`)
      .then(res => res.json())
      .then(res => {
        if (res.data) {
          setLabels(res.data);
        } else {
          setLabels({});
        }
        setLoading(false);
      })
      .catch(() => {
        setLabels({});
        setLoading(false);
        toast.error(t('Failed to load language file'));
      });
  }, [selectedLang, defaultLang, defaultData, t]);

  const handleLabelChange = (key: string, value: string) => {
    setLabels((prev) => ({ ...prev, [key]: value }));
  };

  // Save language data to backend
  const handleSave = (e) => {
    // Prevent default form submission behavior
    if (e) e.preventDefault();

    setSaving(true);

    // Use fetch instead of Inertia to prevent page refresh
    fetch(route('language.save'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // Add this to ensure Laravel detects AJAX request
      },
      body: JSON.stringify({
        _method: 'PATCH', // Laravel method spoofing for PATCH
        lang: selectedLang,
        data: labels
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          toast.success(data.success || t('Language updated successfully'));
        } else if (data.error) {
          toast.error(data.error);
        } else {
          toast.success(t('Language updated successfully'));
        }
        setSaving(false);
      })
      .catch(error => {

        toast.error(t('Failed to update language file'));
        setSaving(false);
      });

    // Return false to prevent any form submission
    return false;
  };

  const handleDisableLanguage = async (code: string) => {
    try {
      const response = await fetch(route('languages.toggle', { languageCode: code }), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Accept': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || t('Language status updated successfully'));
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        toast.error(data.error || t('Failed to update language status'));
      }
    } catch (error) {
      toast.error(t('Failed to update language status'));
    }
  };

  const handleEnableLanguage = async (code: string) => {
    try {
      const response = await fetch(route('languages.toggle', { languageCode: code }), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Accept': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || t('Language status updated successfully'));
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        toast.error(data.error || t('Failed to update language status'));
      }
    } catch (error) {
      toast.error(t('Failed to update language status'));
    }
  };

  const handleDeleteLanguage = async () => {
    if (!languageToDelete) return;

    try {
      const response = await fetch(route('languages.delete', { languageCode: languageToDelete }), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || t('Language deleted successfully'));
        setDeleteModalOpen(false);
        setLanguageToDelete(null);
        // Redirect to English language page after deletion
        router.get(route('manage-language', { lang: 'en' }));
      } else {
        toast.error(data.error || t('Failed to delete language'));
      }
    } catch (error) {
      toast.error(t('Failed to delete language'));
    }
  };

  const currentLanguage = languages.find(l => l.code === selectedLang);

  const pageActions = auth?.user?.type === 'superadmin' && currentLanguage ? [
    ...(currentLanguage.code !== 'en' && currentLanguage.enabled !== false ? [{
      label: `${t('Disable Language')}`,
      icon: isToggling ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />,

      variant: 'outline' as const,
      onClick: () => handleDisableLanguage(currentLanguage.code)
    }] : currentLanguage.code !== 'en' && currentLanguage.enabled === false ? [{
      label: `${t('Enable Language')}`,
      icon: isToggling ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: () => handleEnableLanguage(currentLanguage.code)
    }] : []),
    ...(currentLanguage.code !== 'en' ? [{
      label: t('Delete Language'),
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive' as const,
      onClick: () => {
        setLanguageToDelete(currentLanguage.code);
        setDeleteModalOpen(true);
      }
    }] : [])
  ] : [];

  return (
    <PageTemplate
      title={t('Manage Language')}
      description={t('Manage language translations.')}
      url="/manage-language"
      actions={pageActions}
    >
      {/* Mobile Select Dropdown (< lg) */}
      <div className="block lg:hidden w-full mb-4">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          {t('Select Language')}
        </label>
        <Select
          value={selectedLang}
          onValueChange={(value) => {
            if (selectedLang !== value) {
              router.get(route('manage-language', { lang: value }));
            }
          }}
        >
          <SelectTrigger className="w-full bg-card h-11 border-border/80">
            <SelectValue placeholder={t('Select language')} />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <div className="flex items-center gap-2.5">
                  {lang.countryCode && (
                    <ReactCountryFlag
                      countryCode={lang.countryCode}
                      svg
                      style={{ width: '1.2em', height: '1.2em' }}
                      className="shrink-0"
                    />
                  )}
                  <span className="font-medium">{lang.name}</span>
                  {lang.enabled === false && (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Desktop Sidebar Language List (>= lg) */}
        <div className="hidden lg:block lg:w-64 xl:w-72 shrink-0">
          <div className="lg:sticky lg:top-20">
            <ScrollArea className="lg:h-[calc(100vh-10rem)] rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-3 flex flex-col gap-1.5">
                {languages.map((lang) => (
                  <Button
                    key={lang.code}
                    variant="ghost"
                    size="sm"
                    className={cn('w-full justify-start gap-2.5 px-3 py-2 text-sm font-medium transition-colors', {
                      'bg-primary/10 text-primary font-semibold dark:bg-primary/20': selectedLang === lang.code,
                    })}
                    onClick={() => {
                      if (selectedLang !== lang.code) {
                        router.get(route('manage-language', { lang: lang.code }));
                      }
                    }}
                  >
                    {lang.countryCode && (
                      <ReactCountryFlag
                        countryCode={lang.countryCode}
                        svg
                        style={{ width: '1.2em', height: '1.2em' }}
                        className="shrink-0"
                      />
                    )}
                    <span className="truncate">{lang.name}</span>
                    {lang.enabled === false && (
                      <Lock className="h-3.5 w-3.5 ml-auto text-muted-foreground shrink-0" />
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main Content: Language Labels */}
        <div className="flex-1 min-w-0">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3 sm:gap-4">
              <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">
                {t('Edit Labels for')} {languages.find(l => l.code === selectedLang)?.name}
              </h2>
              <Input
                placeholder={t('Search labels...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-64 md:w-72"
              />
            </div>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">{t('Loading...')}</div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(e); return false; }}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {Object.entries(labels)
                      .filter(([key, value]) =>
                        key.toLowerCase().includes(search.toLowerCase()) ||
                        value.toLowerCase().includes(search.toLowerCase())
                      )
                      .map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-1.5 min-w-0">
                          <label className="text-xs font-medium text-muted-foreground truncate" title={key}>
                            {key}
                          </label>
                          <Input
                            className="w-full text-sm"
                            value={value}
                            onChange={e => handleLabelChange(key, e.target.value)}
                          />
                        </div>
                      ))}
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto"
                    >
                      {saving ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-primary-foreground rounded-full"></span>
                          {t('Saving...')}
                        </span>
                      ) : t('Save Changes')}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] p-0 rounded-lg overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-lg font-semibold text-foreground truncate">{t('Delete Language')}</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <p className="text-sm text-muted-foreground">{t('Are you sure you want to delete this language? This action cannot be undone.')}</p>
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteLanguage}>
              {t('Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
} 