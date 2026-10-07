<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branch_sales_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->string('month', 7); // Format: YYYY-MM
            $table->decimal('target_amount', 15, 2);
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['branch_id', 'month']);
            $table->index(['month', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_sales_targets');
    }
};
