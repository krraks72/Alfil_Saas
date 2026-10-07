<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ContactMessageSeeder extends Seeder
{
    public function run(): void
    {
        if (IsDemo()) {
            $contacts = [
                ['name' => 'John Smith', 'email' => 'john.smith@gmail.com', 'subject' => 'Pricing Inquiry', 'message' => 'Hi, I would like to know more about your pricing plans for small businesses. Can you provide detailed information?'],
                ['name' => 'Sarah Johnson', 'email' => 'sarah.j@outlook.com', 'subject' => 'Demo Request', 'message' => 'Hello, I am interested in scheduling a demo of your POS system. When would be a good time?'],
                ['name' => 'Mike Davis', 'email' => 'mike.davis@yahoo.com', 'subject' => 'Integration Questions', 'message' => 'Does your system integrate with QuickBooks and other accounting software? We need this feature.'],
                ['name' => 'Emily Chen', 'email' => 'emily.chen@hotmail.com', 'subject' => 'Multi-location Support', 'message' => 'We have 3 retail locations. Can your POS system handle multiple branches with centralized reporting?'],
                ['name' => 'Robert Wilson', 'email' => 'r.wilson@business.com', 'subject' => 'Technical Support', 'message' => 'I am having trouble setting up the inventory management. Can someone help me with the configuration?'],
                ['name' => 'Lisa Brown', 'email' => 'lisa.brown@store.net', 'subject' => 'Payment Gateway', 'message' => 'Which payment gateways do you support? We need Stripe and PayPal integration for our online store.'],
                ['name' => 'David Martinez', 'email' => 'david.m@retail.com', 'subject' => 'Upgrade Question', 'message' => 'Currently on the basic plan. What additional features do I get if I upgrade to the professional plan?'],
                ['name' => 'Jennifer Taylor', 'email' => 'jen.taylor@gmail.com', 'subject' => 'Mobile App', 'message' => 'Do you have a mobile app for iOS and Android? I need to manage my store on the go.'],
                ['name' => 'Thomas Anderson', 'email' => 'thomas.a@company.org', 'subject' => 'Data Export', 'message' => 'How can I export my sales data and customer information? I need it for tax reporting purposes.'],
                ['name' => 'Amanda White', 'email' => 'amanda.white@shop.com', 'subject' => 'Training Resources', 'message' => 'Are there any training materials or videos available for new users? My staff needs to learn the system.'],
                ['name' => 'Kevin Lee', 'email' => 'kevin.lee@business.net', 'subject' => 'Barcode Scanner', 'message' => 'What barcode scanners are compatible with your system? We need recommendations for our hardware setup.'],
                ['name' => 'Michelle Garcia', 'email' => 'm.garcia@store.co', 'subject' => 'Refund Process', 'message' => 'How does the refund and return process work in your system? Can customers get store credit?'],
                ['name' => 'James Rodriguez', 'email' => 'james.r@retail.biz', 'subject' => 'Inventory Alerts', 'message' => 'Can the system send automatic alerts when inventory is running low? This would be very helpful for restocking.'],
                ['name' => 'Nicole Thompson', 'email' => 'nicole.t@boutique.com', 'subject' => 'Customer Loyalty', 'message' => 'Do you have built-in customer loyalty program features? We want to reward our repeat customers.'],
                ['name' => 'Christopher Moore', 'email' => 'chris.moore@market.org', 'subject' => 'API Access', 'message' => 'Do you provide API access for custom integrations? We have some specific requirements for our business.']
            ];
            
            foreach ($contacts as $i => $contact) {
                \DB::table('contacts')->insert([
                    'name' => $contact['name'],
                    'email' => $contact['email'],
                    'subject' => $contact['subject'],
                    'message' => $contact['message'],
                    'created_at' => now()->subDays(rand(1, 45)),
                    'updated_at' => now()
                ]);
            }
        }
    }
}