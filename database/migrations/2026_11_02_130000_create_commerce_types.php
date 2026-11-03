<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commerce_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->text('description')->nullable();
            $table->boolean('permissions_initialized')->default(false);
            $table->timestamps();
        });

        Schema::create('commerce_type_permissions', function (Blueprint $table) {
            $table->foreignId('commerce_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->primary(['commerce_type_id', 'permission_id']);
        });

        $now = now();
        DB::table('commerce_types')->insert([
            ['name' => 'Tienda', 'description' => 'Tipo de comercio inicial', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Gastrobar', 'description' => 'Tipo de comercio inicial', 'created_at' => $now, 'updated_at' => $now],
        ]);

        $storeId = DB::table('commerce_types')->where('name', 'Tienda')->value('id');
        $gastrobarId = DB::table('commerce_types')->where('name', 'Gastrobar')->value('id');
        $companyModules = config('role-permissions.company', []);
        $existingCompanyPermissionCount = DB::table('permissions')
            ->whereIn('module', $companyModules)
            ->count();

        DB::table('permissions')->updateOrInsert(
            ['name' => 'view-appointments', 'guard_name' => 'web'],
            [
                'module' => 'appointments',
                'label' => 'View Calendar',
                'description' => 'Can view calendar events',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $permissionIds = DB::table('permissions')
            ->whereIn('module', $companyModules)
            ->pluck('id')
            ->all();

        $rows = [];
        foreach ([$storeId, $gastrobarId] as $commerceTypeId) {
            foreach ($permissionIds as $permissionId) {
                $rows[] = [
                    'commerce_type_id' => $commerceTypeId,
                    'permission_id' => $permissionId,
                ];
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('commerce_type_permissions')->insert($chunk);
        }

        if ($existingCompanyPermissionCount > 0) {
            DB::table('commerce_types')->whereIn('id', [$storeId, $gastrobarId])
                ->update(['permissions_initialized' => true]);
        }

        Schema::table('plans', function (Blueprint $table) {
            $table->foreignId('commerce_type_id')
                ->nullable()
                ->after('id')
                ->constrained('commerce_types')
                ->restrictOnDelete();
        });

        DB::table('plans')->whereNull('commerce_type_id')->update([
            'commerce_type_id' => $storeId,
        ]);
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropConstrainedForeignId('commerce_type_id');
        });

        Schema::dropIfExists('commerce_type_permissions');
        Schema::dropIfExists('commerce_types');
    }
};
