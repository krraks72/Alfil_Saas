<?php

use App\Models\User;
use Illuminate\Database\Migrations\MigrationRepositoryInterface;
use Illuminate\Database\Migrations\Migrator;
use Illuminate\Support\Facades\Artisan;
use Inertia\Testing\AssertableInertia as Assert;

test('only superadmins can access the database migration page', function () {
    $this->get(route('superadmin.database-updates.index'))
        ->assertRedirect(route('login'));

    $this->actingAs(User::factory()->create(['type' => 'company']))
        ->get(route('superadmin.database-updates.index'))
        ->assertRedirect()
        ->assertSessionHas('error', 'Unauthorized access');

    $this->actingAs(User::factory()->create(['type' => 'company']))
        ->post(route('superadmin.database-updates.run'))
        ->assertRedirect()
        ->assertSessionHas('error', 'Unauthorized access');

    $this->actingAs(User::factory()->create(['type' => 'superadmin']))
        ->get(route('superadmin.database-updates.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('superadmin/database-updates')
            ->has('pendingMigrations')
            ->has('executedMigrationCount'));
});

test('superadmin run endpoint applies pending migrations and refreshes the status', function () {
    $migrator = Mockery::mock(Migrator::class);
    $migrator->shouldReceive('paths')->twice()->andReturn([]);
    $migrator->shouldReceive('getMigrationFiles')
        ->twice()
        ->with([database_path('migrations')])
        ->andReturn(['2026_01_01_000000_add_example_column' => database_path('migrations/2026_01_01_000000_add_example_column.php')]);

    $repository = Mockery::mock(MigrationRepositoryInterface::class);
    $repository->shouldReceive('getRan')
        ->twice()
        ->andReturn([], ['2026_01_01_000000_add_example_column']);
    $migrator->shouldReceive('repositoryExists')->twice()->andReturn(true);
    $migrator->shouldReceive('getRepository')->twice()->andReturn($repository);
    app()->instance(Migrator::class, $migrator);

    Artisan::shouldReceive('call')
        ->once()
        ->with('migrate', ['--force' => true])
        ->andReturn(0);

    $this->actingAs(User::factory()->create(['type' => 'superadmin']))
        ->post(route('superadmin.database-updates.run'))
        ->assertRedirect(route('superadmin.database-updates.index'))
        ->assertSessionHas('success');
});

test('superadmin cannot rerun migrations when none are pending', function () {
    $migration = '2026_01_01_000000_add_example_column';
    $migrator = Mockery::mock(Migrator::class);
    $migrator->shouldReceive('paths')->once()->andReturn([]);
    $migrator->shouldReceive('getMigrationFiles')
        ->once()
        ->with([database_path('migrations')])
        ->andReturn([$migration => database_path("migrations/{$migration}.php")]);
    $migrator->shouldReceive('repositoryExists')->once()->andReturn(true);

    $repository = Mockery::mock(MigrationRepositoryInterface::class);
    $repository->shouldReceive('getRan')->once()->andReturn([$migration]);
    $migrator->shouldReceive('getRepository')->once()->andReturn($repository);
    app()->instance(Migrator::class, $migrator);

    Artisan::shouldReceive('call')->never();

    $this->actingAs(User::factory()->create(['type' => 'superadmin']))
        ->post(route('superadmin.database-updates.run'))
        ->assertRedirect(route('superadmin.database-updates.index'))
        ->assertSessionHas('info', 'There are no pending database migrations.');
});
