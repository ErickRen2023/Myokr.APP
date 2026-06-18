import client from './client';

interface AuthResponse<T> {
  code: number;
  message: string;
  data: T;
}

export function generateKey(): Promise<AuthResponse<{ secret_key: string; token: string; user_id: number }>> {
  return client.post('/auth/generate-key', {});
}

export function login(secret_key: string): Promise<AuthResponse<{ token: string; user_id: number }>> {
  return client.post('/auth/login', { secret_key });
}

export function resetKey(secret_key: string): Promise<AuthResponse<{ new_secret_key: string; token: string }>> {
  return client.post('/settings/reset-key', { secret_key });
}
