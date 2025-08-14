// Expense entity model
export interface Expense {
  id: number;
  title: string;
  amount: number;
  description?: string;
  category: string;
  houseId: number;
  paidByUserId: number;
  paidByUserName: string;
  createdAt: string;
  updatedAt?: string;
  allocations?: ExpenseAllocation[];
}

// Expense allocation model
export interface ExpenseAllocation {
  id: number;
  expenseId: number;
  userId: number;
  userName: string;
  amount: number;
  percentage: number;
}

// Create expense request
export interface CreateExpenseRequest {
  title: string;
  amount: number;
  description?: string;
  category: string;
  houseId: number;
  paidByUserId: number;
  allocations: {
    userId: number;
    amount: number;
    percentage: number;
  }[];
}

// Update expense request
export interface UpdateExpenseRequest {
  title?: string;
  amount?: number;
  description?: string;
  category?: string;
  allocations?: {
    userId: number;
    amount: number;
    percentage: number;
  }[];
}

// Expense category
export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}
