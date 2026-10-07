<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if(!Schema::hasTable('cash_registers')) {
            Schema::create('cash_registers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->string('name');
            $table->string('register_code')->unique();
            $table->text('description')->nullable();
            $table->decimal('opening_balance', 10, 2)->default(0);
            $table->decimal('current_balance', 10, 2)->default(0);
            $table->enum('status', ['active', 'inactive', 'maintenance'])->default('active');
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->index(['created_by', 'branch_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_registers');
    }
};