import { usePage, router } from '@inertiajs/react';
import QuotationForm from './form';
import { useEffect } from 'react';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';

export default function EditQuotation() {
  const { quotation, flash } = usePage().props as any;
  const { t } = useTranslation();
  
  useEffect(() => {
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);
  
  if (quotation?.status === 'converted') {
    return null;
  }
  
  return <QuotationForm mode="edit" quotation={quotation} />;
}
