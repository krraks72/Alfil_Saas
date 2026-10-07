<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Categories table
        if (Schema::hasTable('categories') && Schema::hasColumn('categories', 'slug') && Schema::hasColumn('categories', 'created_by')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropUnique(['slug']);
                $table->unique(['slug', 'created_by']);
            });
        }

        // Brands table
        if (Schema::hasTable('brands') && Schema::hasColumn('brands', 'slug') && Schema::hasColumn('brands', 'created_by')) {
            Schema::table('brands', function (Blueprint $table) {
                $table->dropUnique(['slug']);
                $table->unique(['slug', 'created_by']);
            });
        }

        // Expense categories table
        if (Schema::hasTable('expense_categories') && Schema::hasColumn('expense_categories', 'slug') && Schema::hasColumn('expense_categories', 'created_by')) {
            Schema::table('expense_categories', function (Blueprint $table) {
                $table->dropUnique(['slug']);
                $table->unique(['slug', 'created_by']);
            });
        }
    }

    public function down(): void
    {
        // Categories table
        if (Schema::hasTable('categories') && Schema::hasColumn('categories', 'slug') && Schema::hasColumn('categories', 'created_by')) {
            Schema::table('categories', function (Blueprint $table) {
                try {
                    $table->dropUnique(['slug', 'created_by']);
                } catch (\Exception $e) {
                    // Index might not exist
                }
                $table->unique('slug');
            });
        }

        // Brands table
        if (Schema::hasTable('brands') && Schema::hasColumn('brands', 'slug') && Schema::hasColumn('brands', 'created_by')) {
            Schema::table('brands', function (Blueprint $table) {
                try {
                    $table->dropUnique(['slug', 'created_by']);
                } catch (\Exception $e) {
                    // Index might not exist
                }
                $table->unique('slug');
            });
        }

        // Expense categories table
        if (Schema::hasTable('expense_categories') && Schema::hasColumn('expense_categories', 'slug') && Schema::hasColumn('expense_categories', 'created_by')) {
            Schema::table('expense_categories', function (Blueprint $table) {
                try {
                    $table->dropUnique(['slug', 'created_by']);
                } catch (\Exception $e) {
                    // Index might not exist
                }
                $table->unique('slug');
            });
        }
    }
};
