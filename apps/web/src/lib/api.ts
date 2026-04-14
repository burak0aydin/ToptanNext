import { getAccessToken } from './auth-token';

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
};

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

  if (options.auth) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
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

  if (!response.ok || !payload || !('success' in payload) || !payload.success) {
    throw new Error(resolveApiMessage(payload));
  }

  return payload.data;
}
