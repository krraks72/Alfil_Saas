<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('pos_carts')) {
            Schema::create('pos_carts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pos_session_id')->constrained('pos_sessions')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
                $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('set null');
                $table->decimal('discount_amount', 10, 2)->default(0);
                $table->text('notes')->nullable();
                $table->enum('status', ['active', 'completed', 'abandoned'])->default('active');
                $table->timestamps();

                $table->index(['pos_session_id', 'status']);
                $table->index(['user_id', 'status']);
                $table->index(['created_by']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_carts');
    }
};
