<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('cash_registers')  && Schema::hasColumn('cash_registers', 'settings')) {
            Schema::table('cash_registers', function (Blueprint $table) {
                $table->dropColumn('settings');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('cash_registers', 'settings')) {
            Schema::table('cash_registers', function (Blueprint $table) {
                $table->json('settings')->nullable()->after('status');
            });
        }
    }
};
