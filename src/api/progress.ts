import client from './client';
import type { ApiResponse } from '../types';

export interface ProgressRecord {
  id: number;
  value: number;
  is_achieved: boolean;
  recorded_at: string;
}

export function listProgressRecords(key_result_id: number, limit?: number): Promise<ApiResponse<{ records: ProgressRecord[] }>> {
  return client.get('/progress-records', { params: { key_result_id, limit } });
}
