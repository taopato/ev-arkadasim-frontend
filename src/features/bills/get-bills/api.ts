import { api } from '../../../shared/api/axios';
import { endpoints } from '../../../shared/api/endpoints';

export interface Bill {
  id: number;
  title: string;
  amount: number;
  dueDate: string;
  utilityType: number;
  houseId: number;
  isPaid: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBillRequest {
  title: string;
  amount: number;
  dueDate: string;
  utilityType: number;
  houseId: number;
  description?: string;
}

export interface UpdateBillRequest {
  title?: string;
  amount?: number;
  dueDate?: string;
  utilityType?: number;
  description?: string;
}

export async function getBillsByHouse(houseId: number): Promise<Bill[]> {
  // Önce olası RESTful sorgu parametreli endpoint'i dene
  try {
    const { data } = await api.get<Bill[]>(`/Bills?houseId=${houseId}`);
    return data;
  } catch (error: any) {
    const status = error?.response?.status;
    const msg = String(error?.message || '');
    const isNotSupported = status === 404 || status === 405 || msg.includes('404') || msg.includes('405');
    if (!isNotSupported) throw error;
  }

  // Birincil endpoint (eski sürümler)
  try {
    const { data } = await api.get<Bill[]>(endpoints.bills.getByHouse(houseId));
    return data;
  } catch (error: any) {
    const status = error?.response?.status;
    const msg = String(error?.message || '');
    const isNotSupported = status === 404 || status === 405 || msg.includes('404') || msg.includes('405');
    if (!isNotSupported) throw error;
  }

  // Alternatif endpoint denemeleri (bazı backend sürümleri farklı yollar kullanabilir)
  const candidateUrls: string[] = [
    `/Bills?houseId=${houseId}`,
    `/Bills/GetByHouse/${houseId}`,
    `/Bills/by-house/${houseId}`,
    `/Bills/ByHouse/${houseId}`,
    `/Bills/house/${houseId}`,
    `/Bills/list?houseId=${houseId}`,
  ];

  for (const url of candidateUrls) {
    try {
      const { data } = await api.get<Bill[]>(url);
      return data;
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = String(err?.message || '');
      const isNotSupported = status === 404 || status === 405 || msg.includes('404') || msg.includes('405');
      if (isNotSupported) {
        continue;
      }
      throw err;
    }
  }

  // Son çare: recent endpoint'i deneyip geniş bir limit al, sonra filtreleme üst katmanda yapılır
  try {
    // 200 kayıt yeterli bir tampon olabilir
    // Not: Bu fonksiyon type filtresi olmayan fallback olarak kullanılıyor
    // (üst fonksiyonlar gerekirse utilityType ile filtreleyecek)
    // Eğer backend bu endpoint'i sağlamıyorsa, catch ile yutulacak.
    // @ts-ignore - endpoints tipleriyle uyumlu
    const { data } = await api.get<Bill[]>(endpoints.bills.getRecent(houseId as unknown as number, 200));
    return data.filter((b) => Number(b.houseId) === Number(houseId));
  } catch {}

  // Hepsi 404 ise, boş dizi döndürüp ekranın boş halini göstermesine izin verelim
  return [];
}

export async function getBillsByHouseAndType(houseId: number, utilityType: number): Promise<Bill[]> {
  // Önce olası RESTful sorgu parametreli endpoint'i dene
  try {
    const { data } = await api.get<Bill[]>(`/Bills?houseId=${houseId}&utilityType=${utilityType}`);
    return data;
  } catch (error: any) {
    const status = error?.response?.status;
    const msg = String(error?.message || '');
    const isNotSupported = status === 404 || status === 405 || msg.includes('404') || msg.includes('405');
    if (!isNotSupported) throw error;
  }

  // Eski sürüm endpoint
  try {
    const { data } = await api.get<Bill[]>(endpoints.bills.getByHouseAndType(houseId, utilityType));
    return data;
  } catch (error: any) {
    // Bazı backend sürümlerinde bu endpoint bulunmayabilir. 404 aldığımızda
    // tüm faturaları çekip utilityType'a göre istemci tarafında filtreleyelim.
    const status = error?.response?.status;
    const msg = String(error?.message || '');
    const isNotSupported = status === 404 || status === 405 || msg.includes('404') || msg.includes('405');
    if (isNotSupported) {
      const allBills = await getBillsByHouse(houseId);
      return allBills.filter((b) => Number(b.utilityType) === Number(utilityType));
    }
    throw error;
  }
}

export async function getBillById(billId: number): Promise<Bill> {
  try {
    const { data } = await api.get<Bill>(endpoints.bills.getById(billId));
    return data;
  } catch (error: any) {
    const is404 = error?.response?.status === 404 || String(error?.message || '').includes('404');
    if (!is404) throw error;
  }

  const candidateUrls: string[] = [
    `/Bills/${billId}`,
  ];
  for (const url of candidateUrls) {
    try {
      const { data } = await api.get<Bill>(url);
      return data;
    } catch (err: any) {
      const is404 = err?.response?.status === 404 || String(err?.message || '').includes('404');
      if (is404) {
        continue;
      }
      throw err;
    }
  }
  throw new Error('Bill not found');
}

export async function createBill(billData: CreateBillRequest): Promise<Bill> {
  const { data } = await api.post<Bill>(endpoints.bills.create, billData);
  return data;
}

export async function updateBill(billId: number, billData: UpdateBillRequest): Promise<Bill> {
  const { data } = await api.put<Bill>(endpoints.bills.update(billId), billData);
  return data;
}

export async function deleteBill(billId: number): Promise<void> {
  await api.delete(endpoints.bills.delete(billId));
}

export async function finalizeBill(billId: number, requestUserId: number): Promise<void> {
  await api.post(endpoints.bills.finalize(billId, requestUserId));
}

export async function uploadBillDocument(billId: number, file: File, requestUserId: number): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  await api.post(endpoints.bills.uploadDocument(billId, requestUserId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
