<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->date('from_date');
            $table->date('to_date');
            $table->string('color', 7)->default('#3B82F6'); // Hex color code
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->index(['from_date', 'to_date', 'status']);
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};