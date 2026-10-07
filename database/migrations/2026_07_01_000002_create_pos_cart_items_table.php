<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('pos_cart_items')) {
            Schema::create('pos_cart_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pos_cart_id')->constrained('pos_carts')->onDelete('cascade');
                $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
                $table->string('product_name');
                $table->string('product_sku');
                $table->decimal('unit_price', 10, 2);
                $table->integer('quantity');
                $table->decimal('line_total', 10, 2);
                $table->timestamps();

                $table->index(['pos_cart_id']);
                $table->index(['product_id']);
                $table->unique(['pos_cart_id', 'product_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_cart_items');
    }
};
