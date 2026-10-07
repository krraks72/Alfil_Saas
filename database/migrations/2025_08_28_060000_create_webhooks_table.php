<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('module', ['New User', 'New Owner', 'New Customer', 'New Vendor', 'New Quote']);
            $table->enum('method', ['GET', 'POST']);
            $table->string('url');
            $table->timestamps();
            
            $table->index(['user_id', 'module']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhooks');
    }
};