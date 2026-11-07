export type SalesContract = {
  id: string;
  manager: string;
  contractNumber: string;
  type: string;
  addon: boolean;
  mobileTransfer: boolean;
  amount: number;
  dateLabel: string;
  periodStart: string | null;
  periodEnd: string | null;
  datePrecision: 'day' | 'range';
  sourceSheet: string;
  sourceRow: number;
  monthKey: string;
};

export type DashboardFilters = {
  manager: string;
  period: 'latest' | 'previous' | 'all';
  type: 'all' | string;
};
