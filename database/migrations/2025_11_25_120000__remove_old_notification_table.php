<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        //
            if (Schema::hasTable('notification_template_langs')) {
        Schema::dropIfExists('notification_template_langs');
            }
             if (Schema::hasTable('notification_templates')) {
        Schema::dropIfExists('notification_templates');
          }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
