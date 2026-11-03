<?php

use App\Http\Middleware\CheckInstallation;
use App\Models\CommerceType;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
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

test('only superadmins can open the commerce type administration panel', function () {
    $this->actingAs(User::factory()->create(['type' => 'company']))
        ->get(route('superadmin.commerce-types.index'))
        ->assertRedirect();

    $this->actingAs(User::factory()->create(['type' => 'superadmin']))
        ->get(route('superadmin.commerce-types.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('commerce-types/index'));
});

test('default commerce types are initialized with company permissions during seeding', function () {
    app(PermissionSeeder::class)->run();

    $store = CommerceType::where('name', 'Tienda')->firstOrFail();
    $posPermission = Permission::findByName('view-pos', 'web');

    expect($store->permissions_initialized)->toBeTrue()
        ->and($store->permissions()->whereKey($posPermission->id)->exists())->toBeTrue();
});
