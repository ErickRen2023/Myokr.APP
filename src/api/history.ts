import client from './client';
import type { Cycle, Objective, ApiResponse } from '../types';

export function listHistoryCycles(): Promise<ApiResponse<{ cycles: Cycle[] }>> {
  return client.get('/history/cycles');
}

export function listHistoryObjectives(cycle_id: number): Promise<ApiResponse<{ objectives: Objective[] }>> {
  return client.get('/history/objectives', { params: { cycle_id } });
}
