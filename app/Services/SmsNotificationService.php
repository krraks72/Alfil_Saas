<?php

namespace App\Services;

use App\Models\SmsNotificationTemplate;

class SmsNotificationService
{
    public static function send($templateName, $data)
    {
        $template = SmsNotificationTemplate::where('template_name', $templateName)
            ->where('created_by', createdBy())
            ->where('is_enabled', true)
            ->first();

        if (!$template) {
            return;
        }

        $message = self::replaceVariables($template->message, $data);
        
        // Send SMS via Twilio (implement based on your Twilio setup)
        // TwilioService::sendSMS($message);
        
        \Log::info("SMS Notification: " . $message);
    }

    private static function replaceVariables($message, $data)
    {
        $variables = [
            '{{customer_name}}' => $data->name ?? $data->customer->name ?? '',
            '{{customer_phone}}' => $data->phone ?? $data->customer->phone ?? '',
            '{{customer_email}}' => $data->email ?? $data->customer->email ?? '',
            '{{vendor_name}}' => $data->name ?? $data->vendor->name ?? '',
            '{{vendor_phone}}' => $data->phone ?? $data->vendor->phone ?? '',
            '{{vendor_email}}' => $data->email ?? $data->vendor->email ?? '',
            '{{quotation_number}}' => $data->quotation_number ?? '',
            '{{purchase_number}}' => $data->purchase_number ?? '',
            '{{sale_number}}' => $data->sale_number ?? '',
            '{{return_number}}' => $data->return_number ?? '',
            '{{total_amount}}' => $data->total_amount ?? $data->grand_total ?? ''
        ];

        return str_replace(array_keys($variables), array_values($variables), $message);
    }
}