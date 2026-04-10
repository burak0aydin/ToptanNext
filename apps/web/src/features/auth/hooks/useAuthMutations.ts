import { useMutation } from '@tanstack/react-query';
import type { LoginDto, RegisterDto } from '@toptannext/types';
import { login, register } from '../api/auth.api';

export const authMutationKeys = {
  login: ['auth', 'login'] as const,
  register: ['auth', 'register'] as const,
};

export function useLoginMutation() {
  return useMutation({
    mutationKey: authMutationKeys.login,
    mutationFn: (payload: LoginDto) => login(payload),
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationKey: authMutationKeys.register,
    mutationFn: (payload: RegisterDto) => register(payload),
  });
}
