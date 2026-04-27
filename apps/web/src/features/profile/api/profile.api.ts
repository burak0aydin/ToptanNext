import { requestJson } from '@/lib/api';

export type UserProfile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  isLogisticsPartner: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateUserProfilePayload = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

export async function fetchUserProfile(): Promise<UserProfile> {
  return requestJson<UserProfile>('/users/profile', {
    auth: true,
  });
}

export async function updateUserProfile(payload: UpdateUserProfilePayload): Promise<UserProfile> {
  return requestJson<UserProfile, UpdateUserProfilePayload>('/users/profile', {
    method: 'PATCH',
    auth: true,
    body: payload,
  });
}
