import React from 'react';
import PlanForm from './form';

interface Plan {
  id: number;
  name: string;
  price: number;
  yearly_price: number | null;
  duration: string;
  description: string | null;
  total_customers: number;
  total_vendors: number;
  max_users: number;
  storage_limit: number;
  enable_chatgpt: string;
  themes: string[] | null;
  is_trial: string | null;
  trial_day: number;
  is_plan_enable: string;
  is_default: boolean;
  commerce_type_id: number;
}

interface Props {
  plan: Plan;
  otherDefaultPlanExists: boolean;
  commerceTypes: Array<{ id: number; name: string }>;
}

export default function EditPlan({ plan, otherDefaultPlanExists, commerceTypes }: Props) {
  return <PlanForm plan={plan} otherDefaultPlanExists={otherDefaultPlanExists} commerceTypes={commerceTypes} />;
}