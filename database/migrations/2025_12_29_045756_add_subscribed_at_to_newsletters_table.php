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
        if (Schema::hasTable('newsletter_subscriptions') && !Schema::hasColumn('newsletter_subscriptions', 'subscribed_at')) {
            Schema::table('newsletter_subscriptions', function (Blueprint $table) {
                $table->timestamp('subscribed_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('newsletter_subscriptions', 'subscribed_at')) {
            Schema::table('newsletter_subscriptions', function (Blueprint $table) {
                $table->dropColumn('subscribed_at');
            });
        }
    }
};
