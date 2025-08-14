import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getExpensesByHouse, 
  getExpenseById, 
  createExpense, 
  updateExpense, 
  deleteExpense 
} from './api';

export function useExpensesByHouse(houseId: number) {
  return useQuery({
    queryKey: ['expenses', 'house', houseId],
    queryFn: () => getExpensesByHouse(houseId),
    enabled: !!houseId,
  });
}

export function useExpenseById(expenseId: number) {
  return useQuery({
    queryKey: ['expenses', 'id', expenseId],
    queryFn: () => getExpenseById(expenseId),
    enabled: !!expenseId,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createExpense,
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['expenses', 'house', variables.houseId] });
      queryClient.invalidateQueries({ queryKey: ['houses', 'user', variables.kaydedenUserId] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ expenseId, expenseData }: { expenseId: number; expenseData: any }) => 
      updateExpense(expenseId, expenseData),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['expenses', 'id', variables.expenseId] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'house', data.houseId] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      // Invalidate all expense queries
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
