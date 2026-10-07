<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class QuotationPermissionSeeder extends Seeder
{
    public function run()
    {
        $permissions = [
            'view-quotations',
            'create-quotations',
            'edit-quotations',
            'delete-quotations',
            'approve-quotations',
            'reject-quotations',
            'convert-quotations',
            'send-quotations',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Assign permissions to Admin role
        $adminRole = Role::where('name', 'Admin')->first();
        if ($adminRole) {
            $adminRole->givePermissionTo($permissions);
        }

        // Assign basic permissions to Manager role
        $managerRole = Role::where('name', 'Manager')->first();
        if ($managerRole) {
            $managerRole->givePermissionTo([
                'view-quotations',
                'create-quotations',
                'edit-quotations',
                'approve-quotations',
                'convert-quotations',
                'send-quotations',
            ]);
        }

        // Assign basic permissions to Staff role
        $staffRole = Role::where('name', 'Staff')->first();
        if ($staffRole) {
            $staffRole->givePermissionTo([
                'view-quotations',
                'create-quotations',
                'edit-quotations',
            ]);
        }
    }
}