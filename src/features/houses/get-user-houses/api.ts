import { api } from '../../../shared/api/axios';
import { endpoints } from '../../../shared/api/endpoints';
import type { HouseSummary } from '../../../entities/house/model';

export async function getUserHouses(userId: number): Promise<HouseSummary[]> {
  const { data } = await api.get<any>(endpoints.houses.getUserHouses(userId));
  const raw = (data?.data ?? data) as any[];
  if (!Array.isArray(raw)) return [];
  const normalized: HouseSummary[] = raw.map((h: any) => {
    const members = Array.isArray(h?.members) ? h.members : [];
    const memberCount = (
      h?.memberCount ?? h?.membersCount ?? h?.uyeSayisi ?? (Array.isArray(h?.memberIds) ? h.memberIds.length : undefined) ?? members.length ?? 0
    );
    return {
      id: Number(h?.id ?? h?.houseId),
      name: String(h?.name ?? h?.houseName ?? ''),
      memberCount: Number(memberCount) || 0,
      totalExpenses: typeof h?.totalExpenses === 'number' ? h.totalExpenses : undefined,
      lastActivity: h?.lastActivity ?? undefined,
    } as HouseSummary;
  });
  return normalized;
}

export async function getHouseById(houseId: number): Promise<HouseSummary> {
  const { data } = await api.get<HouseSummary>(endpoints.houses.getById(houseId));
  return data;
}

export async function createHouse(name: string, creatorUserId: number): Promise<HouseSummary> {
  const { data } = await api.post<HouseSummary>(endpoints.houses.create, { name, creatorUserId });
  return data;
}
