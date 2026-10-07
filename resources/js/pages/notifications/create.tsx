import { PageTemplate } from '@/components/page-template';
import { router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NotificationForm } from './form';

export default function CreateNotification() {
  const { t } = useTranslation();

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Notifications'), href: route('notifications.index') },
    { title: t('Create Notification') }
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
      title={t('Create Notification')} 
      description={t('Create a new notifications.')}
      actions={pageActions} 
      breadcrumbs={breadcrumbs}
    >
      <NotificationForm 
        mode="create" 
        onSuccess={handleSuccess}
      />
    </PageTemplate>
  );
}