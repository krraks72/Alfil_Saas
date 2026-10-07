<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if(!Schema::hasTable('pos_sessions')) {
            Schema::create('pos_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_number')->unique();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('cash_register_id')->constrained('cash_registers')->onDelete('cascade');
            $table->decimal('opening_balance', 10, 2);
            $table->decimal('closing_balance', 10, 2)->nullable();
            $table->decimal('expected_balance', 10, 2)->nullable();
            $table->decimal('difference', 10, 2)->nullable();
            $table->integer('total_sales')->default(0);
            $table->decimal('total_sales_amount', 10, 2)->default(0);
            $table->enum('status', ['active', 'closed'])->default('active');
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['cash_register_id', 'status']);
            $table->index(['opened_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_sessions');
    }
};