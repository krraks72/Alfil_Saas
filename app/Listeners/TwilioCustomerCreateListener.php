<?php

namespace App\Listeners;

use App\Events\CustomerCreated;
use App\Models\User;
use App\Services\TwilioService;
use Exception;

class TwilioCustomerCreateListener
{
    public function __construct(
        private TwilioService $twilioService
    ) {
        //
    }

    public function handle(CustomerCreated $event): void
    {
        $customer = $event->customer;
        $contact = $customer->phone;

        if (isNotificationTemplateEnabled('New Customer', createdBy(), 'twilio') && !empty($contact)) {
            $variables = [
                '{customer_name}' => $customer->name ?? '-',
                '{customer_email}' => $customer->email ?? '-',
                '{customer_phone}' => $customer->phone ?? '-',
                '{created_by}' => $customer->creator->name ?? '-',

            ];

            try {
                session()->forget('twilio_error');

                $twilioSid = getSetting('twilio_account_sid', '', createdBy());
                $twilioToken = getSetting('twilio_auth_token', '', createdBy());
                $twilioFrom = getSetting('twilio_from_number', '', createdBy());

                if (filled($twilioSid) && filled($twilioToken) && filled($twilioFrom)) {
                    $createdByUser = User::find(createdBy());
                    $userLanguage = $createdByUser->lang ?? 'en';
                    $this->twilioService->sendTemplateMessageToPhone(
                        templateName: 'New Customer',
                        toPhone: $contact,
                        variables: $variables,
                        language: $userLanguage,
                        userId: createdBy()
                    );
                } else {
                    session()->flash('twilio_error', 'Twilio configuration is incomplete.');
                }
            } catch (Exception $e) {
                session()->flash('twilio_error', 'Failed to send customer create notification: ' . $e->getMessage());
            }
        }
    }
}
