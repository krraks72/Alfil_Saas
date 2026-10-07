<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;
use net\authorize\api\contract\v1 as AnetAPI;
use net\authorize\api\controller as AnetController;

class AuthorizeNetPaymentController extends Controller
{
    // Supported countries and currencies for AuthorizeNet
    private const SUPPORTED_COUNTRIES = ['US', 'CA', 'GB', 'AU'];
    private const SUPPORTED_CURRENCIES = ['USD', 'CAD', 'CHF', 'DKK', 'EUR', 'GBP', 'NOK', 'PLN', 'SEK', 'AUD', 'NZD'];

    public function createPaymentForm(Request $request)
    {
        $validated = validatePaymentRequest($request);

        try {
            $plan = Plan::findOrFail($validated['plan_id']);
                $pricing = calculatePlanPricing($plan, $validated['coupon_code'] ?? null, $validated['billing_cycle']);
            $settings = getPaymentGatewaySettings();

            if (!isset($settings['payment_settings']['authorizenet_merchant_id']) ||
                !isset($settings['payment_settings']['authorizenet_transaction_key'])) {
                return response()->json(['error' => 'AuthorizeNet not properly configured'], 400);
            }

            // Get currency from settings or default to USD
            $currency = $settings['general_settings']['currency'] ?? 'USD';

            // Validate currency support
            if (!in_array($currency, self::SUPPORTED_CURRENCIES)) {
                $currency = 'USD';
            }

            return response()->json([
                'success' => true,
                'merchant_id' => $settings['payment_settings']['authorizenet_merchant_id'],
                'amount' => number_format($pricing['final_price'], 2, '.', ''),
                'currency' => $currency,
                'is_sandbox' => $settings['payment_settings']['authorizenet_mode'] === 'sandbox',
                'supported_countries' => self::SUPPORTED_COUNTRIES,
                'supported_currencies' => self::SUPPORTED_CURRENCIES,
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => __('Payment form creation failed')], 500);
        }
    }

