const getApiBase = () => {
  let raw = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').trim();
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    raw = `https://${raw}`;
  }
  return raw.replace(/\/+$/, '');
};
const API_BASE = getApiBase();

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('nit_token') : null;
  const coordsStr = typeof window !== 'undefined' ? localStorage.getItem('nit_student_coords') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (coordsStr) {
    try {
      const coords = JSON.parse(coordsStr);
      if (coords.lat && coords.lng) {
        headers['x-student-lat'] = coords.lat.toString();
        headers['x-student-lng'] = coords.lng.toString();
      }
    } catch {
      // Ignored
    }
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'omit', // JWT Bearer token is used in header
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err: any) {
    throw err;
  }
}
