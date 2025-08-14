import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getPaymentsByHouse, 
  getPendingPayments, 
  createPayment, 
  approvePayment, 
  rejectPayment 
} from './api';

export function usePaymentsByHouse(houseId: number) {
  return useQuery({
    queryKey: ['payments', 'house', houseId],
    queryFn: () => getPaymentsByHouse(houseId),
    enabled: !!houseId,
  });
}

export function usePendingPayments(userId: number) {
  return useQuery({
    queryKey: ['payments', 'pending', userId],
    queryFn: () => getPendingPayments(userId),
    enabled: !!userId,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPayment,
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['payments', 'house', variables.houseId] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'pending', variables.fromUserId] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'pending', variables.toUserId] });
    },
  });
}

export function useApprovePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: approvePayment,
    onSuccess: () => {
      // Invalidate all payment queries
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export function useRejectPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rejectPayment,
    onSuccess: () => {
      // Invalidate all payment queries
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}
