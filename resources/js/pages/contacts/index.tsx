import { useState, useRef, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { CrudTable } from '@/components/CrudTable';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { toast } from '@/components/custom-toast';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Dialog } from '@/components/ui/dialog';
import ViewPopup from './view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

export default function ContactUsPage() {
  const { t } = useTranslation();
  const { auth, contacts, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [sortField, setSortField] = useState(pageFilters.sort_field || '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(pageFilters.sort_direction || 'desc');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const getInitials = useInitials();

  const applyFilters = () => {
    const params: any = { page: 1 };
    if (searchTerm) params.search = searchTerm;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (sortField) {
      params.sort_field = sortField;
      params.sort_direction = sortDirection;
    }
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all') {
        params[key] = value;
      }
    });
    router.get(route('contacts.index'), params, { preserveState: true, preserveScroll: true });
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
    params.sort_field = field;
    params.sort_direction = newDirection;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all') {
        params[key] = value;
      }
    });
    router.get(route('contacts.index'), params, { preserveState: true, preserveScroll: true });
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

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Landing Page'), href: route('landing-page') },
    { title: t('Contact Inquiries') }
  ];

  const handleAction = (action: string, item: any) => {
    if (action === 'delete') {
      setCurrentContact(item);
      setIsDeleteModalOpen(true);
    } else if (action === 'view') {
      setCurrentContact(item);
      setIsViewModalOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (currentContact) {
      toast.loading(t('Deleting contact message...'));
      router.delete(route('contacts.destroy', currentContact.id), {
        onSuccess: (page) => {
          setIsDeleteModalOpen(false);
          setCurrentContact(null);
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
          setCurrentContact(null);
          if (typeof errors === 'string') {
            toast.error(errors);
          } else if (errors.error) {
            toast.error(errors.error);
          } else {
            toast.error(`Failed to delete contact message: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    }
  };

  const columns = [
    { key: 'name', label: t('user'), render: (value: string, record: any) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{getInitials(value)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{record.email}</div>
        </div>
        </div>
      ) },
    // { key: 'email', label: t('Email') },
    {
      key: 'created_at',
      label: t('Date'),
      type: 'date',
      // render: (value: string) => window.appSettings.formatDateTime(new Date(value),false)
    }
  ];

  const actions = [
    {
      label: t('View'),
      action: 'view',
      icon: 'Eye',
      className: 'text-blue-500 hover:text-blue-700'
    },
    {
      label: t('Delete'),
      action: 'delete',
      icon: 'Trash2',
      className: 'text-red-500 hover:text-red-700'
    }
  ];

  return (
    <PageTemplate
      title={t("Contact Inquiries")}
      url="/contacts"
      breadcrumbs={breadcrumbs}
      noPadding
      description={t('Manage and review contact inquiries from users.')}
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
            router.get(route('contacts.index'), { page: 1 }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={contacts?.data || []}
          from={contacts?.from || 1}
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
          from={contacts?.from || 0}
          to={contacts?.to || 0}
          total={contacts?.total || 0}
          links={contacts?.links}
          entityName={t("contact inquiries")}
          onPageChange={(url) => {
            if (url) {
              const urlObj = new URL(url, window.location.origin);
              if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
              if (pageFilters.search) urlObj.searchParams.set('search', pageFilters.search);
              if (sortField) {
                urlObj.searchParams.set('sort_field', sortField);
                urlObj.searchParams.set('sort_direction', sortDirection);
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
              params.sort_field = sortField;
              params.sort_direction = sortDirection;
            }
            router.get(route('contacts.index'), params, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCurrentContact(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={currentContact?.name || ''}
        entityName="contact inquiries"
      />

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        {currentContact && <ViewPopup record={currentContact} />}
      </Dialog>
    </PageTemplate>
  );
}
