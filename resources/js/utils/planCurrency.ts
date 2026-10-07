// Plan-specific currency formatter that always uses super admin settings
export function formatPlanCurrency(amount: string | number): string {
  // Always use the formatted_price from backend if available
  // This ensures super admin currency settings are used for all plan prices
  return typeof amount === 'string' ? amount : amount.toString();
}

// Override formatCurrency specifically for plan components
export function createPlanCurrencyFormatter() {
  return {
    formatCurrency: (amount: string | number) => {
      // For plan prices, always return the amount as-is since backend handles formatting
      return typeof amount === 'string' ? amount : amount.toString();
    }
  };
}