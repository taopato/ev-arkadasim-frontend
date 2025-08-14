import { useMutation } from '@tanstack/react-query';
import { login, sendVerificationCode, verifyCodeAndRegister, verifyCodeForReset, resetPassword } from './api';
import { tokenStorage } from '../../../shared/auth/token';
import type { LoginRequest } from '../../../entities/user/model';

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
    onSuccess: async (response) => {
      if (response?.token) {
        await tokenStorage.setToken(response.token);
        await tokenStorage.setUser(response.user);
      }
    },
  });
}

export function useSendVerificationCode() {
  return useMutation({
    mutationFn: (email: string) => sendVerificationCode(email),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: ({ email, code, fullName, password }: {
      email: string;
      code: string;
      fullName: string;
      password: string;
    }) => verifyCodeAndRegister(email, code, fullName, password),
    onSuccess: async (response) => {
      if (response?.token) {
        await tokenStorage.setToken(response.token);
        await tokenStorage.setUser(response.user);
      }
    },
  });
}

export function useVerifyCodeForReset() {
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => verifyCodeForReset(email, code),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ email, code, newPassword }: {
      email: string;
      code: string;
      newPassword: string;
    }) => resetPassword(email, code, newPassword),
  });
}
