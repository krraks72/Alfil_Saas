<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\User;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        if (!IsDemo()) {
            $companies = User::where('type', 'company')->get();
            foreach ($companies as $company) {
                Branch::firstOrCreate(
                    ['created_by' => $company->id, 'name' => 'Main Branch'],
                    ['address' => '123 Main Street', 'phone' => '+1234567890', 'email' => 'main@company.com', 'status' => 'active']
                );
            }
        } else {
            $company = User::where('email', 'company@example.com')->first();
            $manager = User::where('email', 'manager@example.com')->first();
            $staff = User::where('email', 'staff@example.com')->first();

            if ($company) {
                $branches = [
                    [
                        'name'    => 'Main Branch',
                        'address' => '123 Main Street, City Center',
                        'phone'   => '+1234567890',
                        'email'   => 'main@company.com',
                        'status'  => 'active',
                    ],
                    [
                        'name'    => 'Downtown Branch',
                        'address' => '456 Downtown Ave, Business District',
                        'phone'   => '+1234567891',
                        'email'   => 'downtown@company.com',
                        'status'  => 'active',
                    ],
                    [
                        'name'    => 'North Side Branch',
                        'address' => '789 North Blvd, North District',
                        'phone'   => '+1234567892',
                        'email'   => 'northside@company.com',
                        'status'  => 'active',
                    ],
                    [
                        'name'    => 'South Plaza Branch',
                        'address' => '321 South Plaza, South End',
                        'phone'   => '+1234567893',
                        'email'   => 'southplaza@company.com',
                        'status'  => 'active',
                    ],
                    [
                        'name'    => 'East Gate Branch',
                        'address' => '654 East Gate Road, East Side',
                        'phone'   => '+1234567894',
                        'email'   => 'eastgate@company.com',
                        'status'  => 'active',
                    ],
                    [
                        'name'    => 'West End Branch',
                        'address' => '987 West End Street, West Zone',
                        'phone'   => '+1234567895',
                        'email'   => 'westend@company.com',
                        'status'  => 'active',
                    ],
                    [
                        'name'    => 'Airport Branch',
                        'address' => '101 Airport Road, Terminal 2',
                        'phone'   => '+1234567896',
                        'email'   => 'airport@company.com',
                        'status'  => 'active',
                    ],
                    [
                        'name'    => 'Mall Branch',
                        'address' => '202 Shopping Mall, Level 3',
                        'phone'   => '+1234567897',
                        'email'   => 'mall@company.com',
                        'status'  => 'active',
                    ],
                    [
                        'name'    => 'Industrial Branch',
                        'address' => '303 Industrial Zone, Sector 5',
                        'phone'   => '+1234567898',
                        'email'   => 'industrial@company.com',
                        'status'  => 'inactive',
                    ],
                    [
                        'name'    => 'Suburb Branch',
                        'address' => '404 Suburb Lane, Residential Area',
                        'phone'   => '+1234567899',
                        'email'   => 'suburb@company.com',
                        'status'  => 'inactive',
                    ],
                ];

                $mainBranch = null;
                foreach ($branches as $branchData) {
                    $branch = Branch::create(array_merge($branchData, [
                        'created_by' => $company->id,
                        'manager_id' => $manager ? $manager->id : null,
                    ]));
                    if ($branchData['name'] === 'Main Branch') {
                        $mainBranch = $branch;
                    }
                }

                if ($staff && $mainBranch) {
                    $staff->update(['branch_id' => $mainBranch->id]);
                }
            }
        }
    }
}