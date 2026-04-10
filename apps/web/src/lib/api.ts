type ApiSuccessResponse<TData> = {
  success: true;
  data: TData;
};

type ApiErrorResponse = {
  success: false;
  error?: {
    message?: string;
  };
};

type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function resolveApiMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return 'Beklenmeyen bir sunucu hatası oluştu.';
  }

  const maybeError = payload as { error?: { message?: string } };
  return maybeError.error?.message ?? 'İstek işlenirken bir hata oluştu.';
}

export async function postJson<TBody, TData>(path: string, body: TBody): Promise<TData> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as ApiResponse<TData>;

  if (!response.ok || !payload.success) {
    throw new Error(resolveApiMessage(payload));
  }

  return payload.data;
}
