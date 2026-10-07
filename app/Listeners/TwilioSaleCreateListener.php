<?php

namespace App\Listeners;

use App\Events\SaleCreate;
use App\Models\User;
use App\Services\TwilioService;
use Exception;

class TwilioSaleCreateListener
{
    public function __construct(
        private TwilioService $twilioService
    ) {
        //
    }

    public function handle(SaleCreate $event): void
    {
        $sale = $event->sale;
        $contact = $sale->customer->phone ?? null;

        if ($contact && isNotificationTemplateEnabled('New Sale', createdBy(), 'twilio')) {
            $variables = [
                '{sale_number}' => $sale->sale_number ?? '-',
                '{total_amount}' => $sale->total_amount ?? '-',
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
                        templateName: 'New Sale',
                        toPhone: $contact,
                        variables: $variables,
                        language: $userLanguage,
                        userId: createdBy()
                    );
                } else {
                    session()->flash('twilio_error', 'Twilio configuration is incomplete.');
                }
            } catch (Exception $e) {
                session()->flash('twilio_error', 'Failed to send sale create notification: ' . $e->getMessage());
            }
        }
    }
}
