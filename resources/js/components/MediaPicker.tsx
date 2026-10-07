import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import MediaLibraryModal from './MediaLibraryModal';
import { Image as ImageIcon, X } from 'lucide-react';

interface MediaPickerProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  multiple?: boolean;
  placeholder?: string;
  showPreview?: boolean;
}

export default function MediaPicker({ 
  label, 
  value = '', 
  onChange, 
  multiple = false,
  placeholder = 'Select image...',
  showPreview = true
}: MediaPickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (selectedUrl: string) => {
    onChange(selectedUrl);
  };

  const handleClear = () => {
    onChange('');
  };

  const imageUrls = value ? value.split(',').filter(Boolean) : [];

  // Extract filename from URL for display
  const getDisplayValue = (url: string) => {
    if (!url) return '';
    const urls = url.split(',').filter(Boolean);
    return urls.map(u => {
      const filename = u.split('/').pop() || u;
      return filename.split('?')[0]; // Remove query parameters
    }).join(', ');
  };

  // Get display URL for images
  const getDisplayUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) {
      return `${(window as any).appSettings?.imageUrl || ''}${url}`;
    }
    return `${(window as any).appSettings?.imageUrl || ''}/${url}`;
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={getDisplayValue(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly
        />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Browse
          </Button>
          {value && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleClear}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Preview */}
      {showPreview && imageUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={getDisplayUrl(url)}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 sm:h-20 object-cover rounded border"
                onError={(e) => {
                  // Fallback for failed image loads
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      )}

      <MediaLibraryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
        multiple={multiple}
      />
    </div>
  );
}