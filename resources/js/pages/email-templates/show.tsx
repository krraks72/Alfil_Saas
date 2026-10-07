import { useState, useEffect } from 'react'
import { Head, Link, router, usePage } from '@inertiajs/react'
import { PageTemplate } from '@/components/page-template'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { RichTextField } from '@/components/ui/rich-text-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/components/custom-toast'

interface EmailTemplateLang {
  id: number
  lang: string
  subject: string
  content: string
}

interface EmailTemplate {
  id: number
  name: string
  from: string
  email_template_langs: EmailTemplateLang[]
}

interface Language {
  code: string
  name: string
  countryCode: string
}

interface Props {
  template: EmailTemplate
  languages: Language[]
  variables: Record<string, string>
}

export default function EmailTemplateShow({ template, languages, variables }: Props) {
  const { t } = useTranslation()
  const { flash } = usePage().props as any
  const [fromName, setFromName] = useState(template.from)
  const [currentLang, setCurrentLang] = useState(languages[0]?.code || 'en')
  const [templateLangs, setTemplateLangs] = useState(
    template.email_template_langs.reduce((acc, lang) => {
      acc[lang.lang] = {
        subject: lang.subject,
        content: lang.content
      }
      return acc
    }, {} as Record<string, { subject: string; content: string }>)
  )

  const handleSubjectChange = (lang: string, subject: string) => {
    setTemplateLangs(prev => ({
      ...prev,
      [lang]: { ...prev[lang], subject }
    }))
  }

  const handleContentChange = (lang: string, content: string) => {
    setTemplateLangs(prev => ({
      ...prev,
      [lang]: { ...prev[lang], content }
    }))
  }

  const handleSave = () => {
    toast.info('Save functionality will be implemented later');
  }

  // Handle flash messages
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success)
    }
    if (flash?.error) {
      toast.error(flash.error)
    }
  }, [flash])

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Email Templates'), href: route('email-templates.index') },
    { title: template.name }
  ]

  const pageActions: any[] = [
    {
      label: t('Back'),
      icon: <ArrowLeft className="h-4 w-4" />,
      variant: 'outline',
      onClick: () => router.visit(route('email-templates.index'))
    }
  ]

  return (
    <PageTemplate
      title={template.name}
      url={route('email-templates.show', template.id)}
      breadcrumbs={breadcrumbs}
      actions={pageActions}
      description={t('Edit email template settings and content.')}
    >
      <Head title={`Edit Template - ${template.name}`} />

      <div className="grid gap-6 lg:grid-cols-3 w-full max-w-full overflow-x-hidden">
        <div className="lg:col-span-2 space-y-6 min-w-0 w-full">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <CardTitle>{t("Template Settings")}</CardTitle>
                <Button 
                  onClick={() => {
                    router.put(route('email-templates.update-settings', template.id), {
                      from: fromName
                    })
                  }}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t("Save Changes")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              <div className="grid gap-2">
                <Label>{t("Template Name")}</Label>
                <Input value={template.name} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">{t("Template name cannot be changed")}</p>
              </div>
              
              <div className="grid gap-2">
                <Label required htmlFor="from">{t("From Name")}</Label>
                <Input
                  required
                  id="from"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder={t("Enter from name (e.g., {app_name}, Support Team)")}
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <CardTitle>{t("Email Content")}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("Customize email content for different languages")}
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    const currentContent = templateLangs[currentLang]
                    if (currentContent) {
                      router.put(route('email-templates.update-content', template.id), {
                        lang: currentLang,
                        subject: currentContent.subject,
                        content: currentContent.content
                      })
                    }
                  }}
                  size="sm"
                  className="w-full sm:w-auto shrink-0"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t("Save Content")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <Tabs value={currentLang} onValueChange={setCurrentLang} className="w-full">
                <div className="mb-4">
                  {/* Mobile Dropdown View */}
                  <div className="sm:hidden space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" />
                      {t("Select Language")}
                    </Label>
                    <Select value={currentLang} onValueChange={setCurrentLang}>
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder={t("Select Language")} />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((language) => (
                          <SelectItem key={language.code} value={language.code}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{language.name}</span>
                              <span className="text-xs text-muted-foreground">({language.code.toUpperCase()})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Desktop Tabs View */}
                  <div className="hidden sm:block w-full">
                    <TabsList className="flex flex-wrap h-auto p-1.5 w-full justify-start gap-1.5 bg-muted rounded-lg">
                      {languages.map((language) => (
                        <TabsTrigger 
                          key={language.code} 
                          value={language.code} 
                          className="text-xs px-3 py-1.5 font-semibold rounded-md whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                        >
                          {language.code.toUpperCase()}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </div>
                
                {languages.map((language) => (
                  <TabsContent key={language.code} value={language.code} className="space-y-6 mt-6">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Badge variant="default" className="px-3 py-1 shrink-0">
                        {language.code.toUpperCase()}
                      </Badge>
                      <div className="min-w-0">
                        <span className="font-medium truncate block">{language.name}</span>
                        <p className="text-xs text-muted-foreground">{t("Edit email content for this language")}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        <Label htmlFor={`subject-${language.code}`} className="text-sm font-medium">
                          {t("Email Subject")}
                        </Label>
                        <Input
                          id={`subject-${language.code}`}
                          value={templateLangs[language.code]?.subject || ''}
                          onChange={(e) => handleSubjectChange(language.code, e.target.value)}
                          placeholder={t("Enter email subject (you can use variables like {app_name})")}
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <RichTextField
                          label="Email Content"
                          value={templateLangs[language.code]?.content || ''}
                          onChange={(content) => handleContentChange(language.code, content)}
                          placeholder={t("Write your email content here. You can use HTML formatting and variables...")}
                          className="min-h-[300px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          💡 {t("Tip: Use the variables from the sidebar to personalize your emails")}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                ))} 
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 w-full">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2">
                <span>{t("Available Variables")}</span>
                <Badge variant="secondary" className="text-xs">
                  {Object.keys(variables).length}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t("Click to copy variables to use in your email content")}
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-3">
                {Object.entries(variables).map(([variable, description]) => (
                  <div 
                    key={variable} 
                    className="group p-3 bg-muted/50 rounded-lg border hover:bg-muted/80 cursor-pointer transition-colors"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(variable)
                        toast.success(`Copied ${variable} to clipboard`)
                      } catch (err) {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea')
                        textArea.value = variable
                        document.body.appendChild(textArea)
                        textArea.select()
                        document.execCommand('copy')
                        document.body.removeChild(textArea)
                        toast.success(`Copied ${variable} to clipboard`)
                      }
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <code className="text-sm font-mono text-primary font-medium bg-background px-1.5 py-0.5 rounded break-all">
                        {variable}
                      </code>
                      <div className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {t("Click to copy")}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 <strong>{t("Tip")}:</strong> {t("These variables will be automatically replaced with actual values when emails are sent.")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTemplate>
  )
}