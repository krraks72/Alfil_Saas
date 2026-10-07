<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if(!Schema::hasTable('purchases')) {
            Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('purchase_number')->unique();
            $table->foreignId('vendor_id')->constrained('vendors')->onDelete('cascade');
            $table->date('purchase_date');
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['created_by', 'status']);
            $table->index(['purchase_date']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
