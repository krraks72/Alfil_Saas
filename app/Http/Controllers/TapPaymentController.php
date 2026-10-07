<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Http\Request;

class TapPaymentController extends Controller
{
     public function createPayment(Request $request)
    {
        $validated = validatePaymentRequest($request);

        try {
            $plan = Plan::findOrFail($validated['plan_id']);
            $pricing = calculatePlanPricing($plan, $validated['coupon_code'] ?? null, $validated['billing_cycle']);
            $settings = getPaymentGatewaySettings();

            if (!isset($settings['payment_settings']['tap_secret_key'])) {
                return response()->json(['error' => __('Tap not configured')], 400);
            }

            $user = auth()->user();
            $transactionId = 'plan_' . $plan->id . '_' . $user->id . '_' . time();
            $baseUrl = config('app.url');

            // Initialize Tap Payment library
            require_once app_path('Libraries/Tap/Tap.php');
            require_once app_path('Libraries/Tap/Reference.php');
            require_once app_path('Libraries/Tap/Payment.php');

            $tap = new \App\Package\Payment([
                'company_tap_secret_key' => $settings['payment_settings']['tap_secret_key']
            ]);

            $chargeData = [
                'amount' => $pricing['final_price'],
                'currency' => 'USD',
                'threeDSecure' => true,
                'description' => 'Plan: ' . $plan->name . ' - ' . ucfirst($validated['billing_cycle']),
                'statement_descriptor' => 'Plan Subscription',
                'customer' => [
                    'first_name' => $user->name ?? 'Customer',
                    'email' => $user->email,
                ],
                'source' => ['id' => 'src_card'],
                'post' => ['url' => $baseUrl . '/payments/tap/callback'],
                'redirect' => ['url' => $baseUrl . '/payments/tap/success?' . http_build_query([
                    'plan_id' => $plan->id,
                    'user_id' => $user->id,
                    'billing_cycle' => $validated['billing_cycle'],
                    'coupon_code' => $validated['coupon_code'] ?? ''
                ])]
            ];

            \Log::info('Tap charge data:', $chargeData);
            
            $result = $tap->charge($chargeData, false);
            
            \Log::info('Tap charge result:', ['result' => $result]);

            if (isset($result->transaction->url)) {
                return response()->json([
                    'success' => true,
                    'redirect_url' => $result->transaction->url,
                    'charge_id' => $result->id
                ]);
            }

            return response()->json(['error' => __('Payment creation failed'), 'result' => $result], 500);
        } catch (\Exception $e) {
            \Log::error('Tap payment error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'plan_id' => $validated['plan_id'] ?? null,
                'user_id' => auth()->id()
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    public function success(Request $request)
    {
        try {
            $chargeId = $request->input('tap_id');
            $planId = $request->input('plan_id');
            $userId = $request->input('user_id');
            $billingCycle = $request->input('billing_cycle', 'monthly');
            $couponCode = $request->input('coupon_code');

            if ($chargeId && $planId && $userId) {
                $plan = Plan::find($planId);
                $user = User::find($userId);

                if ($plan && $user) {
                    processPaymentSuccess([
                        'user_id' => $user->id,
                        'plan_id' => $plan->id,
                        'billing_cycle' => $billingCycle,
                        'payment_method' => 'tap',
                        'coupon_code' => $couponCode,
                        'payment_id' => $chargeId,
                    ]);

                    if (!auth()->check()) {
                        auth()->login($user);
                    }

                    return redirect()->route('plans.index')->with('success', __('Payment completed successfully and plan activated'));
                }
            }

            return redirect()->route('plans.index')->with('error', __('Payment verification failed'));
        } catch (\Exception $e) {
            return redirect()->route('plans.index')->with('error', __('Payment processing failed: ' . $e->getMessage()));
        }
    }
    public function callback(Request $request)
    {
        try {
            $chargeId = $request->input('tap_id');
            $status = $request->input('status');
            return response('OK', 200);
        } catch (\Exception $e) {
            return response('Error', 500);
        }
    }
}
