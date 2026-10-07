<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class NotificationTemplatePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'view-notification-templates',
            'edit-notification-templates',
            'manage-notification-template-settings',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Assign permissions to roles
        $superAdminRole = Role::where('name', 'superadmin')->first();
        $companyAdminRole = Role::where('name', 'company')->first();

        if ($superAdminRole) {
            $superAdminRole->givePermissionTo($permissions);
        }

        if ($companyAdminRole) {
            $companyAdminRole->givePermissionTo($permissions);
        }
    }
}