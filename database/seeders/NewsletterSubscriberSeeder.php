<?php

namespace Database\Seeders;

use App\Models\NewsletterSubscription;
use Illuminate\Database\Seeder;

class NewsletterSubscriberSeeder extends Seeder
{
    public function run(): void
    {
        if (IsDemo()) {
            $subscribers = [
                'alex.johnson@gmail.com', 'maria.gonzalez@yahoo.com', 'peter.kim@outlook.com',
                'sophia.williams@hotmail.com', 'daniel.brown@business.com', 'olivia.davis@store.net',
                'ryan.miller@company.org', 'isabella.wilson@shop.com', 'ethan.moore@retail.com',
                'ava.taylor@boutique.co', 'noah.anderson@market.biz', 'emma.thomas@fashion.net',
                'liam.jackson@electronics.com', 'mia.white@beauty.store', 'lucas.harris@sports.shop'
            ];
            
            foreach ($subscribers as $email) {
                NewsletterSubscription::create([
                    'email' => $email,
                    'subscribed_at' => now()->subDays(rand(1, 90)),
                    'created_at' => now()->subDays(rand(1, 90)),
                    'updated_at' => now()
                ]);
            }
        }
    }
}