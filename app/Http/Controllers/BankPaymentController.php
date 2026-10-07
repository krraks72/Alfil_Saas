<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\User;
use App\Models\Setting;
use App\Models\PlanOrder;
use App\Models\PaymentSetting;
use Illuminate\Http\Request;

class BankPaymentController extends Controller
{
    public function processPayment(Request $request)
    {
        $validated = validatePaymentRequest($request, [
            'amount' => 'required|numeric|min:0',
            'receipt' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5048',
        ]);

        try {
            $plan = Plan::findOrFail($validated['plan_id']);

            $receiptPath = null;
            if (!IsDemo() && $request->hasFile('receipt')) {
                $file = $request->file('receipt');
                $fileName = 'receipt_' . auth()->id() . '_' . time() . '.' . $file->getClientOriginalExtension();
                $result = upload_file($request, 'receipt', $fileName, 'bank_receipts');
                if ($result['status']) {
                    $receiptPath = $result['url'];
                }
            }

            // $data = [
            //     'user_id' => auth()->id(),
            //     'plan_id' => $plan->id,
            //     'billing_cycle' => $validated['billing_cycle'],
            //     'payment_method' => 'bank',
            //     'coupon_code' => $validated['coupon_code'] ?? null,
            //     'payment_id' => 'BANK_' . strtoupper(uniqid()),
            //     'status' => 'pending',
            //     'receipt' => $receiptPath,
            // ];

            createPlanOrder([
                'user_id' => auth()->id(),
                'plan_id' => $plan->id,
                'billing_cycle' => $validated['billing_cycle'],
                'payment_method' => 'bank',
                'coupon_code' => $validated['coupon_code'] ?? null,
                'payment_id' => 'BANK_' . strtoupper(uniqid()),
                'status' => 'pending',
                'processed_at' => now(),
                'receipt' => $receiptPath,
            ]);

            // $plan = Plan::findOrFail($data['plan_id']);
            // $pricing = calculatePlanPricing($plan, $data['coupon_code'] ?? null, $data['billing_cycle'] ?? 'monthly');

            // PlanOrder::create([
            //     'user_id' => $data['user_id'],
            //     'plan_id' => $plan->id,
            //     'coupon_id' => $pricing['coupon_id'],
            //     'billing_cycle' => $data['billing_cycle'],
            //     'payment_method' => $data['payment_method'],
            //     'coupon_code' => $data['coupon_code'] ?? null,
            //     'original_price' => $pricing['original_price'],
            //     'discount_amount' => $pricing['discount_amount'],
            //     'final_price' => $pricing['final_price'],
            //     'payment_id' => $data['payment_id'],
            //     'status' => $data['status'] ?? 'pending',
            //     'ordered_at' => now(),
            //     'receipt' => $data['receipt'],
            //     'processed_at' => now(),
            // ]);

            return back()->with('success', __('Payment request submitted. Your plan will be activated after payment verification.'));

        } catch (\Exception $e) {
            return handlePaymentError($e, 'bank');
        }
    }
}