<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('processed_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('output_product_id')->constrained('products')->restrictOnDelete();
            $table->unsignedInteger('produced_quantity');
            $table->date('processed_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['created_by', 'processed_date']);
        });

        Schema::create('processed_product_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('processed_product_id')->constrained('processed_products')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->unsignedInteger('quantity');
            $table->timestamps();

            $table->unique(['processed_product_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processed_product_items');
        Schema::dropIfExists('processed_products');
    }
};
