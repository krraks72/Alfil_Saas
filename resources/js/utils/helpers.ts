import { usePage } from '@inertiajs/react';

export const isUserRegistrationEnabled = (): boolean => {
  try {
    if (typeof window !== 'undefined' && (window as any).page?.props) {
      const settings = (window as any).page.props.globalSettings || {};
      const registrationEnabled = settings.registrationEnabled;
      return registrationEnabled === true || registrationEnabled === '1' || registrationEnabled === 1 || registrationEnabled === 'true';
    }
    return true;
  } catch {
    return true;
  }
};
const getImagePath = (path: string, pageProps?: any): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // If path already contains storage/media, just prepend domain
  if (path.includes('storage/media')) {
    return path.startsWith('/') ? `${window.location.origin}${path}` : `${window.location.origin}/${path}`;
  }

  try {
    const props = pageProps || usePage().props;
    const dynamicPath = `${(props as any).globalSettings?.base_url || window.location.origin}/storage/media/`;
    let imageUrlPrefix = (props as any).imageUrlPrefix || dynamicPath;

    if (!imageUrlPrefix.includes('storage/media')) {
      imageUrlPrefix = imageUrlPrefix.endsWith('/') ? imageUrlPrefix + 'storage/media/' : imageUrlPrefix + '/storage/media/';
    }

    // Handle slash concatenation
    const prefixEndsWithSlash = imageUrlPrefix.endsWith('/');
    const pathStartsWithSlash = path.startsWith('/');

    if (prefixEndsWithSlash && pathStartsWithSlash) {
      return imageUrlPrefix + path.substring(1);
    } else if (!prefixEndsWithSlash && !pathStartsWithSlash) {
      return imageUrlPrefix + '/' + path;
    } else {
      return imageUrlPrefix + path;
    }
  }
  catch {
    const fallbackPrefix = `${window.location.origin}/${window.location.pathname.split('/')[1]}/storage/media/`;
    return path.startsWith('/') ? fallbackPrefix + path.substring(1) : fallbackPrefix + path;
  }
}

export const getSeoImagePath = (path: string, pageProps?: any): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // If path already contains storage/media, just prepend domain
  if (path.includes('storage/')) {
    return path.startsWith('/') ? `${window.location.origin}${path}` : `${window.location.origin}/${path}`;
  }

  try {
    const props = pageProps || usePage().props;
    const dynamicPath = `${(props as any).globalSettings?.base_url || window.location.origin}/storage/`;
    let imageUrlPrefix = (props as any).imageUrlPrefix || dynamicPath;

    if (!imageUrlPrefix.includes('storage/')) {
      imageUrlPrefix = imageUrlPrefix.endsWith('/') ? imageUrlPrefix + 'storage/' : imageUrlPrefix + '/storage/';
    }

    // Handle slash concatenation
    const prefixEndsWithSlash = imageUrlPrefix.endsWith('/');
    const pathStartsWithSlash = path.startsWith('/');

    if (prefixEndsWithSlash && pathStartsWithSlash) {
      return imageUrlPrefix + path.substring(1);
    } else if (!prefixEndsWithSlash && !pathStartsWithSlash) {
      return imageUrlPrefix + '/' + path;
    } else {
      return imageUrlPrefix + path;
    }
  }
  catch {
    const fallbackPrefix = `${window.location.origin}/${window.location.pathname.split('/')[1]}/storage/`;
    return path.startsWith('/') ? fallbackPrefix + path.substring(1) : fallbackPrefix + path;
  }
}
// Currency formatting function
export const formatCurrency = (amount: string | number, useSuperAdminSettings = false) => {
  if (typeof window !== 'undefined' && window.appSettings?.formatCurrency) {
    const numericAmount =
      typeof amount === 'number' ? amount : parseFloat(amount);

    if (useSuperAdminSettings && window.appSettings?.formatCurrencyWithSuperAdminSettings) {
      return window.appSettings.formatCurrencyWithSuperAdminSettings(numericAmount, { showSymbol: true });
    }

    return window.appSettings.formatCurrency(numericAmount, { showSymbol: true });
  }
  return amount;
};

export const formatCurrencyForPlansAndReferrals = (amount: string | number) => {
  if (typeof window !== 'undefined' && window.appSettings?.formatCurrencyWithSuperAdminSettings) {
    const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    return window.appSettings.formatCurrencyWithSuperAdminSettings(numericAmount, { showSymbol: true });
  }
  return formatCurrency(amount);
};


export {
  getImagePath,
}