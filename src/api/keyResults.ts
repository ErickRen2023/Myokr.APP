import client from './client';
import type { KeyResult, ApiResponse } from '../types';

export function listKeyResults(objective_id: string): Promise<ApiResponse<{ key_results: KeyResult[] }>> {
  return client.get('/key-results', { params: { objective_id } });
}

export function createKeyResult(data: {
  objective_id: number;
  title: string;
  description?: string;
  type: number;
  target?: Record<string, unknown>;
  milestones?: { description: string; sort_order: number }[];
  sort_order?: number;
}): Promise<ApiResponse<KeyResult>> {
  return client.post('/key-results/create', data);
}

export function updateKeyResult(data: {
  id: number;
  title?: string;
  description?: string;
  target?: Record<string, unknown>;
  sort_order?: number;
}): Promise<ApiResponse<KeyResult>> {
  return client.post('/key-results/update', data);
}

export function updateProgress(id: number, value: number, is_achieved?: boolean): Promise<ApiResponse<KeyResult>> {
  return client.post('/key-results/update-progress', { id, value, is_achieved });
}

export function toggleAchieved(id: number, is_achieved: number): Promise<ApiResponse<KeyResult>> {
  return client.post('/key-results/toggle-achieved', { id, is_achieved });
}

export function archiveKeyResult(id: number): Promise<ApiResponse<null>> {
  return client.post('/key-results/archive', { id });
}

export function reorderKeyResults(data: { id: number; sort_order: number }[]): Promise<ApiResponse<null>> {
  return client.post('/key-results/reorder', data);
}