    public function processPayment(Request $request)
    {
        if (!auth()->check()) {
            return back()->withErrors(['error' => __('Authentication required for payment processing')]);
        }

        $validated = validatePaymentRequest($request, [
            'card_number' => 'required|string',
            'expiry_month' => 'required|string|size:2',
            'expiry_year' => 'required|string|size:2',
            'cvv' => 'required|string|min:3|max:4',
            'cardholder_name' => 'required|string|min:2|max:50',
        ]);

        try {
            $plan = Plan::findOrFail($validated['plan_id']);
                $pricing = calculatePlanPricing($plan, $validated['coupon_code'] ?? null, $validated['billing_cycle']);
            $settings = getPaymentGatewaySettings();

            if (!isset($settings['payment_settings']['authorizenet_merchant_id']) ||
                !isset($settings['payment_settings']['authorizenet_transaction_key'])) {
                return back()->withErrors(['error' => __('AuthorizeNet not properly configured')]);
            }

            // Validate minimum amount (AuthorizeNet requires minimum $0.50)
            if ($pricing['final_price'] < 0.50) {
                return back()->withErrors(['error' => __('Minimum payment amount is $0.50')]);
            }

            $result = $this->createAuthorizeNetTransaction($validated, $pricing, $settings);

            \Log::info('AuthorizeNet payment result', [
                'result' => $result,
                'has_success_key' => isset($result['success']),
                'success_value' => $result['success'] ?? 'not_set'
            ]);

            if (isset($result['success']) && $result['success']) {
                processPaymentSuccess([
                    'user_id' => auth()->id(),
                    'plan_id' => $plan->id,
                    'billing_cycle' => $validated['billing_cycle'],
                    'payment_method' => 'authorizenet',
                    'coupon_code' => $validated['coupon_code'] ?? null,
                    'payment_id' => $result['transaction_id'] ?? null,
                ]);

                return back()->with('success', __('Payment successful and plan activated'));
            }

            return back()->withErrors(['error' => $result['error'] ?? __('Payment processing failed')]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return back()->withErrors(['error' => __('Invoice not found. Please check the link and try again.')]);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => __('Payment processing failed. Please try again or contact support.')]);
        }
    }

    private function createAuthorizeNetTransaction($paymentData, $pricing, $settings)
    {
        try {
            $merchantId = $settings['payment_settings']['authorizenet_merchant_id'];
            $transactionKey = $settings['payment_settings']['authorizenet_transaction_key'];
            $environment = $settings['payment_settings']['authorizenet_mode'] ?? 'sandbox';

            // Merchant Authentication
            $merchantAuthentication = new AnetAPI\MerchantAuthenticationType();
            $merchantAuthentication->setName($merchantId);
            $merchantAuthentication->setTransactionKey($transactionKey);

            // Credit Card
            $creditCard = new AnetAPI\CreditCardType();
            $creditCard->setCardNumber(str_replace(' ', '', $paymentData['card_number']));
            $creditCard->setExpirationDate('20' . $paymentData['expiry_year'] . '-' . $paymentData['expiry_month']);
            $creditCard->setCardCode($paymentData['cvv']);

            // Payment
            $paymentOne = new AnetAPI\PaymentType();
            $paymentOne->setCreditCard($creditCard);

            // Transaction Request
            $transactionRequestType = new AnetAPI\TransactionRequestType();
            $transactionRequestType->setTransactionType('authCaptureTransaction');
            $transactionRequestType->setAmount($pricing['final_price']);
            $transactionRequestType->setPayment($paymentOne);

            // Create Transaction Request
            $request = new AnetAPI\CreateTransactionRequest();
            $request->setMerchantAuthentication($merchantAuthentication);
            $request->setTransactionRequest($transactionRequestType);

            // Execute
            $controller = new AnetController\CreateTransactionController($request);
            $apiEnvironment = ($environment === 'sandbox') 
                ? \net\authorize\api\constants\ANetEnvironment::SANDBOX 
                : \net\authorize\api\constants\ANetEnvironment::PRODUCTION;

            $response = $controller->executeWithApiResponse($apiEnvironment);

            if ($response && $response->getMessages()->getResultCode() == 'Ok') {
                $tresponse = $response->getTransactionResponse();
                if ($tresponse && $tresponse->getResponseCode() == '1') {
                    return [
                        'success' => true,
                        'transaction_id' => $tresponse->getTransId(),
                        'error' => null
                    ];
                }
            }

            $errorMessage = 'Transaction failed';
            if ($response && $response->getMessages()->getMessage()) {
                $messages = $response->getMessages()->getMessage();
                if (is_array($messages) && count($messages) > 0) {
                    $errorMessage = $messages[0]->getText();
                }
            }

            return [
                'success' => false,
                'error' => $errorMessage,
                'transaction_id' => null
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Payment processing failed: ' . $e->getMessage(),
                'transaction_id' => null
            ];
        }
    }

    private function handleAuthorizeNetResponse($response)
    {
        if ($response === null) {
            return [
                'success' => false,
                'error' => __('No response received from payment gateway'),
                'transaction_id' => null
            ];
        }

        $messages = $response->getMessages();

        if ($messages->getResultCode() !== 'Ok') {
            $errorMessage = __('Payment gateway error');
            $messageArray = $messages->getMessage();
            if ($messageArray && is_array($messageArray) && count($messageArray) > 0) {
                $errorMessage = $messageArray[0]->getText();
            }

            \Log::error('AuthorizeNet API error', [
                'result_code' => $messages->getResultCode(),
                'error_message' => $errorMessage
            ]);

            return [
                'success' => false,
                'error' => $this->getFriendlyErrorMessage($errorMessage),
                'transaction_id' => null
            ];
        }

        $tresponse = $response->getTransactionResponse();

        if ($tresponse === null) {
            return [
                'success' => false,
                'error' => __('Invalid transaction response'),
                'transaction_id' => null
            ];
        }

        $responseCode = $tresponse->getResponseCode();

        // Response codes: 1 = Approved, 2 = Declined, 3 = Error, 4 = Held for Review
        switch ($responseCode) {
            case '1': // Approved
                $transactionId = $tresponse->getTransId();
                \Log::info('AuthorizeNet transaction approved', [
                    'transaction_id' => $transactionId,
                    'transaction_id_type' => gettype($transactionId),
                    'response_code' => $responseCode,
                    'raw_response' => $tresponse
                ]);

                // If transaction ID is 0 or null, generate a fallback ID
                if (!$transactionId || $transactionId === '0' || $transactionId === 0) {
                    $transactionId = 'authnet_' . time() . '_' . uniqid();
                    \Log::warning('AuthorizeNet returned invalid transaction ID, using fallback', [
                        'original_id' => $tresponse->getTransId(),
                        'fallback_id' => $transactionId
                    ]);
                }

                return [
                    'success' => true,
                    'error' => null,
                    'transaction_id' => $transactionId
                ];

            case '2': // Declined
                $errorMessage = 'Transaction declined';
                $errors = $tresponse->getErrors();
                if ($errors && is_array($errors) && count($errors) > 0) {
                    $errorMessage = $errors[0]->getErrorText();
                }

                \Log::warning('AuthorizeNet transaction declined', [
                    'response_code' => $responseCode,
                    'error_message' => $errorMessage,
                    'transaction_id' => $tresponse->getTransId()
                ]);

                return [
                    'success' => false,
                    'error' => $this->getFriendlyErrorMessage($errorMessage),
                    'transaction_id' => null
                ];

            case '3': // Error
                $errorMessage = 'Transaction error';
                $errors = $tresponse->getErrors();
                if ($errors && is_array($errors) && count($errors) > 0) {
                    $errorMessage = $errors[0]->getErrorText();
                }

                return [
                    'success' => false,
                    'error' => $this->getFriendlyErrorMessage($errorMessage),
                    'transaction_id' => null
                ];

            case '4': // Held for Review
                return [
                    'success' => false,
                    'error' => __('Transaction is being reviewed. Please contact support.'),
                    'transaction_id' => $tresponse->getTransId()
                ];

            default:
                return [
                    'success' => false,
                    'error' => __('Unknown transaction response'),
                    'transaction_id' => null
                ];
        }
    }

    private function getFriendlyErrorMessage($errorMessage)
    {
        $friendlyMessages = [
            __('The credit card number is invalid') => __('Please check your card number and try again.'),
            __('The credit card has expired') => __('Your card has expired. Please use a different card.'),
            __('The credit card expiration date is invalid') => __('Please check the expiration date and try again.'),
            __('The transaction cannot be found') => __('Transaction not found. Please try again.'),
            __('A duplicate transaction has been submitted') => __('This transaction was already processed.'),
            __('The amount is invalid') => __('Invalid payment amount.'),
            __('This transaction has been declined') => __('Your card was declined. Please try a different payment method.'),
            __('Insufficient funds') => __('Insufficient funds. Please try a different card.'),
            __('The merchant does not accept this type of credit card') => __('This card type is not accepted.'),
            __('The transaction has been declined because of an AVS mismatch') => __('Address verification failed. Please check your billing address.'),
            __('The transaction has been declined because the CVV2 value is invalid') => __('Invalid security code. Please check your CVV.'),
        ];

        foreach ($friendlyMessages as $original => $friendly) {
            if (stripos($errorMessage, $original) !== false) {
                return $friendly;
            }
        }

        return $errorMessage;
    }
    /**
     * Test AuthorizeNet connection and credentials
     */
    public function testConnection(Request $request)
    {
        try {
            $settings = getPaymentGatewaySettings();

            if (!isset($settings['payment_settings']['authorizenet_merchant_id']) ||
                !isset($settings['payment_settings']['authorizenet_transaction_key'])) {
                return response()->json([
                    'success' => false,
                    'message' => __('AuthorizeNet credentials not configured')
                ]);
            }

            // Test with AuthenticateTest API call
            $merchantAuthentication = new AnetAPI\MerchantAuthenticationType();
            $merchantAuthentication->setName($settings['payment_settings']['authorizenet_merchant_id']);
            $merchantAuthentication->setTransactionKey($settings['payment_settings']['authorizenet_transaction_key']);

            $request = new AnetAPI\AuthenticateTestRequest();
            $request->setMerchantAuthentication($merchantAuthentication);

            $controller = new AnetController\AuthenticateTestController($request);

            $environment = ($settings['payment_settings']['authorizenet_mode'] === 'sandbox')
                ? \net\authorize\api\constants\ANetEnvironment::SANDBOX
                : \net\authorize\api\constants\ANetEnvironment::PRODUCTION;

            $response = $controller->executeWithApiResponse($environment);

            if ($response && $response->getMessages()->getResultCode() === 'Ok') {
                return response()->json([
                    'success' => true,
                    'message' => __('AuthorizeNet connection successful'),
                    'mode' => $settings['payment_settings']['authorizenet_mode']
                ]);
            } else {
                $errorMessage = __('Connection failed');
                if ($response && $response->getMessages()->getMessage()) {
                    $messageArray = $response->getMessages()->getMessage();
                    if (is_array($messageArray) && count($messageArray) > 0) {
                        $errorMessage = $messageArray[0]->getText();
                    }
                }

                return response()->json([
                    'success' => false,
                    'message' => $errorMessage
                ]);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => __('Connection test failed: ') . $e->getMessage()
            ]);
        }
    }
}
