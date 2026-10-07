import React, { useState, useRef, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Plus } from 'lucide-react';
import { PageTemplate } from '@/components/page-template';
import { CrudTable } from '@/components/CrudTable';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Toaster } from '@/components/ui/toaster';

interface CustomPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  is_active: boolean;
  sort_order: number;
}

interface PageProps {
  pages: any;
  flash?: {
    success?: string;
    error?: string;
  };
  filters?: any;
  globalSettings?: any;
}

export default function CustomPagesIndex() {
  const { t } = useTranslation();
  const { pages, filters: pageFilters = {}, globalSettings } = usePage<PageProps>().props;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPage, setDeletingPage] = useState<CustomPage | null>(null);
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [sortField, setSortField] = useState(pageFilters.sort_field || '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(pageFilters.sort_direction || 'desc');

  const handleEdit = (page: CustomPage) => {
    router.get(route('landing-page.custom-pages.edit', page.id));
  };

  const handleDelete = (page: CustomPage) => {
    setDeletingPage(page);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!globalSettings?.is_demo) {
      toast.loading(t('Deleting page...'));
    }

    router.delete(route('landing-page.custom-pages.destroy', deletingPage.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        setDeletingPage(null);
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash?.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        if (typeof errors === 'string') {
          toast.error(t(errors));
        } else {
          toast.error(t('Failed to delete page'));
        }
      }
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

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
    router.get(route('landing-page.custom-pages.index'), params, { preserveState: true, preserveScroll: true });
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

  const handleAction = (action: string, item: CustomPage) => {
    if (action === 'edit') handleEdit(item);
    else if (action === 'delete') handleDelete(item);
  };

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    
    const params: any = { sort_field: field, sort_direction: newDirection, page: 1 };
    if (searchTerm) params.search = searchTerm;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all') {
        params[key] = value;
      }
    });
    router.get(route('landing-page.custom-pages.index'), params, { preserveState: true, preserveScroll: true });
  };

  const columns = [
    {
      key: 'title',
      label: t('Title'),
      sortable: true,
      render: (value: string) => <div className="font-medium">{value}</div>
    },
    {
      key: 'content',
      label: t('Content'),
      render: (value: string) => {
        const plainText = value.replace(/<[^>]*>/g, '');
        return <div className="max-w-xs truncate" title={plainText}>{plainText.substring(0, 100)}...</div>;
      }
    },
    {
      key: 'is_active',
      label: t('Status'),
      render: (value: boolean) => {
        const statusClass = value
          ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
          : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20';
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusClass}`}>
            {value ? t('Active') : t('Inactive')}
          </span>
        );
      }
    },
    {
      key: 'created_at',
      label: t('Created'),
      sortable: true,
      type: 'date',
      // render: (value: string) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString()
    }
  ];

  const actions = [
    { label: t('Edit'), icon: 'Edit', action: 'edit', className: 'text-amber-500' },
    { label: t('Delete'), icon: 'Trash2', action: 'delete', className: 'text-red-500' }
  ];

  return (
    <PageTemplate
      title={t('Custom Pages')}
      url="/custom-pages"
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Landing Page'), href: route('landing-page') },
        { title: t('Custom Pages') }
      ]}
      actions={[
        {
          label: t('Add Page'),
          icon: <Plus className="w-4 h-4" />,
          variant: 'default',
          onClick: () => router.get(route('landing-page.custom-pages.create'))
        }
      ]}
      noPadding
      description={t('Manage your custom pages and their content.')}
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
            router.get(route('landing-page.custom-pages.index'), { page: 1 }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={pages?.data || pages || []}
          from={pages?.from || 1}
          onAction={handleAction}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

        {pages?.links && (
          <Pagination
            from={pages?.from || 0}
            to={pages?.to || 0}
            total={pages?.total || 0}
            links={pages?.links}
            entityName="pages"
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
              router.get(route('landing-page.custom-pages.index'), params, { preserveState: true, preserveScroll: true });
            }}
          />
        )}
      </div>

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeletingPage(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={deletingPage?.title || ''}
        entityName="page"
      />

      <Toaster />
    </PageTemplate>
  );
}
