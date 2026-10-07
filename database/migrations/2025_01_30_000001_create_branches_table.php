<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if(!Schema::hasTable('branches')) {
            Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->text('address');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->foreignId('manager_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            $table->index(['created_by', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};