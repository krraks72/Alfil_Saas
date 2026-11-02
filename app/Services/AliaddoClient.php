<?php

namespace App\Services;

use App\Models\AliaddoSetting;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class AliaddoClient
{
    public function createInvoice(array $document, AliaddoSetting $settings): Response
    {
        return $this->request($settings)->post('/v2/documents/invoices', $document);
    }

    public function getInvoice(string $id, AliaddoSetting $settings): Response
    {
        return $this->request($settings)->get('/v2/documents/invoices/'.rawurlencode($id));
    }

    public function findInvoiceByPrefixAndConsecutive(string $prefix, string $consecutive, AliaddoSetting $settings): Response
    {
        return $this->request($settings)->get('/v2/documents/invoices/find-by-prefix-and-consecutive', [
            'prefix' => $prefix,
            'consecutive' => $consecutive,
        ]);
    }

    public function createEquivalentDocument(array $document, AliaddoSetting $settings): Response
    {
        return $this->request($settings)->post('/v2/documents/equivalent-documents', $document);
    }

    public function getEquivalentDocument(string $id, AliaddoSetting $settings): Response
    {
        return $this->request($settings)->get('/v2/documents/equivalent-document/'.rawurlencode($id));
    }

    public function findEquivalentDocumentByPrefixAndConsecutive(string $prefix, string $consecutive, AliaddoSetting $settings): Response
    {
        return $this->request($settings)->get('/v2/documents/equivalent-documents/find-by-prefix-and-consecutive', [
            'prefix' => $prefix,
            'consecutive' => $consecutive,
        ]);
    }

    private function request(AliaddoSetting $settings): PendingRequest
    {
        $token = trim((string) $settings->api_token);

        if ($token === '') {
            throw new AliaddoNotConfiguredException('Aliaddo API token is not configured.');
        }

        if (! $settings->enabled) {
            throw new AliaddoNotConfiguredException('Automatic Aliaddo invoicing is disabled.');
        }

        return Http::baseUrl(rtrim($settings->base_url, '/'))
            ->withToken(preg_replace('/^Bearer\s+/i', '', $token))
            ->acceptJson()
            ->asJson()
            ->timeout(30);
    }
}
