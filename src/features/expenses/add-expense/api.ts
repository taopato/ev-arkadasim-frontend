import { api } from '../../../shared/api/axios';
import { endpoints } from '../../../shared/api/endpoints';

export interface Expense {
  id: number;
  tur: string;
  tutar: number;
  houseId: number;
  odeyenUserId: number;
  kaydedenUserId: number;
  createdAt: string;
  updatedAt: string;
  odeyenUser?: {
    id: number;
    fullName: string;
    email: string;
  };
  kaydedenUser?: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface CreateExpenseRequest {
  tur: string;
  tutar: number;
  houseId: number;
  odeyenUserId: number;
  kaydedenUserId: number;
}

export interface UpdateExpenseRequest {
  tur?: string;
  tutar?: number;
  odeyenUserId?: number;
}

export async function getExpensesByHouse(houseId: number): Promise<Expense[]> {
  const { data } = await api.get<Expense[]>(`/Expenses/GetExpenses/${houseId}`);
  return data;
}

export async function getExpenseById(expenseId: number): Promise<Expense> {
  const { data } = await api.get<Expense>(`/Expenses/GetExpense/${expenseId}`);
  return data;
}

export async function createExpense(expenseData: CreateExpenseRequest): Promise<Expense> {
  const { data } = await api.post<Expense>('/Expenses/AddExpense', expenseData);
  return data;
}

export async function updateExpense(expenseId: number, expenseData: UpdateExpenseRequest): Promise<Expense> {
  const { data } = await api.put<Expense>(`/Expenses/UpdateExpense/${expenseId}`, expenseData);
  return data;
}

export async function deleteExpense(expenseId: number): Promise<void> {
  await api.delete(`/Expenses/DeleteExpense/${expenseId}`);
}
