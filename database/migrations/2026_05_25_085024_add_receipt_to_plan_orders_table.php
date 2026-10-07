<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('plan_orders') && !Schema::hasColumn('plan_orders', 'receipt')) {
            Schema::table('plan_orders', function (Blueprint $table) {
                $table->string('receipt')->nullable()->after('notes');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('plan_orders', 'receipt')) {
            Schema::table('plan_orders', function (Blueprint $table) {
                $table->dropColumn('receipt');
            });
        }
    }
};
