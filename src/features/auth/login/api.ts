import { api } from '../../../shared/api/axios';
import { endpoints } from '../../../shared/api/endpoints';
import type { LoginRequest, AuthResponse } from '../../../entities/user/model';

export async function login(body: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>(endpoints.auth.login, body);
  return data;
}

export async function sendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post(endpoints.auth.sendVerificationCode, { email });
  return data;
}

export async function verifyCodeAndRegister(
  email: string,
  code: string,
  fullName: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>(endpoints.auth.verifyCodeAndRegister, {
    email,
    code,
    fullName,
    password,
  });
  return data;
}

export async function verifyCodeForReset(email: string, code: string): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post(endpoints.auth.verifyCodeForReset, { email, code });
  return data;
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post(endpoints.auth.resetPassword, {
    email,
    code,
    newPassword,
  });
  return data;
}
