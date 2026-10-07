<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Http\Request;

class PaiementPaymentController extends Controller
{
    public function processPayment(Request $request)
    {
        $validated = validatePaymentRequest($request, [
            'transaction_id' => 'required|string',
            'status' => 'required|string',
        ]);

        try {
            $plan = Plan::findOrFail($validated['plan_id']);
            $settings = getPaymentGatewaySettings();
            
            if (!isset($settings['payment_settings']['paiement_merchant_id'])) {
                return back()->withErrors(['error' => __('Paiement Pro not configured')]);
            }

            if ($validated['status'] === 'success') {
                processPaymentSuccess([
                    'user_id' => auth()->id(),
                    'plan_id' => $plan->id,
                    'billing_cycle' => $validated['billing_cycle'],
                    'payment_method' => 'paiement',
                    'coupon_code' => $validated['coupon_code'] ?? null,
                    'payment_id' => $validated['transaction_id'],
                ]);

                return back()->with('success', __('Payment successful and plan activated'));
            }

            return back()->withErrors(['error' => __('Payment failed or cancelled')]);

        } catch (\Exception $e) {
            return handlePaymentError($e, 'paiement');
        }
    }

    public function createPayment(Request $request)
    {
        $validated = validatePaymentRequest($request);

        try {
            $plan = Plan::findOrFail($validated['plan_id']);
            $pricing = calculatePlanPricing($plan, $validated['coupon_code'] ?? null, $validated['billing_cycle']);
            $settings = getPaymentGatewaySettings();

            if (!isset($settings['payment_settings']['paiement_merchant_id'])) {
                return response()->json(['error' => __('Paiement Pro not configured')], 400);
            }

            $user = auth()->user();
            $transactionId = 'REF-' . time();

            $data = [
                'merchantId' => $settings['payment_settings']['paiement_merchant_id'],
                'amount' => (int)($pricing['final_price'] * 549),
                'description' => $plan->name,
                'channel' => 'CARD',
                'countryCurrencyCode' => '952',
                'referenceNumber' => $transactionId,
                'customerEmail' => $user->email,
                'customerFirstName' => $user->name ?? 'Customer',
                'customerLastname' => $user->lastname ?? 'User',
                'customerPhoneNumber' => $user->phone ?? '01234567',
                'notificationURL' => route('paiement.callback'),
                'returnURL' => route('paiement.success'),
                'returnContext' => json_encode(['plan_id' => $plan->id, 'user_id' => $user->id])
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://www.paiementpro.net/webservice/onlinepayment/init/curl-init.php');
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json; charset=utf-8']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HEADER, false);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            if ($curlError) {
                return response()->json(['error' => __('Payment request failed: :error', ['error' => $curlError])], 500);
            }

            if ($httpCode === 200 && $response) {
                $responseData = json_decode($response, true);
                
                if (json_last_error() !== JSON_ERROR_NONE) {
                    // If JSON decode fails, treat response as redirect URL
                    if (filter_var($response, FILTER_VALIDATE_URL)) {
                        return response()->json([
                            'success' => true,
                            'payment_url' => $response,
                            'payment_data' => [],
                            'transaction_id' => $transactionId
                        ]);
                    }
                    return response()->json(['error' => __('Invalid payment response format')], 500);
                }
                
                // Handle different response formats from Paiement Pro
                if (isset($responseData['success']) && $responseData['success'] && isset($responseData['redirect_url'])) {
                    return response()->json([
                        'success' => true,
                        'payment_url' => $responseData['redirect_url'],
                        'payment_data' => [],
                        'transaction_id' => $transactionId
                    ]);
                } elseif (isset($responseData['redirect_url'])) {
                    return response()->json([
                        'success' => true,
                        'payment_url' => $responseData['redirect_url'],
                        'payment_data' => [],
                        'transaction_id' => $transactionId
                    ]);
                } elseif (isset($responseData['url'])) {
                    return response()->json([
                        'success' => true,
                        'payment_url' => $responseData['url'],
                        'payment_data' => [],
                        'transaction_id' => $transactionId
                    ]);
                } elseif (is_string($responseData) && filter_var($responseData, FILTER_VALIDATE_URL)) {
                    return response()->json([
                        'success' => true,
                        'payment_url' => $responseData,
                        'payment_data' => [],
                        'transaction_id' => $transactionId
                    ]);
                }
                
                return response()->json([
                    'error' => $responseData['message'] ?? $responseData['error'] ?? __('Payment initialization failed')
                ], 400);
            }

            return response()->json(['error' => __('Payment service unavailable. HTTP Code: :code', ['code' => $httpCode])], 500);

        } catch (\Exception $e) {
            \Log::error('Paiement Pro payment creation failed: ' . $e->getMessage());
            return response()->json(['error' => __('Payment creation failed: :message', ['message' => $e->getMessage()])], 500);
        }
    }

    public function success(Request $request)
    {
        return redirect()->route('plans.index')->with('success', __('Payment completed successfully'));
    }

    public function callback(Request $request)
    {
        try {
            $transactionId = $request->input('reference');
            $status = $request->input('status');
            
            if ($transactionId && $status === 'success') {
                $parts = explode('_', $transactionId);
                
                if (count($parts) >= 3) {
                    $planId = $parts[1];
                    $userId = $parts[2];
                    
                    $plan = Plan::find($planId);
                    $user = User::find($userId);
                    
                    if ($plan && $user) {
                        processPaymentSuccess([
                            'user_id' => $user->id,
                            'plan_id' => $plan->id,
                            'billing_cycle' => 'monthly',
                            'payment_method' => 'paiement',
                            'payment_id' => $request->input('transaction_id'),
                        ]);
                    }
                }
            }

            return response()->json(['status' => 'success']);

        } catch (\Exception $e) {
            return response()->json(['error' => __('Callback processing failed')], 500);
        }
    }
}