import { clearAccessToken, getAccessToken, setAccessToken } from './auth-token';

type ApiSuccessResponse<TData> = {
  success: true;
  data: TData;
};

type ApiErrorResponse = {
  success: false;
  error?: {
    message?: string;
  };
  message?: string | string[];
};

type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type RequestJsonOptions<TBody> = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: TBody;
  auth?: boolean;
  headers?: Record<string, string>;
  _retryAfterRefresh?: boolean;
};

let refreshTokenRequest: Promise<string | null> | null = null;

function resolveApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return 'Beklenmeyen bir sunucu hatası oluştu.';
  }

  const maybeError = payload as {
    error?: { message?: string };
    message?: string | string[];
  };

  if (typeof maybeError.error?.message === 'string' && maybeError.error.message.length > 0) {
    return maybeError.error.message;
  }

  if (typeof maybeError.message === 'string' && maybeError.message.length > 0) {
    return maybeError.message;
  }

  if (Array.isArray(maybeError.message) && maybeError.message.length > 0) {
    return maybeError.message.join(' ');
  }

  return 'İstek işlenirken bir hata oluştu.';
}

export async function postJson<TBody, TData>(path: string, body: TBody): Promise<TData> {
  return requestJson<TData, TBody>(path, {
    method: 'POST',
    body,
  });
}

export async function requestJson<TData, TBody = unknown>(
  path: string,
  options: RequestJsonOptions<TBody> = {},
): Promise<TData> {
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  if (options.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let hasAuthHeader = false;
  if (options.auth) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
      hasAuthHeader = true;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const responseText = await response.text();
  let payload: ApiResponse<TData> | null = null;

  if (responseText) {
    try {
      payload = JSON.parse(responseText) as ApiResponse<TData>;
    } catch {
      payload = null;
    }
  }

  if (response.status === 401 && options.auth && hasAuthHeader && !options._retryAfterRefresh) {
    const nextAccessToken = await refreshAccessToken();

    if (nextAccessToken) {
      return requestJson<TData, TBody>(path, {
        ...options,
        _retryAfterRefresh: true,
      });
    }
  }

  if (!response.ok || !payload || !('success' in payload) || !payload.success) {
    throw new Error(resolveApiMessage(payload));
  }

  return payload.data;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshTokenRequest) {
    return refreshTokenRequest;
  }

  refreshTokenRequest = (async () => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    let payload: ApiResponse<{ accessToken: string }> | null = null;

    if (responseText) {
      try {
        payload = JSON.parse(responseText) as ApiResponse<{ accessToken: string }>;
      } catch {
        payload = null;
      }
    }

    if (!response.ok || !payload || !('success' in payload) || !payload.success) {
      clearAccessToken();
      return null;
    }

    const nextAccessToken = payload.data.accessToken;
    setAccessToken(nextAccessToken);
    return nextAccessToken;
  })().finally(() => {
    refreshTokenRequest = null;
  });

  return refreshTokenRequest;
}
