import { useState, useRef, useEffect } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import { route } from 'ziggy-js'
import { PageTemplate } from '@/components/page-template'
import { Pagination } from '@/components/ui/pagination'
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar'
import { CrudTable } from '@/components/CrudTable'
import { useTranslation } from 'react-i18next'

interface EmailTemplate {
  id: number
  name: string
  from: string
  created_at: string
  email_template_langs: Array<{
    id: number
    lang: string
    subject: string
  }>
}

interface Props {
  templates: {
    data: EmailTemplate[]
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
  }
}

export default function EmailTemplatesIndex({ templates, filters: pageFilters = {} }: Props) {
  const { t } = useTranslation()
  const { auth } = usePage().props as any
  const permissions = auth?.permissions || []
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '')
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [sortField, setSortField] = useState(pageFilters.sort_field || '')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(pageFilters.sort_direction || 'desc')

  const handleAction = (action: string, item: EmailTemplate) => {
    if (action === 'view') {
      router.get(route('email-templates.show', item.id))
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters()
  }

  const applyFilters = () => {
    const params: any = { page: 1 }
    
    if (searchTerm) {
      params.search = searchTerm
    }
    
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all') {
        params[key] = value
      }
    })
    
    if (sortField) {
      params.sort_field = sortField
      params.sort_direction = sortDirection
    }
    
    if (pageFilters.per_page) {
      params.per_page = pageFilters.per_page
    }
    
    router.get(route('email-templates.index'), params, { preserveState: true, preserveScroll: true })
  }

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortDirection(newDirection)
    
    const params: any = { page: 1 }
    
    if (searchTerm) {
      params.search = searchTerm
    }
    
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all') {
        params[key] = value
      }
    })
    
    params.sort_field = field
    params.sort_direction = newDirection
    
    if (pageFilters.per_page) {
      params.per_page = pageFilters.per_page
    }
    
    router.get(route('email-templates.index'), params, { preserveState: true, preserveScroll: true })
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value }))
  }

  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
    } else {
      applyFilters()
    }
  }, [filterValues])

  const hasActiveFilters = () => {
    return Object.values(filterValues).some(value => {
      return value && value !== '' && value !== 'all'
    }) || searchTerm !== ''
  }



  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Email Templates') }
  ]

  const columns = [
    { 
      key: 'name', 
      label: t('Name'), 
      sortable: true
    }
  ]

  const actions = [
    { 
      label: t('View'),
      icon: 'Eye',
      action: 'view',
      className: 'text-blue-500'
    }
  ]

  return (
    <PageTemplate 
      title={t('Email Templates')} 
      url={route('email-templates.index')}
      breadcrumbs={breadcrumbs}
      noPadding
      description={t('Manage your email templates.')}
    >
      <Head title="Email Templates" />
      
      {/* Search section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 border">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={[]}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={() => {
            return Object.values(filterValues).filter(v => v && v !== '' && v !== 'all').length + (searchTerm ? 1 : 0)
          }}
          onResetFilters={() => {
            setSearchTerm('')
            setFilterValues({})
            setSortField('')
            setSortDirection('desc')
            router.get(route('email-templates.index'), { page: 1 }, { preserveState: true, preserveScroll: true })
          }}
        />
      </div>

      {/* Content section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={templates?.data || []}
          from={templates?.from || 1}
          onAction={handleAction}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          permissions={permissions}
        />

        {/* Pagination section */}
        <Pagination
          from={templates?.from || 0}
          to={templates?.to || 0}
          total={templates?.total || 0}
          links={templates?.links}
          entityName={t("templates")}
          onPageChange={(url) => {
            if (url) {
              const urlObj = new URL(url, window.location.origin)
              if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString())
              if (pageFilters.search) urlObj.searchParams.set('search', pageFilters.search)
              if (sortField) {
                urlObj.searchParams.set('sort_field', sortField)
                urlObj.searchParams.set('sort_direction', sortDirection)
              }
              Object.entries(filterValues).forEach(([key, val]) => {
                if (val && val !== '' && val !== 'all') urlObj.searchParams.set(key, val)
              })
              router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true })
            }
          }}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value) => {
            const params: any = { page: 1, per_page: parseInt(value) }
            if (searchTerm) params.search = searchTerm
            Object.entries(filterValues).forEach(([key, val]) => {
              if (val && val !== '' && val !== 'all') params[key] = val
            })
            if (sortField) {
              params.sort_field = sortField
              params.sort_direction = sortDirection
            }
            router.get(route('email-templates.index'), params, { preserveState: true, preserveScroll: true })
          }}
        />
      </div>
    </PageTemplate>
  )
}