<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if(!Schema::hasTable('sales')) {
            Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('sale_number')->unique();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('cash_register_id')->constrained('cash_registers')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2);
            $table->decimal('paid_amount', 10, 2);
            $table->decimal('change_amount', 10, 2)->default(0);
            $table->enum('payment_method', ['cash', 'card', 'digital_wallet', 'bank_transfer', 'mixed']);
            $table->enum('status', ['completed', 'pending', 'cancelled', 'refunded'])->default('completed');
            $table->text('notes')->nullable();
            $table->json('payment_details')->nullable();
            $table->timestamp('sale_date');
            $table->timestamps();

            $table->index(['created_by', 'sale_date']);
            $table->index(['branch_id', 'sale_date']);
            $table->index(['cash_register_id', 'sale_date']);
            $table->index(['customer_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};