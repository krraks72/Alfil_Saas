<?php

namespace App\Listeners;

use App\Events\VendorCreated;
use App\Models\User;
use App\Services\TwilioService;
use Exception;

class TwilioVendorCreateListener
{
    public function __construct(
        private TwilioService $twilioService
    ) {
        //
    }

    public function handle(VendorCreated $event): void
    {
        $vendor = $event->vendor;
        $contact = $vendor->phone;

        if (isNotificationTemplateEnabled('New Vendor', createdBy(), 'twilio')) {
            $variables = [
                '{vendor_name}' => $vendor->name ?? '-',
                '{vendor_email}' => $vendor->email ?? '-',
                '{vendor_phone}' => $vendor->phone ?? '-',
                '{created_by}' => $vendor->creator->name ?? '-',
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
                        templateName: 'New Vendor',
                        toPhone: $contact,
                        variables: $variables,
                        language: $userLanguage,
                        userId: createdBy()
                    );
                } else {
                    session()->flash('twilio_error', 'Twilio configuration is incomplete.');
                }
            } catch (Exception $e) {
                session()->flash('twilio_error', 'Failed to send vendor create notification: ' . $e->getMessage());
            }
        }
    }
}
