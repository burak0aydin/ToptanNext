import type { LoginDto, RegisterDto } from '@toptannext/types';
import { postJson } from '@/lib/api';

export type AuthUser = {
  id: string;
  fullName: string | null;
  email: string;
  role: 'ADMIN' | 'SUPPLIER' | 'BUYER';
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export function register(payload: RegisterDto): Promise<AuthResponse> {
  return postJson<RegisterDto, AuthResponse>('/auth/register', payload);
}

export function login(payload: LoginDto): Promise<AuthResponse> {
  return postJson<LoginDto, AuthResponse>('/auth/login', payload);
}
