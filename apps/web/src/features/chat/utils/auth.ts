import { getAccessToken } from '@/lib/auth-token';

export function getCurrentUserIdFromToken(): string | null {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const normalized = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

    const decoded = JSON.parse(atob(normalized)) as { sub?: string };
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}
