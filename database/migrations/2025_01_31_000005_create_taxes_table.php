<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if(!Schema::hasTable('taxes')) {
            Schema::create('taxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->decimal('rate', 5, 2);
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            

            $table->index(['created_by', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('taxes');
    }
};