import { useState } from 'react';

export const useExportImport = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const openExportImportModal = (type: string, title: string) => {
    setModalType(type);
    setModalTitle(title);
    setIsModalOpen(true);
  };

  const closeExportImportModal = () => {
    setIsModalOpen(false);
    setModalType('');
    setModalTitle('');
  };

  return {
    isModalOpen,
    modalType,
    modalTitle,
    openExportImportModal,
    closeExportImportModal,
  };
};