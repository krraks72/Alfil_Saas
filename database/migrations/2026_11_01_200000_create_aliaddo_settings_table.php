<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aliaddo_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('base_url');
            $table->text('api_token')->nullable();
            $table->json('configuration');
            $table->boolean('enabled')->default(false);
            $table->timestamps();
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->string('identification')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('digit_check', 2)->nullable();
            $table->string('identification_type_code', 10)->nullable();
            $table->string('person_type', 10)->nullable();
            $table->string('regime_type', 10)->nullable();
            $table->string('responsible_for', 20)->nullable();
            $table->string('responsibilities')->nullable();
            $table->string('billing_region_code', 10)->nullable();
            $table->string('billing_city_code', 10)->nullable();
            $table->string('economic_activities')->nullable();
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->string('aliaddo_status', 20)->nullable()->index();
            $table->string('aliaddo_document_id')->nullable();
            $table->string('aliaddo_prefix', 30)->nullable();
            $table->unsignedBigInteger('aliaddo_consecutive')->nullable();
            $table->text('aliaddo_error')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['aliaddo_status']);
            $table->dropColumn([
                'aliaddo_status',
                'aliaddo_document_id',
                'aliaddo_prefix',
                'aliaddo_consecutive',
                'aliaddo_error',
            ]);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'identification',
                'first_name',
                'last_name',
                'digit_check',
                'identification_type_code',
                'person_type',
                'regime_type',
                'responsible_for',
                'responsibilities',
                'billing_region_code',
                'billing_city_code',
                'economic_activities',
            ]);
        });

        Schema::dropIfExists('aliaddo_settings');
    }
};
