import { usePlanSync } from '../hooks/usePlanSync';

export function PlanSyncProvider({ children }: { children: React.ReactNode }) {
  usePlanSync();
  return <>{children}</>;
}
