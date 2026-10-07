import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: string;
  title: string;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  table,
  title
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('table', table);

    try {
      const response = await fetch('/import/file', {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      const result = await response.json();

      if (result.success) {
        setHeaders(result.headers);
        setFields(result.fields);
        setPreview(result.preview);
        setStep(2);
      } else {
        toast.error(result.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldMapping = (field: string, columnIndex: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: parseInt(columnIndex)
    }));
  };

  const canProceed = () => {
    return fields.every(field => mapping[field] !== undefined);
  };

  const handleImport = async () => {
    if (!canProceed()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/import/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          table,
          mapping
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${result.imported} records imported successfully`);
        if (result.errors.length > 0) {
          toast.warning(`${result.errors.length} records failed to import`);
        }
        onClose();
        router.reload();
      } else {
        toast.error('Import failed');
      }
    } catch (error) {
      toast.error('Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = `/template/${table}`;
  };

  const resetModal = () => {
    setStep(1);
    setFile(null);
    setHeaders([]);
    setFields([]);
    setPreview([]);
    setMapping({});
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title} - {t('Import')}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {t('Upload your CSV file to import')} {title.toLowerCase()}
            </div>
            
            <Button 
              onClick={handleDownloadTemplate}
              variant="outline"
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              {t('Download Template')}
            </Button>

            <div>
              <Label htmlFor="file">{t('Select CSV File')}</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            {isLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">{t('Processing file...')}</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded">
              <AlertCircle className="w-4 h-4" />
              {t('Map your CSV columns to database fields')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field) => (
                <div key={field}>
                  <Label>{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                  <Select onValueChange={(value) => handleFieldMapping(field, value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select column')} />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {preview.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">{t('Data Preview')}</h4>
                <div className="border rounded overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {headers.map((header, index) => (
                          <th key={index} className="px-3 py-2 text-left font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, index) => (
                        <tr key={index} className="border-t">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                {t('Back')}
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!canProceed() || isLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isLoading ? t('Importing...') : t('Import Data')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};