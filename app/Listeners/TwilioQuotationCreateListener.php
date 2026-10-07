<?php

namespace App\Listeners;

use App\Events\QuotationCreated;
use App\Models\User;
use App\Services\TwilioService;
use Exception;

class TwilioQuotationCreateListener
{
    public function __construct(
        private TwilioService $twilioService
    ) {
        //
    }

    public function handle(QuotationCreated $event): void
    {
        $quotation = $event->quotation;
        $contact = $quotation->customer->phone ?? null;

        if ($contact && isNotificationTemplateEnabled('New Quotation', createdBy(), 'twilio')) {
            $variables = [
                '{quotation_number}' => $quotation->quotation_number ?? '-',
                '{total_amount}' => $quotation->total_amount ?? '-',
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
                        templateName: 'New Quotation',
                        toPhone: $contact,
                        variables: $variables,
                        language: $userLanguage,
                        userId: createdBy()
                    );
                } else {
                    session()->flash('twilio_error', 'Twilio configuration is incomplete.');
                }
            } catch (Exception $e) {
                session()->flash('twilio_error', 'Failed to send quotation create notification: ' . $e->getMessage());
            }
        }
    }
}
