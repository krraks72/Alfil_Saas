<?php

use App\Http\Middleware\CheckInstallation;
use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\CommerceType;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\PlanSeeder;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->commerceType = CommerceType::create([
        'name' => 'Access Test Commerce',
        'permissions_initialized' => true,
    ]);
    $this->company = User::factory()->create(['type' => 'company']);
    $plan = Plan::create([
        'name' => 'Access Test Plan',
        'price' => 0,
        'duration' => 'monthly',
        'total_customers' => 0,
        'total_vendors' => 0,
        'max_users' => 5,
        'storage_limit' => 5,
        'is_plan_enable' => 'on',
        'is_default' => false,
        'commerce_type_id' => $this->commerceType->id,
    ]);
    $this->company->update([
        'plan_id' => $plan->id,
        'plan_is_active' => 1,
        'plan_expire_date' => now()->addMonth(),
    ]);
});

test('effective permissions are the intersection of role permissions and the plan commerce type', function () {
    $permission = Permission::findByName('view-appointments', 'web');
    $this->commerceType->permissions()->sync([$permission->id]);
    $this->company->givePermissionTo($permission);

    expect($this->company->hasPermissionTo('view-appointments'))->toBeTrue()
        ->and($this->company->getAccessiblePermissions()->pluck('name')->all())->toContain('view-appointments');

    $this->commerceType->permissions()->detach($permission);

    expect($this->company->hasPermissionTo('view-appointments'))->toBeFalse()
        ->and($this->company->getAccessiblePermissions()->pluck('name')->all())->not->toContain('view-appointments');
});

test('staff users inherit commerce type restrictions from their company', function () {
    $permission = Permission::findByName('view-appointments', 'web');
    $this->commerceType->permissions()->sync([$permission->id]);
    $staff = User::factory()->create([
        'type' => 'user',
        'created_by' => $this->company->id,
    ]);
    $staff->givePermissionTo($permission);

    expect($staff->getCommerceType()->is($this->commerceType))->toBeTrue()
        ->and($staff->hasPermissionTo('view-appointments'))->toBeTrue();

    $this->commerceType->permissions()->detach($permission);

    expect($staff->hasPermissionTo('view-appointments'))->toBeFalse();
});

test('calendar routes are denied when the commerce type does not allow the calendar option', function () {
    $this->withoutMiddleware(CheckInstallation::class);

    $this->actingAs($this->company)
        ->get(route('calendar.index'))
        ->assertForbidden();
});

test('processed products require their own commerce type permission', function () {
    $this->withoutMiddleware(CheckInstallation::class);
    app(PermissionSeeder::class)->run();
    $permission = Permission::findByName('view-processed-products', 'web');
    $this->company->givePermissionTo($permission);

    $this->actingAs($this->company)
        ->get(route('processed-products.index'))
        ->assertForbidden();

    $this->commerceType->permissions()->sync([$permission->id]);

    $this->actingAs($this->company)
        ->get(route('processed-products.index'))
        ->assertOk();
});

test('branch sales target access and actions use commerce type permissions', function () {
    $this->withoutMiddleware([CheckInstallation::class, CheckPlanAccess::class, HandleInertiaRequests::class]);
    app(PermissionSeeder::class)->run();
    $permissions = collect([
        'view_branch_sales_target',
        'create_branch_sales_target',
        'edit_branch_sales_target',
        'delete_branch_sales_target',
    ])->map(fn ($name) => Permission::findByName($name, 'web'));
    $this->company->givePermissionTo($permissions);

    $this->actingAs($this->company)
        ->get(route('branch-sales-targets.index'))
        ->assertForbidden();

    $this->commerceType->permissions()->sync([$permissions->first()->id]);

    $this->actingAs($this->company)
        ->withHeader('X-Inertia', 'true')
        ->get(route('branch-sales-targets.index'))
        ->assertOk()
        ->assertJsonPath('props.can.create', false)
        ->assertJsonPath('props.can.edit', false)
        ->assertJsonPath('props.can.delete', false);

    $this->post(route('branch-sales-targets.store'), [])
        ->assertForbidden();
    $this->put(route('branch-sales-targets.update', 1), [])
        ->assertForbidden();
    $this->delete(route('branch-sales-targets.destroy', 1))
        ->assertForbidden();

    $this->commerceType->permissions()->sync($permissions->pluck('id')->all());

    $this->actingAs($this->company)
        ->withHeader('X-Inertia', 'true')
        ->get(route('branch-sales-targets.index'))
        ->assertOk()
        ->assertJsonPath('props.can.create', true)
        ->assertJsonPath('props.can.edit', true)
        ->assertJsonPath('props.can.delete', true);
});

test('only superadmins can open the commerce type administration panel', function () {
    app(PermissionSeeder::class)->run();

    $this->actingAs(User::factory()->create(['type' => 'company']))
        ->get(route('superadmin.commerce-types.index'))
        ->assertRedirect();

    $this->actingAs(User::factory()->create(['type' => 'superadmin']))
        ->get(route('superadmin.commerce-types.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('commerce-types/index')
            ->where('permissionGroups', function ($groups) {
                $groups = collect($groups);

                return $groups->contains(
                    fn ($group) => $group['module'] === 'products'
                        && collect($group['permissions'])->contains(
                            fn ($permission) => $permission['name'] === 'view-processed-products'
                        )
                ) && $groups->contains(
                    fn ($group) => $group['module'] === 'settings'
                        && collect($group['permissions'])->pluck('name')->all() === ['manage-settings']
                );
            }));
});

test('superadmins can configure commerce type permissions', function () {
    app(PermissionSeeder::class)->run();
    $superadmin = User::factory()->create(['type' => 'superadmin']);
    $permission = Permission::findByName('view-appointments', 'web');
    $settingsPermission = Permission::findByName('manage-settings', 'web');

    $this->actingAs($superadmin)
        ->post(route('superadmin.commerce-types.store'), [
            'name' => 'Restaurant',
            'description' => 'Restaurant commerce',
            'permissions' => [$permission->id, $settingsPermission->id],
        ])
        ->assertRedirect(route('superadmin.commerce-types.index'));

    $commerceType = CommerceType::where('name', 'Restaurant')->firstOrFail();
    expect($commerceType->permissions()->whereKey($permission->id)->exists())->toBeTrue();
    expect($commerceType->permissions()->whereKey($settingsPermission->id)->exists())->toBeTrue();

    $systemSettingsPermission = Permission::findByName('manage-system-settings', 'web');
    $this->put(route('superadmin.commerce-types.update', $commerceType), [
        'name' => 'Restaurant',
        'description' => 'Updated restaurant',
        'permissions' => [$systemSettingsPermission->id],
    ])->assertSessionHasErrors('permissions.0');

    $this->put(route('superadmin.commerce-types.update', $commerceType), [
        'name' => 'Restaurant',
        'description' => 'Updated restaurant',
        'permissions' => [],
    ])->assertRedirect(route('superadmin.commerce-types.index'));

    expect($commerceType->fresh()->permissions()->exists())->toBeFalse();
});

test('default commerce types are initialized with company permissions during seeding', function () {
    app(PermissionSeeder::class)->run();
    app(PlanSeeder::class)->run();

    $store = CommerceType::where('name', 'Tienda')->firstOrFail();
    $posPermission = Permission::findByName('view-pos', 'web');
    $freePlan = Plan::where('name', 'Free')->firstOrFail();

    expect($store->permissions_initialized)->toBeTrue()
        ->and($store->permissions()->whereKey($posPermission->id)->exists())->toBeTrue()
        ->and($freePlan->commerce_type_id)->toBe($store->id);
});
