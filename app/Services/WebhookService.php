<?php

namespace App\Services;

use App\Models\Webhook;
use Illuminate\Support\Facades\Log;

class WebhookService
{
    public function triggerWebhooks(string $module, array $data, int $userId): void
    {
        $webhooks = Webhook::where('user_id', $userId)
            ->where('module', $module)
            ->get();

        foreach ($webhooks as $webhook) {
            $this->sendWebhook($webhook, $data);
        }
    }

    private function sendWebhook(Webhook $webhook, array $data): void
    {
        try {
            $payload = [
                'module' => $webhook->module,
                'data' => $data,
                'reference_url' => request()->fullUrl(),
                'timestamp' => now()->toISOString(),
            ];

            $ch = curl_init();
            
            curl_setopt_array($ch, [
                CURLOPT_URL => $webhook->url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'User-Agent: POS-Webhook/1.0'
                ],
            ]);

            if ($webhook->method === 'POST') {
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            } else {
                curl_setopt($ch, CURLOPT_URL, $webhook->url . '?' . http_build_query($payload));
            }

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error) {
                Log::error("Webhook failed for {$webhook->module}: {$error}", [
                    'webhook_id' => $webhook->id,
                    'url' => $webhook->url
                ]);
            } elseif ($httpCode >= 400) {
                Log::warning("Webhook returned HTTP {$httpCode} for {$webhook->module}", [
                    'webhook_id' => $webhook->id,
                    'url' => $webhook->url,
                    'response' => $response
                ]);
            } else {
                Log::info("Webhook sent successfully for {$webhook->module}", [
                    'webhook_id' => $webhook->id,
                    'url' => $webhook->url,
                    'http_code' => $httpCode
                ]);
            }

        } catch (\Exception $e) {
            Log::error("Webhook exception for {$webhook->module}: {$e->getMessage()}", [
                'webhook_id' => $webhook->id,
                'url' => $webhook->url
            ]);
        }
    }
}