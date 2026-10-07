<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class NotificationPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'view-notifications',
            'create-notifications',
            'edit-notifications',
            'delete-notifications',
            'manage-notification-status',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Assign permissions to roles
        $superAdminRole = Role::where('name', 'superadmin')->first();
        $companyAdminRole = Role::where('name', 'company_admin')->first();

        if ($superAdminRole) {
            $superAdminRole->givePermissionTo($permissions);
        }

        if ($companyAdminRole) {
            $companyAdminRole->givePermissionTo($permissions);
        }
    }
}