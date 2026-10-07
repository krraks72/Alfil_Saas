<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CinetPayPaymentController extends Controller
{
    public function processPayment(Request $request)
    {
        $validated = validatePaymentRequest($request, [
            'cpm_trans_id' => 'required|string',
            'cpm_result' => 'required|string',
        ]);

        try {
            $plan = Plan::findOrFail($validated['plan_id']);
            $settings = getPaymentGatewaySettings();

            if (!isset($settings['payment_settings']['cinetpay_site_id'])) {
                return back()->withErrors(['error' => __('CinetPay not configured')]);
            }

            if ($validated['cpm_result'] === '00') { // Success status
                processPaymentSuccess([
                    'user_id' => auth()->id(),
                    'plan_id' => $plan->id,
                    'billing_cycle' => $validated['billing_cycle'],
                    'payment_method' => 'cinetpay',
                    'coupon_code' => $validated['coupon_code'] ?? null,
                    'payment_id' => $validated['cpm_trans_id'],
                ]);

                return back()->with('success', __('Payment successful and plan activated'));
            }

            return back()->withErrors(['error' => __('Payment failed or cancelled')]);

        } catch (\Exception $e) {
            return handlePaymentError($e, 'cinetpay');
        }
    }

    public function createPayment(Request $request)
    {
        $validated = validatePaymentRequest($request);

        try {
            $plan = Plan::findOrFail($validated['plan_id']);
            $pricing = calculatePlanPricing($plan, $validated['coupon_code'] ?? null, $validated['billing_cycle']);
            $settings = getPaymentGatewaySettings();

            if (!isset($settings['payment_settings']['cinetpay_site_id']) || !isset($settings['payment_settings']['cinetpay_api_key'])) {
                return response()->json(['error' => __('CinetPay not configured')], 400);
            }

            $user = auth()->user();
            $transactionId = 'plan_' . $plan->id . '_' . $user->id . '_' . time();

            // Handle free plans - skip CinetPay for zero amount
            if ($pricing['final_price'] <= 0) {
                processPaymentSuccess([
                    'user_id' => $user->id,
                    'plan_id' => $plan->id,
                    'billing_cycle' => $validated['billing_cycle'],
                    'payment_method' => 'free',
                    'coupon_code' => $validated['coupon_code'] ?? null,
                    'payment_id' => $transactionId,
                ]);

                return response()->json([
                    'success' => true,
                    'payment_url' => route('plans.index'),
                    'message' => 'Free plan activated successfully'
                ]);
            }

            // CinetPay primarily uses XOF currency
            $currency = $settings['general_settings']['defaultCurrency'] ?? 'XOF';
            $amount = $pricing['final_price'];

            // Convert amount to XOF if needed (approximate rates)
            $originalCurrency = $settings['general_settings']['defaultCurrency'] ?? 'USD';
            if ($originalCurrency !== 'XOF') {
                                $conversionRate = $currency === 'USD' ? 600 : ($currency === 'EUR' ? 650 : 600);
$amountInXOF = $amount * $conversionRate;
                $amountInMinorUnit = max(100, (int) ($amountInXOF));
                $currency = 'XOF'; // CinetPay primarily uses XOF
            }
            // Prepare API request data according to CinetPay v2 API
            $apiData = [
                'apikey' => $settings['payment_settings']['cinetpay_api_key'],
                'site_id' => (int) $settings['payment_settings']['cinetpay_site_id'],
                'transaction_id' => $transactionId,
                'amount' => $amountInMinorUnit,
                'currency' => $currency,
                'description' => 'Plan subscription: ' . $plan->name . ' (' . ucfirst($validated['billing_cycle']) . ')',
                'notify_url' => route('cinetpay.callback'),
                'return_url' => route('cinetpay.success'),
                'channels' => 'ALL',
                'customer_name' => $user->name ?? 'Customer',
                'customer_surname' => $user->last_name ?? 'User',
                'customer_email' => $user->email,
                'customer_phone_number' => $user->phone ?? '+2250000000000',
                'customer_address' => $user->address ?? 'Abidjan',
                'customer_city' => $user->city ?? 'Abidjan',
                'customer_country' => 'CI',
                'customer_state' => 'CI',
                'customer_zip_code' => $user->zip_code ?? '00000',
                'custom' => json_encode([
                    'plan_id' => $plan->id,
                    'user_id' => $user->id,
                    'billing_cycle' => $validated['billing_cycle'],
                    'coupon_code' => $validated['coupon_code'] ?? null
                ])
            ];

            // Make API call to CinetPay
            $response = $this->callCinetPayAPI($apiData);

            if ($response && isset($response['code']) && $response['code'] === '201') {
                return response()->json([
                    'success' => true,
                    'payment_url' => $response['data']['payment_url'],
                    'payment_token' => $response['data']['payment_token'] ?? null,
                    'transaction_id' => $transactionId
                ]);
            }

            $errorMessage = $response['message'] ?? $response['description'] ?? 'Payment creation failed';
            Log::error('CinetPay API Error: ' . $errorMessage . ' | Full Response: ' . json_encode($response));
            return response()->json(['error' => __($errorMessage)], 400);

        } catch (\Exception $e) {
            Log::error('CinetPay payment creation error: ' . $e->getMessage());
            return response()->json(['error' => __('Payment creation failed')], 500);
        }
    }

    private function callCinetPayAPI($data)
    {
        $url = 'https://api-checkout.cinetpay.com/v2/payment';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'User-Agent: POSSAAS/1.0'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_error($ch)) {
            Log::error('CinetPay cURL error: ' . curl_error($ch));
            curl_close($ch);
            return null;
        }

        curl_close($ch);

        if ($httpCode !== 200) {
            Log::error('CinetPay API HTTP error: ' . $httpCode . ' Response: ' . $response);
        }

        return json_decode($response, true);
    }

    public function success(Request $request)
    {
        try {
            $transactionId = $request->input('transaction_id') ?? $request->input('cpm_trans_id');

            if ($transactionId) {
                $parts = explode('_', $transactionId);

                if (count($parts) >= 4) {
                    $planId = $parts[1];
                    $userId = $parts[2];

                    $plan = Plan::find($planId);
                    $user = User::find($userId);

                    if ($plan && $user) {
                        // Check if payment was already processed
                        $existingOrder = \App\Models\PlanOrder::where('payment_id', $transactionId)
                            ->where('status', 'approved')
                            ->first();

                        if (!$existingOrder) {
                            processPaymentSuccess([
                                'user_id' => $user->id,
                                'plan_id' => $plan->id,
                                'billing_cycle' => 'monthly', // Default, will be updated by callback
                                'payment_method' => 'cinetpay',
                                'payment_id' => $transactionId,
                            ]);
                        }

                        return redirect()->route('plans.index')->with('success', __('Payment completed successfully'));
                    }
                }
            }

            return redirect()->route('plans.index')->with('error', __('Payment verification failed'));

        } catch (\Exception $e) {
            Log::error('CinetPay success error: ' . $e->getMessage());
            return redirect()->route('plans.index')->with('error', __('Payment processing failed'));
        }
    }

    public function callback(Request $request)
    {
        try {
            $transactionId = $request->input('cpm_trans_id');
            $result = $request->input('cpm_result');
            $amount = $request->input('cpm_amount');
            $currency = $request->input('cpm_currency');
            $customData = $request->input('cpm_custom');

            Log::info('CinetPay callback received', [
                'transaction_id' => $transactionId,
                'result' => $result,
                'amount' => $amount,
                'custom' => $customData
            ]);

            if ($transactionId && $result === '00') {
                // Parse custom data if available
                $custom = null;
                if ($customData) {
                    $custom = json_decode($customData, true);
                }

                $parts = explode('_', $transactionId);

                if (count($parts) >= 4) {
                    $planId = $parts[1];
                    $userId = $parts[2];

                    $plan = Plan::find($planId);
                    $user = User::find($userId);

                    if ($plan && $user) {
                        // Check if payment was already processed
                        $existingOrder = \App\Models\PlanOrder::where('payment_id', $transactionId)
                            ->where('status', 'approved')
                            ->first();

                        if (!$existingOrder) {
                            $billingCycle = $custom['billing_cycle'] ?? 'monthly';
                            $couponCode = $custom['coupon_code'] ?? null;

                            processPaymentSuccess([
                                'user_id' => $user->id,
                                'plan_id' => $plan->id,
                                'billing_cycle' => $billingCycle,
                                'payment_method' => 'cinetpay',
                                'coupon_code' => $couponCode,
                                'payment_id' => $transactionId,
                            ]);

                            Log::info('CinetPay payment processed successfully', [
                                'user_id' => $user->id,
                                'plan_id' => $plan->id,
                                'transaction_id' => $transactionId
                            ]);
                        } else {
                            Log::info('CinetPay payment already processed', ['transaction_id' => $transactionId]);
                        }
                    } else {
                        Log::error('CinetPay callback: Plan or User not found', [
                            'plan_id' => $planId,
                            'user_id' => $userId
                        ]);
                    }
                } else {
                    Log::error('CinetPay callback: Invalid transaction ID format', ['transaction_id' => $transactionId]);
                }
            } else {
                Log::error('CinetPay payment failed', [
                    'result' => $result,
                    'transaction_id' => $transactionId
                ]);
            }

            return response()->json(['status' => 'success']);

        } catch (\Exception $e) {
            Log::error('CinetPay callback error: ' . $e->getMessage());
            return response()->json(['error' => __('Callback processing failed')], 500);
        }
    }
}
