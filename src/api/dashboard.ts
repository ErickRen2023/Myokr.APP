import client from './client';
import type { DashboardData, ApiResponse } from '../types';

export function fetchDashboard(cycle_id: string): Promise<ApiResponse<DashboardData>> {
  return client.get('/dashboard', { params: { cycle_id } });
}
