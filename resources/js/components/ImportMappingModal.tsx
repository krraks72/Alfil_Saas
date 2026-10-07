import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';

interface ImportMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  headers: string[];
  fields: string[];
  preview: string[][];
}

export const ImportMappingModal: React.FC<ImportMappingModalProps> = ({
  isOpen,
  onClose,
  type,
  headers,
  fields,
  preview
}) => {
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleFieldMapping = (field: string, columnIndex: string) => {
    if (field === 'none' || field === '') {
      setMapping(prev => {
        const newMapping = { ...prev };
        Object.keys(newMapping).forEach(key => {
          if (newMapping[key] === parseInt(columnIndex)) {
            delete newMapping[key];
          }
        });
        return newMapping;
      });
    } else {
      setMapping(prev => ({
        ...prev,
        [field]: parseInt(columnIndex)
      }));
    }
  };

  const canProceed = () => {
    return Object.keys(mapping).length > 0;
  };

  const handleImport = async () => {
    if (!canProceed()) return;

    setIsLoading(true);

    try {
      const routeName = type === 'customers' ? 'customer.process-import' : 'vendor.process-import';
      const response = await fetch(route(routeName), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ mapping }),
      });

      const result = await response.json();

      if (result.success) {
        let message = `${result.imported} records imported successfully`;
        if (result.skipped > 0) {
          message += `. ${result.skipped} duplicate records skipped`;
        }
        toast.success(message);
        onClose();
        router.reload();
      } else {
        toast.error(result.message || 'Import failed');
      }
    } catch (error) {
      toast.error('Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Data - Map CSV Columns</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded">
          <AlertCircle className="w-4 h-4" />
          Map your CSV columns to database fields
        </div>

        {preview.length > 0 && (
          <div>
            <div className="border rounded overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map((header, index) => (
                      <th key={index} className="px-3 py-2 text-center">
                        <div className="mb-2 font-medium">{header}</div>
                        <Select onValueChange={(value) => handleFieldMapping(value, index.toString())}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                            <SelectItem value="none">-- Select Field --</SelectItem>
                            {fields.map((field) => (
                              <SelectItem key={field} value={field}>
                                {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index} className="border-t">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2 text-center">
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!canProceed() || isLoading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isLoading ? 'Importing...' : 'Import Data'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};