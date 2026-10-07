<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Webhook;
use App\Models\User;

class WebhookSeeder extends Seeder
{
    public function run(): void
    {
        if (!IsDemo()) {
            return;
        }

        $company = User::where('email', 'company@example.com')->first();

        if (!$company) {
            return;
        }

        $webhooks = [
            [
                'module' => 'New User',
                'method' => 'POST',
                'url'    => 'https://hooks.example.com/new-user',
            ],
            [
                'module' => 'New Customer',
                'method' => 'POST',
                'url'    => 'https://hooks.example.com/new-customer',
            ],
            [
                'module' => 'New Vendor',
                'method' => 'GET',
                'url'    => 'https://hooks.example.com/new-vendor',
            ],
            [
                'module' => 'New Quote',
                'method' => 'POST',
                'url'    => 'https://hooks.example.com/new-quote',
            ],
        ];

        foreach ($webhooks as $data) {
            Webhook::create([
                'user_id' => $company->id,
                'module'  => $data['module'],
                'method'  => $data['method'],
                'url'     => $data['url'],
            ]);
        }
    }
}
