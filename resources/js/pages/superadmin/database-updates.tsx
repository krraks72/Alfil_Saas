import { useEffect } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Database, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DatabaseUpdatesProps {
    pendingMigrations: string[];
    executedMigrationCount: number;
}

interface PageProps extends Record<string, unknown> {
    flash?: {
        success?: string;
        error?: string;
        info?: string;
    };
}

export default function DatabaseUpdates({ pendingMigrations, executedMigrationCount }: DatabaseUpdatesProps) {
    const { t } = useTranslation();
    const { post, processing } = useForm({});
    const { flash } = usePage<PageProps>().props;

    useEffect(() => {
        if (flash?.success) toast.success(t(flash.success));
        if (flash?.error) toast.error(t(flash.error));
        if (flash?.info) toast.info(t(flash.info));
    }, [flash, t]);

    const runPendingMigrations = () => {
        if (pendingMigrations.length === 0 || processing) return;

        const confirmed = window.confirm(t(
            'This will change the database schema. Make a database backup before continuing. Run the pending migrations now?'
        ));

        if (confirmed) {
            post(route('superadmin.database-updates.run'));
        }
    };

    return (
        <PageTemplate
            title={t('Database Updates')}
            description={t('Review and run pending database migrations separately from the initial installation.')}
            url={route('superadmin.database-updates.index')}
            actions={[
                {
                    label: t('Refresh status'),
                    icon: <RefreshCw className="h-4 w-4" />,
                    onClick: () => router.reload(),
                    disabled: processing,
                },
            ]}
        >
            <div className="space-y-6">
                <Alert>
                    <AlertTriangle />
                    <AlertTitle>{t('Back up the database first')}</AlertTitle>
                    <AlertDescription>
                        {t('Running migrations can change your database structure. This action only runs migrations that Laravel reports as pending and does not run the initial installer.')}
                    </AlertDescription>
                </Alert>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardDescription>{t('Pending migrations')}</CardDescription>
                            <CardTitle className="text-2xl">{pendingMigrations.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardDescription>{t('Previously executed migrations')}</CardDescription>
                            <CardTitle className="text-2xl">{executedMigrationCount}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('Migration status')}</CardTitle>
                        <CardDescription>
                            {pendingMigrations.length > 0
                                ? t('These migration files are not recorded as executed in the database.')
                                : t('The database is up to date; no pending migrations were found.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pendingMigrations.length > 0 ? (
                            <>
                                <ol className="max-h-96 list-decimal space-y-2 overflow-y-auto rounded-md border p-4 pl-9">
                                    {pendingMigrations.map((migration) => (
                                        <li key={migration} className="break-all font-mono text-sm">
                                            {migration}
                                        </li>
                                    ))}
                                </ol>
                                <Button
                                    variant="destructive"
                                    onClick={runPendingMigrations}
                                    disabled={processing}
                                >
                                    <Database className="h-4 w-4" />
                                    {processing ? t('Running migrations...') : t('Run pending migrations')}
                                </Button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                {t('Nothing to update.')}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageTemplate>
    );
}
