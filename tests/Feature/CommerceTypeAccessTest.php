<?php

use App\Http\Middleware\CheckInstallation;
use App\Http\Middleware\CheckPlanAccess;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\CommerceType;
use App\Models\Plan;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RoleSeeder;
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
    app(RoleSeeder::class)->run();
    $permission = Permission::findByName('view-processed-products', 'web');
    $this->company->assignRole('company');

    $this->actingAs($this->company)
        ->get(route('processed-products.index'))
        ->assertForbidden();

    $this->commerceType->permissions()->sync([$permission->id]);

    $this->actingAs($this->company)
        ->get(route('processed-products.index'))
        ->assertOk();
});

test('company role settings permissions require the matching commerce type option', function () {
    $this->withoutMiddleware([CheckInstallation::class, CheckPlanAccess::class, HandleInertiaRequests::class]);
    app(PermissionSeeder::class)->run();
    app(RoleSeeder::class)->run();
    $this->company->assignRole('company');
    $permission = Permission::findByName('manage-system-settings', 'web');

    expect($this->company->hasPermissionTo($permission))->toBeFalse();

    $this->commerceType->permissions()->sync([$permission->id]);

    expect($this->company->fresh()->hasPermissionTo($permission))->toBeTrue();

    $this->actingAs($this->company)
        ->withHeader('X-Inertia', 'true')
        ->get(route('settings'))
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
                        && collect([
                            'manage-system-settings' => 'System Settings',
                            'manage-email-settings' => 'Email Settings',
                            'manage-email-notification-settings' => 'Email Notification Settings',
                            'manage-brand-settings' => 'Brand Settings',
                            'manage-company-settings' => 'Company Settings',
                            'manage-payment-settings' => 'Payment Settings',
                            'manage-currency-settings' => 'Currency Settings',
                            'manage-slack-settings' => 'Slack Settings',
                            'manage-twilio-settings' => 'Twilio SMS Settings',
                            'manage-webhook-settings' => 'Webhook Settings',
                            'manage-google-calendar-settings' => 'Google Calendar Settings',
                            'manage-quotation-invoice-settings' => 'Quotation Settings',
                            'manage-aliaddo-settings' => 'Electronic Invoicing (Aliaddo)',
                        ])->every(
                            fn ($label, $permissionName) => collect($group['permissions'])
                                ->contains(fn ($permission) => $permission['name'] === $permissionName && $permission['label'] === $label)
                        )
                );
            }));
});

test('superadmins can configure commerce type permissions', function () {
    app(PermissionSeeder::class)->run();
    $superadmin = User::factory()->create(['type' => 'superadmin']);
    $permission = Permission::findByName('view-appointments', 'web');
    $settingsPermission = Permission::findByName('manage-system-settings', 'web');

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

    $superAdminOnlyPermission = Permission::findByName('manage-storage-settings', 'web');
    $this->put(route('superadmin.commerce-types.update', $commerceType), [
        'name' => 'Restaurant',
        'description' => 'Updated restaurant',
        'permissions' => [$superAdminOnlyPermission->id],
    ])->assertSessionHasErrors('permissions.0');

    $this->put(route('superadmin.commerce-types.update', $commerceType), [
        'name' => 'Restaurant',
        'description' => 'Updated restaurant',
        'permissions' => [],
    ])->assertRedirect(route('superadmin.commerce-types.index'));

    expect($commerceType->fresh()->permissions()->exists())->toBeFalse();
});

test('existing commerce types can be edited while retaining legacy assigned permissions', function () {
    app(PermissionSeeder::class)->run();
    $superadmin = User::factory()->create(['type' => 'superadmin']);
    $legacyPermission = Permission::findByName('manage-settings', 'web');
    $sectionPermission = Permission::findByName('manage-slack-settings', 'web');
    $this->commerceType->permissions()->sync([$legacyPermission->id]);

    $this->actingAs($superadmin)
        ->put(route('superadmin.commerce-types.update', $this->commerceType), [
            'name' => $this->commerceType->name,
            'description' => 'Updated description',
            'permissions' => [$legacyPermission->id, $sectionPermission->id],
        ])
        ->assertRedirect(route('superadmin.commerce-types.index'));

    expect($this->commerceType->fresh()->permissions()->pluck('permissions.id')->all())
        ->toContain($legacyPermission->id, $sectionPermission->id);
});

