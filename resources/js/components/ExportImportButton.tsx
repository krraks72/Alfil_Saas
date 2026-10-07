import React from 'react';
import { Button } from './ui/button';
import { Download, Upload } from 'lucide-react';
import { useExportImport } from '../hooks/useExportImport';
import { ExportImportModal } from './ExportImportModal';

interface ExportImportButtonProps {
  type: string;
  title: string;
  variant?: 'export' | 'import' | 'both';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ExportImportButton: React.FC<ExportImportButtonProps> = ({
  type,
  title,
  variant = 'both',
  size = 'md',
  className = ''
}) => {
  const {
    isModalOpen,
    modalType,
    modalTitle,
    openExportImportModal,
    closeExportImportModal,
  } = useExportImport();

  const handleClick = () => {
    openExportImportModal(type, title);
  };

  const getButtonText = () => {
    switch (variant) {
      case 'export':
        return 'Export';
      case 'import':
        return 'Import';
      default:
        return 'Export/Import';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'export':
        return <Download className="w-4 h-4 mr-2" />;
      case 'import':
        return <Upload className="w-4 h-4 mr-2" />;
      default:
        return <Download className="w-4 h-4 mr-2" />;
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant="outline"
        size={size}
        className={className}
      >
        {getIcon()}
        {getButtonText()}
      </Button>

      <ExportImportModal
        isOpen={isModalOpen}
        onClose={closeExportImportModal}
        type={modalType}
        title={modalTitle}
      />
    </>
  );
};