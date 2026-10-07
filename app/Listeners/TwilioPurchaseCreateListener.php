<?php

namespace App\Listeners;

use App\Events\PurchaseCreated;
use App\Models\User;
use App\Services\TwilioService;
use Exception;

class TwilioPurchaseCreateListener
{
    public function __construct(
        private TwilioService $twilioService
    ) {
        //
    }

    public function handle(PurchaseCreated $event): void
    {
        $purchase = $event->purchase;
        $contact = $purchase->vendor->phone ?? null;

        if ($contact && isNotificationTemplateEnabled('New Purchase', createdBy(), 'twilio')) {
            $variables = [
                '{purchase_number}' => $purchase->purchase_number ?? '-',
                '{vendor_name}' => $purchase->vendor->name ?? '-',
                '{total_amount}' => $purchase->total_amount ?? '-',
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
                        templateName: 'New Purchase',
                        toPhone: $contact,
                        variables: $variables,
                        language: $userLanguage,
                        userId: createdBy()
                    );
                } else {
                    session()->flash('twilio_error', 'Twilio configuration is incomplete.');
                }
            } catch (Exception $e) {
                session()->flash('twilio_error', 'Failed to send purchase create notification: ' . $e->getMessage());
            }
        }
    }
}
