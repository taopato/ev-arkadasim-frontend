import { api } from '../../../shared/api/axios';
import { endpoints } from '../../../shared/api/endpoints';

export interface Payment {
  id: number;
  amount: number;
  description: string;
  fromUserId: number;
  toUserId: number;
  houseId: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  updatedAt: string;
  fromUser?: {
    id: number;
    fullName: string;
    email: string;
  };
  toUser?: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface CreatePaymentRequest {
  amount: number;
  description: string;
  fromUserId: number;
  toUserId: number;
  houseId: number;
}

export interface PaymentAllocation {
  expenseId: number;
  amount: number;
}

export interface CreatePaymentWithAllocationsRequest {
  payment: CreatePaymentRequest;
  allocations: PaymentAllocation[];
}

export async function getPaymentsByHouse(houseId: number): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>(endpoints.payments.getByHouse(houseId));
  return data;
}

export async function getPendingPayments(userId: number): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>(endpoints.payments.getPendingPayments(userId));
  return data;
}

export async function createPayment(paymentData: CreatePaymentRequest): Promise<Payment> {
  const { data } = await api.post<Payment>(endpoints.payments.create, paymentData);
  return data;
}

export async function createPaymentWithAllocations(request: CreatePaymentWithAllocationsRequest): Promise<Payment> {
  const { data } = await api.post<Payment>(endpoints.payments.addPaymentWithAllocations, request);
  return data;
}

export async function approvePayment(paymentId: number): Promise<void> {
  await api.post(endpoints.payments.approvePayment(paymentId));
}

export async function rejectPayment(paymentId: number): Promise<void> {
  await api.post(endpoints.payments.rejectPayment(paymentId));
}
