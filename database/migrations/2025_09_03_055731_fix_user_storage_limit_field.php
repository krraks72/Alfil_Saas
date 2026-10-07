<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Reset storage_limit field to 0 for all users since it was being used incorrectly
        // The storage_limit field should represent the limit, not the usage
        DB::table('users')->update(['storage_limit' => 0]);
        
        // Add comment to clarify the field purpose
        Schema::table('users', function (Blueprint $table) {
            $table->float('storage_limit')->default(0)->comment('Storage usage in bytes (calculated dynamically)')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove comment
        Schema::table('users', function (Blueprint $table) {
            $table->float('storage_limit')->default(0)->change();
        });
    }
};