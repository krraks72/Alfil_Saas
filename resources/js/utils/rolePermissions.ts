// utils/rolePermissions.ts
export const getModulesFromNavigation = (userRole: string): string[] => {
  const superAdminModules = [
      'dashboard',
      'users',
      'roles',
      'permissions',
      'companies',
      'plans',
      'plan_requests',
      'plan_orders',
      'currencies',
      'referral',
      'coupons',
      'settings'
  ];

  const companyModules = [
     'dashboard',
      'users',
      'roles',
      'plans',
      'referral',
      'settings', // Limited settings for company users
      'branches',
      'cash_registers',
      'customers',
      'vendors',
      'brands',
      'categories',
      'taxes',
      'units',
      'products',
      'expense_categories',
      'expenses',
      'pos',
      'sales',
      'purchases',
      'reports',
  ];

  return (userRole === 'superadmin' || userRole === 'super admin') 
    ? superAdminModules 
    : companyModules;
};

export const filterPermissionsByRole = (permissions: Record<string, any[]>, userRole: string): Record<string, any[]> => {
  const allowedModules = getModulesFromNavigation(userRole);
  const filteredPermissions: Record<string, any[]> = {};

  Object.keys(permissions).forEach(module => {
    if (allowedModules.includes(module)) {
      filteredPermissions[module] = permissions[module];
    }
  });

  return filteredPermissions;
};