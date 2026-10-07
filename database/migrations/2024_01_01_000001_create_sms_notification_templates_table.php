<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('sms_notification_templates', function (Blueprint $table) {
            $table->id();
            $table->string('template_name');
            $table->string('title');
            $table->text('message');
            $table->boolean('is_enabled')->default(false);
            $table->json('variables')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
            
            $table->unique(['template_name', 'created_by']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('sms_notification_templates');
    }
};