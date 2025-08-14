import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserHouses, getHouseById, createHouse } from './api';

export function useUserHouses(userId: number) {
  return useQuery({
    queryKey: ['houses', 'user', userId],
    queryFn: () => getUserHouses(userId),
    enabled: !!userId,
  });
}

export function useHouseById(houseId: number) {
  return useQuery({
    queryKey: ['houses', 'detail', houseId],
    queryFn: () => getHouseById(houseId),
    enabled: !!houseId,
  });
}

export function useCreateHouse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ name, creatorUserId }: { name: string; creatorUserId: number }) => 
      createHouse(name, creatorUserId),
    onSuccess: (_, { creatorUserId }) => {
      // Kullanıcının ev listesini yenile
      queryClient.invalidateQueries({ queryKey: ['houses', 'user', creatorUserId] });
    },
  });
}
