<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create notification_templates table
        Schema::create('notification_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type')->default('slack');
            $table->unsignedBigInteger('user_id')->default(1);
            $table->timestamps();
        });


        // Create notification_template_langs table
        Schema::create('notification_template_langs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('parent_id');
            $table->string('lang', 10);
            $table->string('title');
            $table->text('content');
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('notification_templates')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['parent_id', 'lang', 'created_by']);
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('notification_templates')) {
            Schema::dropIfExists('notification_templates');
        }
        if (Schema::hasTable('notification_template_langs')) {
            Schema::dropIfExists('notification_template_langs');
        }
    }
};
