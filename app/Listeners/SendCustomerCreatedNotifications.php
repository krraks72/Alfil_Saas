<?php

namespace App\Listeners;

use App\Events\CustomerCreate;
use App\Services\NotificationTemplateService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendCustomerCreatedNotifications implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(CustomerCreate $event): void
    {
        $customer = $event->customer;
        
        // Send Slack notification
        NotificationTemplateService::sendNotification(
            'New Customer',
            'slack',
            $customer,
            $customer->created_by
        );

        // Send Twilio SMS notification
        NotificationTemplateService::sendNotification(
            'New Customer',
            'twilio',
            $customer,
            $customer->created_by
        );
    }
}