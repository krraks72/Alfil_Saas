import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';

interface ColumnMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  excelColumns: string[];
  databaseFields: { key: string; required?: boolean }[];
  importRoute: string;
  data: Record<string, string>[];
  previewData?: Record<string, string>[];
}

export function ColumnMappingModal({
  isOpen,
  onClose,
  excelColumns,
  databaseFields,
  importRoute,
  data,
  previewData = []
}: ColumnMappingModalProps) {
  const { t } = useTranslation();
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (isOpen && excelColumns.length > 0) {
      const autoMapping: Record<string, string> = {};
      databaseFields.forEach(field => {
        const match = excelColumns.find(col =>
          col.toLowerCase().replace(/[_\s]/g, '') === field.key.toLowerCase().replace(/[_\s]/g, '')
        );
        if (match) {
          autoMapping[field.key] = match;
        }
      });
      setMapping(autoMapping);
    }
  }, [isOpen, excelColumns, databaseFields]);

  const handleSubmit = () => {
    if (!data || data.length === 0) {
      toast.error(t('No data available for import'));
      return;
    }

    const requiredFields = databaseFields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !mapping[f.key]);

    if (missingFields.length > 0) {
      toast.error(t('Please map all required fields: {{fields}}', { fields: missingFields.map(f => f.key).join(', ') }));
      return;
    }

    // Map data according to column mapping
    const mappedData = (data || []).map(row => {
      const mappedRow: Record<string, any> = {};
      Object.entries(mapping).forEach(([dbField, excelColumn]) => {
        mappedRow[dbField] = row[excelColumn];
      });
      return mappedRow;
    });

    setIsImporting(true);
    toast.loading(t('Importing...'));

    router.post(route(importRoute), {
      data: mappedData
    }, {
      preserveState: true,
      onSuccess: (page) => {
        onClose();
        setIsImporting(false);
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
        setIsImporting(false);
        toast.dismiss();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('Import Data - Map CSV Columns')}</DialogTitle>
        </DialogHeader>

        <Alert className="bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            {t('Map your CSV columns to database fields. Scroll horizontally to see all columns.')}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">{t('Map CSV Columns to Database Fields')}</h3>
          
          {excelColumns.length > 10 && (
            <div className="text-xs text-gray-500 flex items-center gap-2 bg-blue-50 p-2 rounded">
              <Info className="h-3 w-3" />
              <span>{t('{{count}} columns detected. Table will scroll horizontally to show all columns.', { count: excelColumns.length })}</span>
            </div>
          )}
          
          <div className="border rounded-lg">
            <div className="overflow-x-scroll">
              <div className="max-h-[400px] overflow-y-scroll">
                <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b sticky top-0 z-10 block w-full">
                <tr className="flex w-full">
                  {databaseFields.map((field) => (
                    <th key={field.key} className="px-3 py-3 text-left font-medium text-gray-700 min-w-[200px] border-r border-gray-200 last:border-r-0">
                      <div className="space-y-2">
                        <div className="font-semibold text-xs uppercase tracking-wide">
                          {field.key.replace(/_/g, ' ')}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        <Select
                          value={mapping[field.key] || '__unselect__'}
                          onValueChange={(value) => {
                            setMapping(prev => {
                              const newMapping = { ...prev };
                              if (value === '__unselect__') {
                                delete newMapping[field.key];
                              } else {
                                Object.keys(newMapping).forEach(key => {
                                  if (newMapping[key] === value) delete newMapping[key];
                                });
                                newMapping[field.key] = value;
                              }
                              return newMapping;
                            });
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs w-full">
                            <SelectValue placeholder={t('Select column...')} />
                          </SelectTrigger>
                          <SelectContent position="popper" className="z-[9999] max-h-[200px]">
                            <SelectItem value="__unselect__">{t('-- Select Column --')}</SelectItem>
                            {excelColumns.map(col => {
                              const isUsed = Object.values(mapping).includes(col) && mapping[field.key] !== col;
                              return (
                                <SelectItem key={col} value={col} disabled={isUsed}>
                                  <div className="flex items-center justify-between w-full">
                                    <span className="truncate">{col}</span>
                                    {isUsed && <span className="text-xs text-gray-400 ml-2">(used)</span>}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 block max-h-[300px] overflow-y-scroll">
                {previewData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 flex w-full">
                    {databaseFields.map(field => (
                      <td key={field.key} className="px-3 py-2 text-gray-600 min-w-[200px] text-xs border-r border-gray-100 last:border-r-0">
                        <div className="truncate max-w-[180px]" title={mapping[field.key] ? row[mapping[field.key]] || t('No data') : t('-')}>
                          {mapping[field.key] ? row[mapping[field.key]] || t('No data') : t('-')}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}

                {previewData.length === 0 && (
                  <tr className="flex w-full">
                    <td colSpan={databaseFields.length} className="px-3 py-6 text-center text-sm text-gray-500">
                      {t('No preview data available')}
                    </td>
                  </tr>
                )}
              </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 mt-6">
          <Button type="button" variant="outline" onClick={onClose} disabled={isImporting}>
            {t('Cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isImporting}>
            {isImporting ? t('Importing...') : t('Import Data')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}