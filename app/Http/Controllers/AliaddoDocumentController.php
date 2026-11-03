<?php

namespace App\Http\Controllers;

use App\Models\AliaddoSetting;
use App\Models\Sale;
use App\Services\AliaddoClient;
use App\Services\AliaddoInvoiceException;
use App\Services\AliaddoInvoiceService;
use App\Services\AliaddoNotConfiguredException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AliaddoDocumentController extends Controller
{
    public function retrySaleInvoice(Sale $sale, AliaddoInvoiceService $invoices)
    {
        abort_unless($sale->created_by === createdBy(), 403, __('Unauthorized access to sale.'));

        try {
            $result = $invoices->issueForSale($sale);
        } catch (AliaddoInvoiceException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        if (! $result) {
            return back()->with('error', __('Automatic Aliaddo invoicing is disabled.'));
        }

        return back()->with('success', __('Electronic invoice :prefix-:consecutive has been issued.', [
            'prefix' => $result['prefix'],
            'consecutive' => $result['consecutive'],
        ]));
    }

    public function createInvoice(Request $request, AliaddoClient $aliaddo): JsonResponse
    {
        $request->validate($this->documentRules());

        return $this->respond(fn () => $aliaddo->createInvoice(
            $request->json()->all(),
            $this->tenantSettings(),
        ));
    }

    public function getInvoice(string $id, AliaddoClient $aliaddo): JsonResponse
    {
        return $this->respond(fn () => $aliaddo->getInvoice($id, $this->tenantSettings()));
    }

    public function findInvoiceByPrefixAndConsecutive(Request $request, AliaddoClient $aliaddo): JsonResponse
    {
        $validated = $request->validate([
            'prefix' => ['required', 'string', 'max:30'],
            'consecutive' => ['required', 'string', 'max:50'],
        ]);

        return $this->respond(fn () => $aliaddo->findInvoiceByPrefixAndConsecutive(
            $validated['prefix'],
            $validated['consecutive'],
            $this->tenantSettings(),
        ));
    }

    public function createEquivalentDocument(Request $request, AliaddoClient $aliaddo): JsonResponse
    {
        $request->validate($this->documentRules());

        return $this->respond(fn () => $aliaddo->createEquivalentDocument(
            $request->json()->all(),
            $this->tenantSettings(),
        ));
    }

    public function getEquivalentDocument(string $id, AliaddoClient $aliaddo): JsonResponse
    {
        return $this->respond(fn () => $aliaddo->getEquivalentDocument($id, $this->tenantSettings()));
    }

    public function findEquivalentDocumentByPrefixAndConsecutive(Request $request, AliaddoClient $aliaddo): JsonResponse
    {
        $validated = $request->validate([
            'prefix' => ['required', 'string', 'max:30'],
            'consecutive' => ['required', 'string', 'max:50'],
        ]);

        return $this->respond(fn () => $aliaddo->findEquivalentDocumentByPrefixAndConsecutive(
            $validated['prefix'],
            $validated['consecutive'],
            $this->tenantSettings(),
        ));
    }

    private function tenantSettings(): AliaddoSetting
    {
        $settings = AliaddoSetting::where('company_id', createdBy())->first();

        if (! $settings) {
            throw new AliaddoNotConfiguredException('Configure la integración Aliaddo para esta empresa.');
        }

        return $settings;
    }

    private function documentRules(): array
    {
        return [
            'code' => ['required', 'string', 'max:10'],
            'typeOperation' => ['required', 'string', 'max:40'],
            'mode' => ['required', 'string', 'in:Test,Production'],
            'format' => ['nullable', 'string', 'max:30'],
            'prefix' => ['nullable', 'string', 'max:8'],
            'consecutive' => ['required', 'integer', 'min:1'],
            'currencyCode' => ['required', 'string', 'size:3'],
            'customer' => ['required', 'array'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*' => ['required', 'array'],
            'totals' => ['required', 'array'],
        ];
    }

    private function respond(callable $request): JsonResponse
    {
        try {
            /** @var Response $response */
            $response = $request();
        } catch (AliaddoNotConfiguredException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        } catch (ConnectionException $exception) {
            report($exception);

            return response()->json(['message' => 'Unable to connect to Aliaddo.'], 502);
        }

        $body = $response->json();

        return response()->json(
            $body ?? ['message' => $response->body()],
            $response->status(),
        );
    }
}