test('each company settings endpoint requires its own commerce type permission', function (
    string $permissionName,
    string $method,
    string $routeName
) {
    $this->withoutMiddleware([CheckInstallation::class, CheckPlanAccess::class, HandleInertiaRequests::class]);
    app(PermissionSeeder::class)->run();
    $permission = Permission::findByName($permissionName, 'web');
    $this->company->givePermissionTo($permission);

    $this->actingAs($this->company)
        ->call($method, route($routeName))
        ->assertForbidden();

    $this->commerceType->permissions()->sync([$permission->id]);

    expect($this->actingAs($this->company)->call($method, route($routeName))->status())
        ->not->toBe(403);
})->with([
    ['manage-system-settings', 'POST', 'settings.system.update'],
    ['manage-brand-settings', 'POST', 'settings.brand.update'],
    ['manage-currency-settings', 'POST', 'settings.currency.update'],
    ['manage-email-settings', 'GET', 'settings.email.get'],
    ['manage-email-notification-settings', 'POST', 'settings.email-notifications.update'],
    ['manage-company-settings', 'POST', 'settings.company.update'],
    ['manage-payment-settings', 'POST', 'payment.settings'],
    ['manage-slack-settings', 'GET', 'settings.slack-config.get'],
    ['manage-twilio-settings', 'GET', 'settings.twilio-notifications.get'],
    ['manage-webhook-settings', 'GET', 'settings.webhooks.index'],
    ['manage-google-calendar-settings', 'POST', 'settings.google-calendar.update'],
    ['manage-quotation-invoice-settings', 'POST', 'settings.quotation-invoice.store'],
    ['manage-aliaddo-settings', 'POST', 'settings.aliaddo.store'],
]);

test('legacy settings permission opens the page without granting access to individual sections', function () {
    $this->withoutMiddleware([CheckInstallation::class, CheckPlanAccess::class, HandleInertiaRequests::class]);
    app(PermissionSeeder::class)->run();
    $this->actingAs($this->company)
        ->get(route('settings'))
        ->assertForbidden();

    $genericPermission = Permission::findByName('manage-settings', 'web');
    $this->company->givePermissionTo($genericPermission);
    $this->commerceType->permissions()->sync([$genericPermission->id]);

    $this->actingAs($this->company)
        ->withHeader('X-Inertia', 'true')
        ->get(route('settings'))
        ->assertOk()
        ->assertJsonPath('props.systemSettings', []);

    $permission = Permission::findByName('manage-slack-settings', 'web');
    $this->company->givePermissionTo($permission);
    $this->commerceType->permissions()->sync([$permission->id]);

    $this->actingAs($this->company)
        ->get(route('settings'))
        ->assertOk();
});

test('company settings page only shares values from permitted sections', function () {
    $this->withoutMiddleware([CheckInstallation::class, CheckPlanAccess::class, HandleInertiaRequests::class]);
    app(PermissionSeeder::class)->run();
    $permission = Permission::findByName('manage-slack-settings', 'web');
    $this->company->givePermissionTo($permission);
    $this->commerceType->permissions()->sync([$permission->id]);

    Setting::updateOrCreate(
        ['user_id' => $this->company->id, 'key' => 'slack_enabled'],
        ['value' => '1']
    );
    Setting::updateOrCreate(
        ['user_id' => $this->company->id, 'key' => 'twilio_auth_token'],
        ['value' => 'private-token']
    );

    $this->actingAs($this->company)
        ->withHeader('X-Inertia', 'true')
        ->get(route('settings'))
        ->assertOk()
        ->assertJsonPath('props.systemSettings', ['slack_enabled' => '1']);
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
