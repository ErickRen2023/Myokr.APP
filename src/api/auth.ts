import client from './client';

interface AuthResponse<T> {
  code: number;
  message: string;
  data: T;
}

export function getSsoResult(): Promise<AuthResponse<{
  status: 'authenticated';
  token: string;
  user_id: number;
  username?: string;
  avatar?: string;
}>> {
  return client.get('/auth/sso/result');
}
