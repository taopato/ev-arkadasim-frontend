import { api } from '../../../shared/api/axios';
import { endpoints } from '../../../shared/api/endpoints';
import type { HouseSummary } from '../../../entities/house/model';

export async function getUserHouses(userId: number): Promise<HouseSummary[]> {
  const { data } = await api.get<HouseSummary[]>(endpoints.houses.getUserHouses(userId));
  return data;
}

export async function getHouseById(houseId: number): Promise<HouseSummary> {
  const { data } = await api.get<HouseSummary>(endpoints.houses.getById(houseId));
  return data;
}

export async function createHouse(name: string, creatorUserId: number): Promise<HouseSummary> {
  const { data } = await api.post<HouseSummary>(endpoints.houses.create, { name, creatorUserId });
  return data;
}
