import { useQuery } from '@tanstack/react-query';
import { getBillsByHouse, getBillsByHouseAndType, getBillById } from './api';

export function useBillsByHouse(houseId: number) {
  return useQuery({
    queryKey: ['bills', 'house', houseId],
    queryFn: () => getBillsByHouse(houseId),
    enabled: !!houseId,
  });
}

export function useBillsByHouseAndType(houseId: number, utilityType: number) {
  return useQuery({
    queryKey: ['bills', 'house', houseId, 'type', utilityType],
    queryFn: () => getBillsByHouseAndType(Number(houseId), Number(utilityType)),
    enabled: Number(houseId) > 0 && Number(utilityType) > 0,
  });
}

export function useBillById(billId: number) {
  return useQuery({
    queryKey: ['bills', 'id', billId],
    queryFn: () => getBillById(billId),
    enabled: !!billId,
  });
}
