<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PayHerePaymentController extends Controller
{
    /**
     * Generate PayHere hash for payment verification
     */
    private function generatePayHereHash($data, $secret)
    {
        $hashString = $data['merchant_id'] . $data['order_id'] . $data['amount'] . $data['currency'] . strtoupper(md5($secret));
        return strtoupper(md5($hashString));
    }

    /**
     * Get PayHere configuration
     */
    private function getPayHereConfig()
    {
        $settings = getPaymentGatewaySettings();

        return [
            'merchant_id' => $settings['payment_settings']['payhere_merchant_id'] ?? null,
            'merchant_secret' => $settings['payment_settings']['payhere_merchant_secret'] ?? null,
            'mode' => $settings['payment_settings']['payhere_mode'] ?? 'sandbox',
            'enabled' => ($settings['payment_settings']['is_payhere_enabled'] ?? '0') === '1',
        ];
    }

    /**
     * Create PayHere payment for plan subscription
     */
    public function createPayment(Request $request)
    {
        $validated = validatePaymentRequest($request);

        try {
            $plan = Plan::findOrFail($validated['plan_id']);
            $pricing = calculatePlanPricing($plan, $validated['coupon_code'] ?? null, $validated['billing_cycle']);
            $config = $this->getPayHereConfig();

            if (!$config['enabled'] || !$config['merchant_id'] || !$config['merchant_secret']) {
                return response()->json(['error' => __('PayHere not configured')], 400);
            }

            $user = auth()->user();
            $orderId = 'plan_' . $plan->id . '_' . $user->id . '_' . time();

            $paymentData = [
                'merchant_id' => $config['merchant_id'],
                'return_url' => route('payhere.success'),
                'cancel_url' => route('plans.index'),
                'notify_url' => route('payhere.callback'),
                'order_id' => $orderId,
                'items' => $plan->name . ' - ' . ucfirst($validated['billing_cycle']),
                'currency' => 'LKR',
                'amount' => number_format($pricing['final_price'], 2, '.', ''),
                'first_name' => $user->name ?? 'Customer',
                'last_name' => 'User',
                'email' => $user->email,
                'phone' => '+94771234567',
                'address' => 'No.1, Galle Road',
                'city' => 'Colombo',
                'country' => 'Sri Lanka',
            ];

            $hash = $this->generatePayHereHash($paymentData, $config['merchant_secret']);
            $paymentData['hash'] = $hash;

            $actionUrl = $config['mode'] === 'sandbox'
                ? 'https://sandbox.payhere.lk/pay/checkout'
                : 'https://www.payhere.lk/pay/checkout';

            return response()->json([
                'success' => true,
                'payment_data' => $paymentData,
                'action_url' => $actionUrl
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => __('Payment creation failed')], 500);
        }
    }

    /**
     * Handle PayHere success callback
     */
    public function success(Request $request)
    {
        try {
            $orderId = $request->input('order_id') ?? $request->input('merchant_order_id');
            $statusCode = $request->input('status_code') ?? $request->input('payhere_status_code');
            $paymentId = $request->input('payment_id') ?? $request->input('payhere_payment_id');

            if ($orderId) {
                $parts = explode('_', $orderId);

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
                            'payment_method' => 'payhere',
                            'payment_id' => $paymentId ?? $orderId,
                        ]);

                        return redirect()->route('plans.index')->with('success', __('Payment completed successfully and plan activated!'));
                    }
                }
            }

            return redirect()->route('plans.index')->with('error', __('Payment verification failed'));
        } catch (\Exception $e) {
            return redirect()->route('plans.index')->with('error', __('Payment processing failed'));
        }
    }

    /**
     * Handle PayHere callback
     */
    public function callback(Request $request)
    {
        try {
            $orderId = $request->input('order_id');
            $statusCode = $request->input('status_code');

            if ($orderId && $statusCode === '2') {
                $parts = explode('_', $orderId);

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
                            'payment_method' => 'payhere',
                            'payment_id' => $request->input('payment_id'),
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
