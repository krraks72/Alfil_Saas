import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { router, useForm, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Permission {
    id: number;
    name: string;
    label: string;
    description: string | null;
}

interface PermissionGroup {
    module: string;
    label: string;
    permissions: Permission[];
}

interface CommerceType {
    id: number;
    name: string;
    description: string | null;
    plan_count: number;
    permissions: number[];
}

interface Props {
    commerceTypes: CommerceType[];
    permissionGroups: PermissionGroup[];
}

const spanishModuleLabels: Record<string, string> = {
    dashboard: 'Panel de control',
    users: 'Usuarios',
    roles: 'Roles',
    appointments: 'Calendario',
    notification_templates: 'Plantillas de notificación',
    branches: 'Sucursales',
    cash_registers: 'Cajas registradoras',
    customers: 'Clientes',
    vendors: 'Proveedores',
    brands: 'Marcas',
    categories: 'Categorías',
    taxes: 'Impuestos',
    units: 'Unidades',
    products: 'Productos',
    expense_categories: 'Categorías de gastos',
    expenses: 'Gastos',
    pos: 'Punto de venta',
    sales: 'Ventas',
    purchases: 'Compras',
    reports: 'Informes',
    branch_sales_targets: 'Objetivos de ventas por sucursal',
    quotations: 'Cotizaciones',
    sale_returns: 'Devoluciones de ventas',
    'purchase-returns': 'Devoluciones de compras',
    media: 'Archivos multimedia',
    settings: 'Ajustes de la',
};

const settingsPermissionLabels: Record<string, string> = {
    'manage-system-settings': 'System Settings',
    'manage-brand-settings': 'Brand Settings',
    'manage-currency-settings': 'Currency Settings',
    'manage-email-settings': 'Email Settings',
    'manage-email-notification-settings': 'Email Notification Settings',
    'manage-slack-settings': 'Slack Settings',
    'manage-twilio-settings': 'Twilio SMS Settings',
    'manage-webhook-settings': 'Webhook Settings',
    'manage-company-settings': 'Company Settings',
    'manage-payment-settings': 'Payment Settings',
    'manage-google-calendar-settings': 'Google Calendar Settings',
    'manage-quotation-invoice-settings': 'Quotation Settings',
    'manage-aliaddo-settings': 'Electronic Invoicing (Aliaddo)',
};

const spanishPermissionActions: Record<string, string> = {
    'Manage ': 'Administrar ',
    'View ': 'Ver ',
    'Create ': 'Crear ',
    'Edit ': 'Editar ',
    'Delete ': 'Eliminar ',
    'Reset Password ': 'Restablecer contraseña de ',
    'Change Status ': 'Cambiar estado de ',
    'Show ': 'Ver ',
    'Download ': 'Descargar ',
    'Export ': 'Exportar ',
    'Import ': 'Importar ',
    'Approve ': 'Aprobar ',
    'Reject ': 'Rechazar ',
    'Send ': 'Enviar ',
    'Convert ': 'Convertir ',
    'Apply ': 'Aplicar ',
    'Process ': 'Procesar ',
};

const spanishPermissionSubjects: Record<string, string> = {
    'Manage Dashboard': 'Administrar el panel de control',
    'Can view dashboard': 'Puede ver el panel de control',
    'Manage Settings': 'Administrar ajustes',
    'Can manage All settings': 'Puede administrar todos los ajustes',
    'View Processed Products': 'Ver productos procesados',
    'Can view processed products': 'Puede ver productos procesados',
    'Manage System Settings': 'Administrar ajustes del sistema',
    'Can manage system settings': 'Puede administrar los ajustes del sistema',
    'Manage Email Settings': 'Administrar ajustes de correo',
    'Can manage email settings': 'Puede administrar los ajustes de correo',
    'Manage Email Notification Settings': 'Administrar notificaciones por correo',
    'Can manage email notification settings': 'Puede administrar las notificaciones por correo',
    'Manage Brand Settings': 'Administrar identidad visual',
    'Can manage brand settings': 'Puede administrar la identidad visual',
    'Manage Company Settings': 'Administrar datos de la empresa',
    'Can manage Company settings': 'Puede administrar los datos de la empresa',
    'Manage Payment Settings': 'Administrar ajustes de pago',
    'Can manage payment settings': 'Puede administrar los ajustes de pago',
    'Manage Currency Settings': 'Administrar ajustes de moneda',
    'Can manage currency settings': 'Puede administrar los ajustes de moneda',
    'Manage Slack Settings': 'Administrar ajustes de Slack',
    'Can manage Slack settings': 'Puede administrar los ajustes de Slack',
    'Manage Twilio Settings': 'Administrar ajustes de Twilio',
    'Can manage Twilio settings': 'Puede administrar los ajustes de Twilio',
    'Manage Webhook Settings': 'Administrar ajustes de webhooks',
    'Can manage webhook settings': 'Puede administrar los ajustes de webhooks',
    'Manage Google Calendar Settings': 'Administrar ajustes de Google Calendar',
    'Can manage Google Calendar settings': 'Puede administrar los ajustes de Google Calendar',
    'Manage Quotation Settings': 'Administrar ajustes de cotizaciones',
    'Can manage quotation settings': 'Puede administrar los ajustes de cotizaciones',
    'Manage Aliaddo Settings': 'Administrar ajustes de Aliaddo',
    'Can manage Aliaddo settings': 'Puede administrar los ajustes de Aliaddo',
    'Manage Login History': 'Administrar el historial de inicio de sesión',
    'Can manage login history': 'Puede administrar el historial de inicio de sesión',
    'Show Login History': 'Ver el historial de inicio de sesión',
    'Can view login history': 'Puede ver el historial de inicio de sesión',
    'Delete Login History': 'Eliminar el historial de inicio de sesión',
    'Can delete login history': 'Puede eliminar el historial de inicio de sesión',
    'Manage All Media': 'Administrar todos los archivos multimedia',
    'Manage Any media': 'Administrar cualquier archivo multimedia',
    'Manage Own Media': 'Administrar los archivos multimedia propios',
    'Manage Limited media that is created by own': 'Administrar los archivos multimedia propios',
    'Can manage media': 'Puede administrar archivos multimedia',
    'Can manage Any media': 'Puede administrar cualquier archivo multimedia',
    'Can manage Limited media that is created by own': 'Puede administrar los archivos multimedia propios',
    'Can create media': 'Puede crear archivos multimedia',
    'Can edit media': 'Puede editar archivos multimedia',
    'Can delete media': 'Puede eliminar archivos multimedia',
    'Can view media': 'Puede ver archivos multimedia',
    'Can download media': 'Puede descargar archivos multimedia',
    'Can access POS interface': 'Puede acceder a la interfaz del punto de venta',
    'Can create sales transactions': 'Puede crear transacciones de venta',
    'Can apply discounts to sales': 'Puede aplicar descuentos a las ventas',
    'Can convert quotations to sales': 'Puede convertir cotizaciones en ventas',
    'Can view calendar events': 'Puede ver los eventos del calendario',
    'Can process refunds': 'Puede procesar reembolsos',
    'Create Sales': 'Crear ventas',
    'View POS': 'Ver punto de venta',
    'Apply Discounts': 'Aplicar descuentos',
    'Process Refunds': 'Procesar reembolsos',
    'Manage Branch Status': 'Administrar el estado de las sucursales',
    'Can manage branch status': 'Puede administrar el estado de las sucursales',
    'Manage Cash Register Status': 'Administrar el estado de las cajas registradoras',
    'Can manage cash register status': 'Puede administrar el estado de las cajas registradoras',
    'Manage Customer Status': 'Administrar el estado de los clientes',
    'Can manage customer status': 'Puede administrar el estado de los clientes',
    'Manage Vendor Status': 'Administrar el estado de los proveedores',
    'Can manage vendor status': 'Puede administrar el estado de los proveedores',
    'Manage Brand Status': 'Administrar el estado de las marcas',
    'Can manage brand status': 'Puede administrar el estado de las marcas',
    'Manage Category Status': 'Administrar el estado de las categorías',
    'Can manage category status': 'Puede administrar el estado de las categorías',
    'Manage Tax Status': 'Administrar el estado de los impuestos',
    'Can manage tax status': 'Puede administrar el estado de los impuestos',
    'Manage Unit Status': 'Administrar el estado de las unidades',
    'Can manage unit status': 'Puede administrar el estado de las unidades',
    'Manage Product Status': 'Administrar el estado de los productos',
    'Can manage product status': 'Puede administrar el estado de los productos',
    'Manage Expense Category Status': 'Administrar el estado de las categorías de gastos',
    'Can manage expense category status': 'Puede administrar el estado de las categorías de gastos',
    'Manage Purchase Status': 'Administrar el estado de las compras',
    'Can manage purchase status': 'Puede administrar el estado de las compras',
    'Manage POS Sessions': 'Administrar las sesiones del punto de venta',
    'Can manage POS sessions': 'Puede administrar las sesiones del punto de venta',
    'Manage Notification Template Settings': 'Administrar la configuración de las plantillas de notificación',
    'Can manage notification template settings': 'Puede administrar la configuración de las plantillas de notificación',
    'Manage Branch Sales Targets': 'Administrar los objetivos de ventas por sucursal',
    'Can manage branch sales targets': 'Puede administrar los objetivos de ventas por sucursal',
};

function translatePermissionText(text: string, module: string, isSpanish: boolean): string {
    if (!isSpanish) return text;
    if (spanishPermissionSubjects[text]) return spanishPermissionSubjects[text];

    const action = Object.keys(spanishPermissionActions).find((prefix) => text.toLowerCase().startsWith(prefix.toLowerCase()));
    const subject = spanishModuleLabels[module] ?? module;
    if (text.startsWith('Can ')) {
        const descriptionAction = text.slice(4).replace(/^./, (character) => character.toUpperCase());
        const translatedLabel = translatePermissionText(descriptionAction, module, true);
        return `Puede ${translatedLabel.charAt(0).toLowerCase()}${translatedLabel.slice(1)}`;
    }

    if (action) {
        const prefix = spanishPermissionActions[action];
        if (text.endsWith(' Status')) return `${prefix}el estado de ${subject.toLowerCase()}`;
        if (text.endsWith(' Settings')) return `${prefix}la configuración de ${subject.toLowerCase()}`;
        return `${prefix}${subject.toLowerCase()}`;
    }

    return text;
}

export default function CommerceTypesIndex({ commerceTypes, permissionGroups }: Props) {
    const { t, i18n } = useTranslation();
    const isSpanish = i18n.resolvedLanguage?.startsWith('es') ?? false;
    const { flash } = usePage().props as any;
    const [editingType, setEditingType] = useState<CommerceType | null>(null);
    const { data, setData, post, put, processing, errors, reset } = useForm<{
        name: string;
        description: string;
        permissions: number[];
    }>({
        name: '',
        description: '',
        permissions: [],
    });
    const permissionErrors = [...new Set(
        Object.entries(errors)
            .filter(([field]) => field === 'permissions' || field.startsWith('permissions.'))
            .map(([, message]) => message)
    )];

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const startEditing = (commerceType: CommerceType) => {
        setEditingType(commerceType);
        setData({
            name: commerceType.name,
            description: commerceType.description || '',
            permissions: commerceType.permissions,
        });
    };

    const startCreating = () => {
        setEditingType(null);
        reset();
    };

    const togglePermission = (permissionId: number, checked: boolean) => {
        setData('permissions', checked ? [...data.permissions, permissionId] : data.permissions.filter((id) => id !== permissionId));
    };

    const toggleGroup = (group: PermissionGroup, checked: boolean) => {
        const groupIds = group.permissions.map((permission) => permission.id);
        const permissions = checked ? [...new Set([...data.permissions, ...groupIds])] : data.permissions.filter((id) => !groupIds.includes(id));
        setData('permissions', permissions);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setEditingType(null);
                reset();
            },
        };

        if (editingType) {
            put(route('superadmin.commerce-types.update', editingType.id), options);
        } else {
            post(route('superadmin.commerce-types.store'), options);
        }
    };

    const deleteType = (commerceType: CommerceType) => {
        if (commerceType.plan_count > 0) return;
        if (window.confirm(t('Delete this commerce type?'))) {
            router.delete(route('superadmin.commerce-types.destroy', commerceType.id), {
                preserveScroll: true,
            });
        }
    };

    const breadcrumbs = [{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Commerce types') }];

    return (
        <PageTemplate
            title={t('Commerce types')}
            description={t('Control which modules and menu options are available to each commerce type.')}
            url={route('superadmin.commerce-types.index')}
            breadcrumbs={breadcrumbs}
            actions={[{ label: t('New commerce type'), onClick: startCreating }]}
        >
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold">{t('Configured commerce types')}</h2>
                    {commerceTypes.map((commerceType) => (
                        <article key={commerceType.id} className="rounded-lg border bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="font-semibold">{commerceType.name}</h3>
                                    {commerceType.description && <p className="text-muted-foreground mt-1 text-sm">{commerceType.description}</p>}
                                    <p className="text-muted-foreground mt-2 text-xs">
                                        {t('{{count}} plans assigned', { count: commerceType.plan_count })} ·{' '}
                                        {t('{{count}} enabled options', { count: commerceType.permissions.length })}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => startEditing(commerceType)}>
                                        {t('Edit')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        disabled={commerceType.plan_count > 0 || commerceTypes.length <= 1}
                                        onClick={() => deleteType(commerceType)}
                                    >
                                        {t('Delete')}
                                    </Button>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>

                <form onSubmit={submit} className="space-y-5 rounded-lg border bg-white p-5 shadow-sm">
                    <div>
                        <h2 className="text-lg font-semibold">{editingType ? t('Edit commerce type') : t('New commerce type')}</h2>
                        <p className="text-muted-foreground mt-1 text-sm">{t('Select the options that plans of this type can provide.')}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="commerce-type-name">{t('Name')}</Label>
                        <Input
                            id="commerce-type-name"
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            required
                            maxLength={100}
                        />
                        {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="commerce-type-description">{t('Description')}</Label>
                        <Textarea
                            id="commerce-type-description"
                            value={data.description}
                            onChange={(event) => setData('description', event.target.value)}
                            maxLength={1000}
                            rows={2}
                        />
                        {errors.description && <p className="text-destructive text-sm">{errors.description}</p>}
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-medium">{t('Allowed modules and menu options')}</h3>
                        {permissionGroups.map((group) => {
                            const allSelected = group.permissions.every((permission) => data.permissions.includes(permission.id));
                            return (
                                <fieldset key={group.module} className="rounded-md border p-4">
                                    <legend className="px-1 font-medium">
                                        {isSpanish ? (spanishModuleLabels[group.module] ?? t(group.label)) : t(group.label)}
                                    </legend>
                                    <label className="mb-3 flex items-center gap-2 text-sm font-medium">
                                        <input type="checkbox" checked={allSelected} onChange={(event) => toggleGroup(group, event.target.checked)} />
                                        {t('Select all')}
                                    </label>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {group.permissions.map((permission) => (
                                            <label key={permission.id} className="flex items-start gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={data.permissions.includes(permission.id)}
                                                    onChange={(event) => togglePermission(permission.id, event.target.checked)}
                                                    className="mt-1"
                                                />
                                                <span>
                                                    <span className="block font-medium">
                                                        {settingsPermissionLabels[permission.name]
                                                            ? t(settingsPermissionLabels[permission.name])
                                                            : translatePermissionText(permission.label, group.module, isSpanish)}
                                                    </span>
                                                    {permission.description && (
                                                        <span className="text-muted-foreground text-xs">
                                                            {translatePermissionText(permission.description, group.module, isSpanish)}
                                                        </span>
                                                    )}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                            );
                        })}
                        {permissionErrors.map((message, index) => (
                            <p key={index} className="text-destructive text-sm">{message}</p>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2">
                        {editingType && (
                            <Button type="button" variant="outline" onClick={startCreating}>
                                {t('Cancel')}
                            </Button>
                        )}
                        <Button type="submit" disabled={processing}>
                            {processing ? t('Saving...') : t('Save')}
                        </Button>
                    </div>
                </form>
            </div>
        </PageTemplate>
    );
}
