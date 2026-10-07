<?php

if (!function_exists('formatPlanPrice')) {
    /**
     * Format plan price using super admin's currency settings
     */
    function formatPlanPrice($amount)
    {
        // Get super admin's currency settings
        $superAdmin = \App\Models\User::where('type', 'superadmin')->first();
        $currencyCode = getSetting('defaultCurrency', 'USD', $superAdmin?->id);
        $currency = \App\Models\Currency::where('code', $currencyCode)->first();
        $currencySymbol = $currency ? $currency->symbol : $currencyCode;
        $currencyPosition = getSetting('currencySymbolPosition', 'before', $superAdmin?->id);
        $currencySpace = getSetting('currencySymbolSpace', false, $superAdmin?->id);
        $decimalFormat = getSetting('decimalFormat', '2', $superAdmin?->id);
        
        // Format price with super admin's currency settings
        $space = $currencySpace ? ' ' : '';
        if ($currencyPosition === 'after') {
            return number_format($amount, (int)$decimalFormat) . $space . $currencySymbol;
        } else {
            return $currencySymbol . $space . number_format($amount, (int)$decimalFormat);
        }
    }
}