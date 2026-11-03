import React, { useEffect, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/custom-toast';

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

export default function CommerceTypesIndex({ commerceTypes, permissionGroups }: Props) {
    const { t } = useTranslation();
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
        setData('permissions', checked
            ? [...data.permissions, permissionId]
            : data.permissions.filter((id) => id !== permissionId));
    };

    const toggleGroup = (group: PermissionGroup, checked: boolean) => {
        const groupIds = group.permissions.map((permission) => permission.id);
        const permissions = checked
            ? [...new Set([...data.permissions, ...groupIds])]
            : data.permissions.filter((id) => !groupIds.includes(id));
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

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Commerce types') },
    ];

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
                                    {commerceType.description && (
                                        <p className="mt-1 text-sm text-muted-foreground">{commerceType.description}</p>
                                    )}
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {t('{{count}} plans assigned', { count: commerceType.plan_count })} · {t('{{count}} enabled options', { count: commerceType.permissions.length })}
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
                                        disabled={commerceType.plan_count > 0}
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
                        <h2 className="text-lg font-semibold">
                            {editingType ? t('Edit commerce type') : t('New commerce type')}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t('Select the options that plans of this type can provide.')}
                        </p>
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
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
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
                        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-medium">{t('Allowed modules and menu options')}</h3>
                        {permissionGroups.map((group) => {
                            const allSelected = group.permissions.every((permission) => data.permissions.includes(permission.id));
                            return (
                                <fieldset key={group.module} className="rounded-md border p-4">
                                    <legend className="px-1 font-medium">{t(group.label)}</legend>
                                    <label className="mb-3 flex items-center gap-2 text-sm font-medium">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={(event) => toggleGroup(group, event.target.checked)}
                                        />
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
                                                    <span className="block font-medium">{t(permission.label)}</span>
                                                    {permission.description && (
                                                        <span className="text-xs text-muted-foreground">{t(permission.description)}</span>
                                                    )}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                            );
                        })}
                        {errors.permissions && <p className="text-sm text-destructive">{errors.permissions}</p>}
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
