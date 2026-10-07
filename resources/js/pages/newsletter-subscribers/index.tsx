import { useState, useRef, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { CrudTable } from '@/components/CrudTable';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Send } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Button } from '@/components/ui/button';

export default function NewsletterPage() {
  const { t } = useTranslation();
  const { auth, subscriptions, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [sortField, setSortField] = useState(pageFilters.sort_by || '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(pageFilters.sort_order || 'desc');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  const applyFilters = () => {
    const params: any = { page: 1 };
    if (searchTerm) params.search = searchTerm;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (sortField) {
      params.sort_by = sortField;
      params.sort_order = sortDirection;
    }
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all') {
        params[key] = value;
      }
    });
    router.get(route('newsletter-subscribers.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);

    const params: any = { page: 1 };
    if (searchTerm) params.search = searchTerm;
    params.sort_by = field;
    params.sort_order = newDirection;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all') {
        params[key] = value;
      }
    });
    router.get(route('newsletter-subscribers.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      applyFilters();
    }
  }, [filterValues]);

  const hasActiveFilters = () => {
    return Object.values(filterValues).some(value => {
      return value && value !== '' && value !== 'all';
    }) || searchTerm !== '';
  };
  const handleSendNewsletter = () => {
    toast.loading(t('Sending newsletter...'));
    router.post(route('newsletter-subscribers.send'), {}, {
      onSuccess: (page) => {
        toast.dismiss();
        if (page.props.flash?.success) {
          toast.success(page.props.flash.success);
        } else if (page.props.flash?.error) {
          toast.error(page.props.flash.error);
        } else {
          toast.success(t('Newsletter sent successfully!'));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'object' && errors !== null) {
          const errorMessages = Object.values(errors).flat();
          toast.error(`Failed to send newsletter: ${errorMessages.join(', ')}`);
        } else {
          toast.error(t('Failed to send newsletter. Please try again.'));
        }
      }
    });
  };

  const handleAction = (action: string, item: any) => {
    if (action === 'delete') {
      setCurrentSubscription(item);
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (currentSubscription) {
      toast.loading(t('Deleting subscription...'));
      router.delete(route('newsletter-subscribers.destroy', currentSubscription.id), {
        onSuccess: (page) => {
          setIsDeleteModalOpen(false);
          setCurrentSubscription(null);
          toast.dismiss();
          if (page.props.flash.success) {
            toast.success(page.props.flash.success);
          } else if (page.props.flash.error) {
            toast.error(page.props.flash.error);
          }
        },
        onError: (errors) => {
          toast.dismiss();
          setIsDeleteModalOpen(false);
          setCurrentSubscription(null);
          if (typeof errors === 'string') {
            toast.error(errors);
          } else if (errors.error) {
            toast.error(errors.error);
          } else {
            toast.error(`Failed to delete subscription: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    }
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Landing Page') },
    { title: t('Newsletter') }
  ];

  const columns = [
    { key: 'email', label: t('Email') },
    {
      key: 'subscribed_at',
      label: t('Subscribed At'),
      type: 'date',
      // render: (value: string) => value ? window.appSettings.formatDateTime(new Date(value),false) : window.appSettings.formatDateTime(new Date(),false)
    },
    
  ];

  const actions = [
    {
      label: t('Delete'),
      action: 'delete',
      icon: 'Trash2',
      className: 'text-red-600 hover:text-red-900'
    }
  ];

  return (
    <PageTemplate
      title={t("Newsletter")}
      url="/newsletter-subscribers"
      breadcrumbs={breadcrumbs}
      noPadding
      headerActions={
        <Button
          onClick={handleSendNewsletter}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Send className="w-4 h-4 mr-2" />
          {t('Send Newsletter')}
        </Button>
      }
      description={t('Manage your newsletter subscriptions.')}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 border">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={[]}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={() => {
            return Object.values(filterValues).filter(v => v && v !== '' && v !== 'all').length + (searchTerm ? 1 : 0);
          }}
          onResetFilters={() => {
            setSearchTerm('');
            setFilterValues({});
            setSortField('');
            setSortDirection('desc');
            router.get(route('newsletter-subscribers.index'), { page: 1 }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={subscriptions?.data || []}
          from={subscriptions?.from || 1}
          onAction={handleAction}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: false,
            create: false,
            edit: false,
            delete: false
          }}
          showActions={true}
        />

        <Pagination
          from={subscriptions?.from || 0}
          to={subscriptions?.to || 0}
          total={subscriptions?.total || 0}
          links={subscriptions?.links}
          entityName={t("subscriptions")}
          onPageChange={(url) => {
            if (url) {
              const urlObj = new URL(url, window.location.origin);
              if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
              if (pageFilters.search) urlObj.searchParams.set('search', pageFilters.search);
              if (sortField) {
                urlObj.searchParams.set('sort_by', sortField);
                urlObj.searchParams.set('sort_order', sortDirection);
              }
              Object.entries(filterValues).forEach(([key, val]) => {
                if (val && val !== '' && val !== 'all') urlObj.searchParams.set(key, val);
              });
              router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
            }
          }}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value) => {
            const params: any = { page: 1, per_page: parseInt(value) };
            if (searchTerm) params.search = searchTerm;
            Object.entries(filterValues).forEach(([key, val]) => {
              if (val && val !== '' && val !== 'all') params[key] = val;
            });
            if (sortField) {
              params.sort_by = sortField;
              params.sort_order = sortDirection;
            }
            router.get(route('newsletter-subscribers.index'), params, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCurrentSubscription(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={currentSubscription?.email || ''}
        entityName="newsletter subscription"
      />
    </PageTemplate>
  );
}