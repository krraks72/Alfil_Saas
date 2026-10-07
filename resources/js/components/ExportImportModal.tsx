import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Download, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ImportMappingModal } from './ImportMappingModal';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  title: string;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  type,
  title
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [showMappingModal, setShowMappingModal] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/export/${type}`, {
        method: 'GET',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Export completed successfully');
      } else {
        toast.error('Export failed');
      }
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
  };

  const handleImportClick = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('table', type);
    formData.append('_token', document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '');

    try {
      const response = await fetch('/csv/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.error !== '') {
        toast.error(result.error);
      } else {
        // Get the modal data
        const modalResponse = await fetch(`/import/csv/modal/?table=${type}&status=true`);
        const modalData = await modalResponse.json();

        // Parse the fields JSON
        const fieldsArray = JSON.parse(modalData.fields);

        setHeaders(modalData.headers);
        setFields(fieldsArray);

        // Convert HTML table to preview data
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<table>${result.output}</table>`, 'text/html');
        const rows = Array.from(doc.querySelectorAll('tr'));
        const previewData = rows.slice(0, 5).map(row =>
          Array.from(row.querySelectorAll('td')).map(cell => cell.textContent || '')
        );

        setPreview(previewData);
        setShowMappingModal(true);
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetImportState = () => {
    setFile(null);
    setHeaders([]);
    setFields([]);
    setPreview([]);
    setShowMappingModal(false);
  };

  const handleClose = () => {
    resetImportState();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`/template/${type}`, {
        method: 'GET',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_template.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Template downloaded successfully');
      } else {
        toast.error('Template download failed');
      }
    } catch (error) {
      toast.error('Template download failed');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{title} - Export/Import {showMappingModal ? '(Mapping Modal Should Be Open)' : ''}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="export" className="w-full" onValueChange={(value) => {
            if (value === 'import') {
              resetImportState();
            }
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="export">Export</TabsTrigger>
              <TabsTrigger value="import">Import</TabsTrigger>
            </TabsList>

            <TabsContent value="export" className="space-y-4">
              <div className="text-sm text-gray-600">
                Export your {type} data to Excel format
              </div>
              <Button
                onClick={handleExport}
                disabled={isLoading}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                {isLoading ? 'Exporting...' : 'Export Data'}
              </Button>
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <div className="text-sm text-gray-600">
                Upload your CSV file to import {title.toLowerCase()}
              </div>

              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                className="w-full"
              >
                <FileText className="w-4 h-4 mr-2" />
                Download Template
              </Button>

              <div>
                <Label htmlFor="file">Select CSV File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleImportClick}
                disabled={!file || isLoading}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isLoading ? 'Processing...' : 'Import'}
              </Button>

             

              {isLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Processing file...</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};
