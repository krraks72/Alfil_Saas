import { useState, useEffect, useRef } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import { PageTemplate } from '@/components/page-template'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CrudTable } from '@/components/CrudTable'
import { Pagination } from '@/components/ui/pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface NotificationTemplate {
  id: number;
  name: string;
  type: string;
  created_at: string;
  notification_template_langs: Array<{
    lang: string;
    title: string;
    content: string;
  }>;
}

interface Props {
  templates: {
    data: NotificationTemplate[]
    from: number
    to: number
    total: number
    links: Array<{
      url: string | null
      label: string
      active: boolean
    }>
  }
  filters: {
    search?: string
    sort_field?: string
    sort_direction?: string
    per_page?: number
    type?: string
  }
}

export default function NotificationTemplatesIndex({ templates, filters: pageFilters = {} }: Props) {
  const { t } = useTranslation()
  const { auth } = usePage().props as any
  const permissions = auth?.permissions || []
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '')
  const [activeType, setActiveType] = useState(pageFilters.type || 'slack')
  const formRef = useRef<HTMLFormElement>(null)
  const isInitialSearchMount = useRef(true)

  const handleAction = (action: string, item: NotificationTemplate) => {
    if (action === 'view') {
      router.get(route('notification-templates.show', item.id))
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters()
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  const clearSearch = () => {
    setSearchTerm('')
    router.get(route('notification-templates.index'), {
      page: 1,
      type: activeType,
      ...(pageFilters.sort_field && { sort_field: pageFilters.sort_field, sort_direction: pageFilters.sort_direction }),
      ...(pageFilters.per_page && { per_page: pageFilters.per_page }),
    }, { preserveState: true, preserveScroll: true })
  }

  const applyFilters = () => {
    router.get(route('notification-templates.index'), {
      page: 1,
      search: searchTerm || undefined,
      type: activeType,
      ...(pageFilters.sort_field && { sort_field: pageFilters.sort_field, sort_direction: pageFilters.sort_direction }),
      ...(pageFilters.per_page && { per_page: pageFilters.per_page }),
    }, { preserveState: true, preserveScroll: true })
  }

  const handleTypeChange = (type: string) => {
    setActiveType(type)
    router.get(route('notification-templates.index'), {
      page: 1,
      search: searchTerm || undefined,
      type,
      ...(pageFilters.sort_field && { sort_field: pageFilters.sort_field, sort_direction: pageFilters.sort_direction }),
      ...(pageFilters.per_page && { per_page: pageFilters.per_page }),
    }, { preserveState: true, preserveScroll: true })
  }

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field
      ? (pageFilters.sort_direction === 'asc' ? 'desc' : 'asc')
      : 'asc'
    router.get(route('notification-templates.index'), {
      sort_field: field,
      sort_direction: direction,
      page: 1,
      search: searchTerm || undefined,
      type: activeType,
      ...(pageFilters.per_page && { per_page: pageFilters.per_page }),
    }, { preserveState: true, preserveScroll: true })
  }

  // Auto-submit search with debounce
  useEffect(() => {
    if (isInitialSearchMount.current) {
      isInitialSearchMount.current = false
      return
    }

    const timer = setTimeout(() => {
      formRef.current?.requestSubmit()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const breadcrumbs = [
    { title: t("Dashboard"), href: route('dashboard') },
    { title: t("Notification Templates") }
  ]

  const columns = [
    { key: 'name', label: t('Name'), sortable: true },
  ]

  const actions = [
    { label: t('View'), icon: 'Eye', action: 'view', className: 'text-blue-500' },
  ]

  return (
    <PageTemplate
      title={t("Notification Templates")}
      url={route('notification-templates.index')}
      breadcrumbs={breadcrumbs}
      noPadding
      description={t('Manage system notification templates for automated messages.')}
    >
      <Head title={t("Notification Templates")} />

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 p-3 border">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <form ref={formRef} onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('Search templates...')}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-9 pr-8 h-9"
                />
                {searchTerm && (
                  <X 
                    className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer hover:text-gray-700" 
                    onClick={clearSearch}
                  />
                )}
              </div>
            </form>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Tabs value={activeType} onValueChange={handleTypeChange} className="w-full sm:w-auto">
              <TabsList className="grid w-full sm:w-fit grid-cols-2">
                <TabsTrigger value="slack" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground cursor-pointer">{t('Slack')}</TabsTrigger>
                <TabsTrigger value="twilio" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground cursor-pointer">{t('Twilio')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={templates?.data || []}
          from={templates?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction as 'asc' | 'desc'}
          onSort={handleSort}
          permissions={permissions}
        />

        <Pagination
          from={templates?.from || 0}
          to={templates?.to || 0}
          total={templates?.total || 0}
          links={templates?.links}
          entityName={t('templates')}
          currentPerPage={pageFilters.per_page?.toString() || '10'}
          onPerPageChange={(value) => {
                router.get(route('notification-templates.index'), {
                  page: 1,
                  ...(parseInt(value) !== 10 && { per_page: parseInt(value) }),
                  search: searchTerm || undefined,
                  type: activeType,
                  sort_field: pageFilters.sort_field || undefined,
                  sort_direction: pageFilters.sort_direction || undefined,
                }, { preserveState: true, preserveScroll: true })
              }}
          onPageChange={(url) => router.get(url, {}, { preserveState: true, preserveScroll: true })}
        />
      </div>
    </PageTemplate>
  )
}