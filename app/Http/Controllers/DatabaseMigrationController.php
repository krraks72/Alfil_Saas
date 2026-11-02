<?php

namespace App\Http\Controllers;

use Illuminate\Database\Migrations\Migrator;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Throwable;

class DatabaseMigrationController extends Controller
{
    public function __construct(
        private readonly Migrator $migrator,
    ) {
    }

    public function index()
    {
        return Inertia::render('superadmin/database-updates', $this->migrationStatus());
    }

    public function run()
    {
        $pendingBefore = $this->migrationStatus()['pendingMigrations'];

        if ($pendingBefore === []) {
            return redirect()
                ->route('superadmin.database-updates.index')
                ->with('info', __('There are no pending database migrations.'));
        }

        try {
            $exitCode = Artisan::call('migrate', ['--force' => true]);
        } catch (Throwable $exception) {
            Log::error('Superadmin database migration command threw an exception.', [
                'user_id' => auth()->id(),
                'exception' => $exception,
            ]);

            return redirect()
                ->route('superadmin.database-updates.index')
                ->with('error', __('Database migration failed. Check the application logs for details.'));
        }

        if ($exitCode !== 0) {
            Log::error('Superadmin database migration command failed.', [
                'user_id' => auth()->id(),
                'exit_code' => $exitCode,
            ]);

            return redirect()
                ->route('superadmin.database-updates.index')
                ->with('error', __('Database migration failed. Check the application logs for details.'));
        }

        $pendingAfter = $this->migrationStatus()['pendingMigrations'];

        if ($pendingAfter !== []) {
            Log::warning('Superadmin database migration command completed with migrations still pending.', [
                'user_id' => auth()->id(),
                'pending_migrations' => $pendingAfter,
            ]);

            return redirect()
                ->route('superadmin.database-updates.index')
                ->with('error', __('Some database migrations are still pending. Review the migration output and try again.'));
        }

        Log::info('Superadmin ran pending database migrations.', [
            'user_id' => auth()->id(),
            'migrations' => $pendingBefore,
        ]);

        return redirect()
            ->route('superadmin.database-updates.index')
            ->with('success', trans_choice(
                'Successfully ran :count database migration.|Successfully ran :count database migrations.',
                count($pendingBefore),
                ['count' => count($pendingBefore)],
            ));
    }

    private function migrationStatus(): array
    {
        $paths = array_merge($this->migrator->paths(), [database_path('migrations')]);
        $migrationNames = array_keys($this->migrator->getMigrationFiles($paths));
        $executedMigrations = $this->migrator->repositoryExists()
            ? $this->migrator->getRepository()->getRan()
            : [];
        $pendingMigrations = array_values(array_diff($migrationNames, $executedMigrations));

        return [
            'pendingMigrations' => $pendingMigrations,
            'executedMigrationCount' => count(array_intersect($migrationNames, $executedMigrations)),
        ];
    }
}
