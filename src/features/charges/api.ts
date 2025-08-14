import { api } from '../../shared/api/axios';
import { endpoints } from '../../shared/api/endpoints';

export interface ChargeCycleDto {
  id: number;
  contractId: number;
  type: 'Rent' | 'Internet' | 'Electric' | 'Water' | 'Other';
  amountMode: 'Fixed' | 'Variable';
  period: string; // YYYY-MM
  totalAmount: number;
  perUserShares?: Array<{ userId: number; amount: number }>;
  status: 'AwaitingBill' | 'Open' | 'Collecting' | 'Funded' | 'Paid' | 'Overdue';
  billDate?: string | null;
  dueDate?: string | null;
  fundedAmount: number;
}

export interface RecurringChargeCreateRequest {
  houseId: number;
  type: 'Rent' | 'Internet' | 'Electric' | 'Water' | 'Other';
  payerUserId: number;
  amountMode: 'Fixed' | 'Variable';
  fixedAmount?: number | null;
  splitPolicy: 'Equal' | 'Weight';
  weights?: Record<string, number> | null;
  dueDay?: number | null;
  paymentWindowDays?: number | null;
  startMonth: string; // YYYY-MM
  isActive: boolean;
}

export async function listCharges(houseId: number, period: string) {
  const { data } = await api.get(endpoints.charges.list(houseId, period));
  return data?.data ?? data;
}

export async function createRecurringCharge(body: RecurringChargeCreateRequest) {
  const { data } = await api.post(endpoints.recurringCharges.create, body);
  return data;
}

export async function setBill(cycleId: number, payload: { billDate: string; billNumber?: string; billDocumentUrl: string; totalAmount: number; }) {
  const { data } = await api.post(endpoints.charges.setBill(cycleId), payload);
  return data;
}

export async function markPaid(cycleId: number, payload: { paidDate: string; externalReceiptUrl: string; }) {
  const { data } = await api.post(endpoints.charges.markPaid(cycleId), payload);
  return data;
}


