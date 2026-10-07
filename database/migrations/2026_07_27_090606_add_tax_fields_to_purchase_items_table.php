<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('purchase_items') && !Schema::hasColumn('purchase_items', 'tax_amount')) {
            Schema::table('purchase_items', function (Blueprint $table) {
                $table->decimal('tax_amount', 10, 2)->default(0)->after('total_price');
                $table->json('taxes')->nullable()->after('tax_amount');
            });
        }

        if (Schema::hasTable('sales') && Schema::hasColumn('sales', 'customer_id')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->foreignId('customer_id')->nullable()->change();
            });
        }

        if (Schema::hasTable('sale_returns') && Schema::hasColumn('sale_returns', 'customer_id')) {
            Schema::table('sale_returns', function (Blueprint $table) {
                $table->foreignId('customer_id')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('purchase_items') && Schema::hasColumn('purchase_items', 'tax_amount')) {
            Schema::table('purchase_items', function (Blueprint $table) {
                $table->dropColumn(['tax_amount', 'taxes']);
            });
        }

        if (Schema::hasTable('sales') && Schema::hasColumn('sales', 'customer_id')) {
            Schema::table('sales', function (Blueprint $table) {
                $table->foreignId('customer_id')->nullable(false)->change();
            });
        }

        if (Schema::hasTable('sale_returns') && Schema::hasColumn('sale_returns', 'customer_id')) {
            Schema::table('sale_returns', function (Blueprint $table) {
                $table->foreignId('customer_id')->nullable(false)->change();
            });
        }
    }
};
