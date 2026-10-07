<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if(!Schema::hasTable('sale_items')) {
            Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('product_name'); // Store product name at time of sale
            $table->string('product_sku'); // Store SKU at time of sale
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2); // Price at time of sale
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('line_total', 10, 2); // (quantity * unit_price) - discount + tax
            $table->timestamps();

            $table->index(['sale_id']);
            $table->index(['product_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};