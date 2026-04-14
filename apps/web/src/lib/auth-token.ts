const ACCESS_TOKEN_KEY = 'toptannext_access_token';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const rawValue = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split('=')[1];

  if (!rawValue) {
    return null;
  }

  return decodeURIComponent(rawValue);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const localStorageToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (localStorageToken) {
    return localStorageToken;
  }

  return readCookie(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  if (typeof document !== 'undefined') {
    document.cookie = `${ACCESS_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=604800; samesite=lax`;
  }
}

export function clearAccessToken(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (typeof document !== 'undefined') {
    document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; samesite=lax`;
  }
}

export function hasAccessToken(): boolean {
  return Boolean(getAccessToken());
}
