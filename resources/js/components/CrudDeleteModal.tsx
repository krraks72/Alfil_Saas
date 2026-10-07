// components/CrudDeleteModal.tsx
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface CrudDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  entityName: string;
}

export function CrudDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  entityName
}: CrudDeleteModalProps) {
  const { t } = useTranslation();

  const [isChatGptOpen, setIsChatGptOpen] = useState(false);

  useEffect(() => {
    const checkChatGpt = () => {
      const chatGptModal = document.querySelector('[data-chatgpt-modal]');
      setIsChatGptOpen(!!chatGptModal);
    };
    const observer = new MutationObserver(checkChatGpt);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} modal={!isChatGptOpen}>
      <DialogContent className="w-[95vw] sm:max-w-md p-0 rounded-xl overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-2 text-left">
          <DialogTitle className="text-lg sm:text-xl font-semibold break-words">
            {t("Delete")} {entityName}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="px-4 sm:px-6 text-sm text-gray-600 dark:text-gray-400 break-words leading-relaxed">
          {t("Are you sure you want to delete")} <span className="font-semibold text-gray-900 dark:text-gray-100">{itemName || `this ${entityName}`}</span>? {t("This action cannot be undone.")}
        </DialogDescription>
        <DialogFooter className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 lg:gap-0 lg:space-x-2">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm font-medium">
            {t("Cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} className="w-full sm:w-auto text-sm font-medium">
            {t("Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
