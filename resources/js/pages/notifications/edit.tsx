import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NotificationForm } from './form';

export default function EditNotification() {
  const { t } = useTranslation();
  const { notification } = usePage().props as any;

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Notifications'), href: route('notifications.index') },
    { title: t('Edit Notification') }
  ];

  const pageActions = [
    {
      label: t('Back'),
      icon: <ArrowLeft className="h-4 w-4" />,
      variant: 'outline',
      onClick: () => router.visit(route('notifications.index'))
    }
  ];

  const handleSuccess = () => {
    router.visit(route('notifications.index'));
  };

  return (
    <PageTemplate 
      title={t('Edit Notification')} 
      description={t('Update existing sale return.')}
      actions={pageActions} 
      breadcrumbs={breadcrumbs}
    >
      <NotificationForm 
        notification={notification}
        mode="edit" 
        onSuccess={handleSuccess}
      />
    </PageTemplate>
  );
}