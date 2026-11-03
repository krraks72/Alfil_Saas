import React from 'react';
import PlanForm from './form';

interface Props {
  hasDefaultPlan: boolean;
  commerceTypes: Array<{ id: number; name: string }>;
}

export default function CreatePlan({ hasDefaultPlan, commerceTypes }: Props) {
  return <PlanForm hasDefaultPlan={hasDefaultPlan} commerceTypes={commerceTypes} />;
}