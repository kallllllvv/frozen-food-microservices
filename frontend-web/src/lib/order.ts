const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type RequestPayload = Record<string, unknown>;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Terjadi kesalahan saat memanggil API.');
  }

  return data as T;
}

export const createOrder = (payload: RequestPayload) => {
  return request<{ success: boolean; message: string; data: { id: number } }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getOrders = () => {
  return request<{ success: boolean; data: Array<Record<string, unknown>> }>('/api/orders');
};

export const getOrderById = (orderId: string | number) => {
  return request<{ success: boolean; data: Record<string, unknown> }>(`/api/orders/${orderId}`);
};