import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listCharges, createRecurringCharge, setBill, markPaid, RecurringChargeCreateRequest } from './api';

export function useCharges(houseId: number, period: string) {
  return useQuery({
    queryKey: ['charges', houseId, period],
    queryFn: () => listCharges(houseId, period),
    enabled: !!houseId && !!period,
  });
}

export function useCreateRecurringCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RecurringChargeCreateRequest) => createRecurringCharge(body),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: ['charges', variables.houseId] });
    },
  });
}

export function useSetBill(houseId: number, period: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cycleId, payload }: { cycleId: number; payload: { billDate: string; billNumber?: string; billDocumentUrl: string; totalAmount: number; } }) => setBill(cycleId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['charges', houseId, period] });
    },
  });
}

export function useMarkPaid(houseId: number, period: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cycleId, payload }: { cycleId: number; payload: { paidDate: string; externalReceiptUrl: string; } }) => markPaid(cycleId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['charges', houseId, period] });
    },
  });
}


